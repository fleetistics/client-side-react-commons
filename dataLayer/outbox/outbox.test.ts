import { installApiMock, jsonResponse } from '@test-utils';
import { apiSlice } from '@/client-side.Commons/dataLayer/core/apiSlice';
import { makeStore } from '@/client-side.Commons/dataLayer/core/store';
import { userApi } from '@/app.Commons/dataLayer/api/user/myUserApi';
import { LocationService } from '@/app.Commons/services/location/locationService';
import { registerOfflineMutation } from './offlineMutation';
import { getOutbox } from './outbox';
import type { OutboxItem, OutboxPlatform } from './outboxTypes';

// A second, generic offline-first endpoint pair so ordering/failure behaviour can be tested
// on keys other than privacy's. 'append' keeps every call (unlike privacy's 'replace').
const noteApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getTestNote: builder.query<{ Id: number; Text: string }, number>({
      query: (id) => `test/notes/${id}`,
      providesTags: (_r, _e, id) => [{ type: 'User', id: `note-${id}` }],
    }),
    setTestNote: builder.mutation<{ Id: number; Text: string }, { id: number; text: string }>({
      query: ({ id, text }) => ({ url: `test/notes/${id}`, method: 'PUT', body: { Text: text } }),
    }),
  }),
});
registerOfflineMutation(noteApi.endpoints.setTestNote, {
  entityKeys: ({ id }) => [`User:note-${id}`], // entity keys are tags: same as getTestNote provides
  optimistic: ({ id, text }) => [
    { endpointName: 'getTestNote', queryArgs: id, apply: (draft) => void (draft.Text = text) },
  ],
});

const PRIVACY_PATH = '/api/users/me/location-privacy';
const USER_ID = 7;
const networkDown = () => {
  throw new TypeError('Network request failed');
};

function memoryPlatform(initial: OutboxItem[] | undefined, userId: number | undefined) {
  const data = new Map<string, string>();
  if (initial) data.set('outbox.v1', JSON.stringify({ version: 1, items: initial }));
  const platform: OutboxPlatform = {
    storage: {
      getItem: async (key) => data.get(key) ?? null,
      setItem: async (key, value) => void data.set(key, value),
    },
    getUserId: () => userId,
  };
  const persisted = (): OutboxItem[] => JSON.parse(data.get('outbox.v1') ?? '{"items":[]}').items;
  return { platform, persisted };
}

// `session: false` = no logged-in user yet (a default parameter can't express that: undefined means "use the default").
async function setup(initial?: OutboxItem[], options: { session?: boolean } = {}) {
  const store = makeStore({ autoBatch: false });
  const outbox = getOutbox(store);
  const { platform, persisted } = memoryPlatform(initial, options.session === false ? undefined : USER_ID);
  await outbox.start(platform);
  started.push(outbox);
  return { store, outbox, persisted };
}

const started: ReturnType<typeof getOutbox>[] = [];
afterEach(() => {
  started.splice(0).forEach((o) => o.stop());
  jest.restoreAllMocks();
});

const cachedPrivacy = (store: ReturnType<typeof makeStore>) =>
  userApi.endpoints.getUserLocationPrivacy.select()(store.getState()).data;

const refetchPrivacy = (store: ReturnType<typeof makeStore>) =>
  store.dispatch(userApi.endpoints.getUserLocationPrivacy.initiate(undefined, { forceRefetch: true }));

describe('Outbox (offline-first mutations)', () => {
  it('shows a change at once, keeps it across refetches, and sends it once the server is reachable', async () => {
    let serverMode = 0;
    const api = installApiMock({
      [`GET ${PRIVACY_PATH}`]: () => jsonResponse({ PrivacyMode: serverMode, LatestUpdate: 1 }),
      [`PATCH ${PRIVACY_PATH}`]: networkDown,
    });
    const { store, outbox, persisted } = await setup();
    await refetchPrivacy(store);
    expect(cachedPrivacy(store)?.PrivacyMode).toBe(0);

    await outbox.enqueue(userApi.endpoints.patchUserLocationPrivacy, { PrivacyMode: 1 });
    await outbox.flush();

    // Offline: visible locally, persisted, not lost.
    expect(cachedPrivacy(store)?.PrivacyMode).toBe(1);
    expect(persisted()).toHaveLength(1);
    expect(store.getState().outbox.items[0]).toMatchObject({ status: 'pending', attempts: 1 });

    // A refetch returns the server's old value - the pending change is put back on top.
    await refetchPrivacy(store);
    expect(cachedPrivacy(store)?.PrivacyMode).toBe(1);

    // Server reachable again, some seconds later: the next successful request triggers a send
    // without waiting out the backoff.
    const now = Date.now();
    jest.spyOn(Date, 'now').mockReturnValue(now + 6_000);
    api.fetchMock.mockImplementation(async (req: Request) => {
      const pathname = new URL(req.url).pathname;
      if (req.method === 'PATCH') {
        serverMode = (JSON.parse(await req.text()) as { PrivacyMode: number }).PrivacyMode;
        return jsonResponse({ PrivacyMode: serverMode, LatestUpdate: 2 });
      }
      if (pathname === PRIVACY_PATH) return jsonResponse({ PrivacyMode: serverMode, LatestUpdate: 2 });
      throw new Error(`unexpected ${req.method} ${pathname}`);
    });
    await refetchPrivacy(store);
    await outbox.flush();

    expect(serverMode).toBe(1);
    expect(store.getState().outbox.items).toEqual([]);
    expect(persisted()).toEqual([]);
    expect(cachedPrivacy(store)?.PrivacyMode).toBe(1);
  });

  it('does not retry in a loop when reads succeed but the queued write keeps failing', async () => {
    // A failed replay still invalidates the mutation's tags, so its own refetch succeeds at
    // once. That success must not count as "server reachable, retry now" - it would loop.
    let patchCalls = 0;
    installApiMock({
      [`GET ${PRIVACY_PATH}`]: () => jsonResponse({ PrivacyMode: 0, LatestUpdate: 1 }),
      [`PATCH ${PRIVACY_PATH}`]: () => {
        patchCalls += 1;
        // Safety valve so a regression fails this assertion instead of hanging the run.
        if (patchCalls > 20) return jsonResponse({ PrivacyMode: 1, LatestUpdate: 2 });
        throw new TypeError('Network request failed');
      },
    });
    const { store, outbox } = await setup();
    await refetchPrivacy(store);

    await outbox.enqueue(userApi.endpoints.patchUserLocationPrivacy, { PrivacyMode: 1 });
    await outbox.flush();
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(patchCalls).toBe(3); // one attempt = 1 request + apiSlice's 2 transient retries
    expect(store.getState().outbox.items[0]).toMatchObject({ status: 'pending', attempts: 1 });
  });

  it('applies the optimistic change synchronously, before the storage write finishes', async () => {
    installApiMock({
      [`GET ${PRIVACY_PATH}`]: () => jsonResponse({ PrivacyMode: 0, LatestUpdate: 1 }),
      [`PATCH ${PRIVACY_PATH}`]: networkDown,
    });
    const { store, outbox } = await setup();
    await refetchPrivacy(store);

    const enqueued = outbox.enqueue(userApi.endpoints.patchUserLocationPrivacy, { PrivacyMode: 1 });
    expect(cachedPrivacy(store)?.PrivacyMode).toBe(1); // no await yet
    await enqueued;
    await outbox.flush();
  });

  it("coalesces repeated privacy switches into the latest value ('replace')", async () => {
    installApiMock({
      [`GET ${PRIVACY_PATH}`]: () => jsonResponse({ PrivacyMode: 0, LatestUpdate: 1 }),
      [`PATCH ${PRIVACY_PATH}`]: networkDown,
    });
    const { outbox, persisted } = await setup();

    await outbox.enqueue(userApi.endpoints.patchUserLocationPrivacy, { PrivacyMode: 1 });
    await outbox.flush();
    await outbox.enqueue(userApi.endpoints.patchUserLocationPrivacy, { PrivacyMode: 0 });
    await outbox.enqueue(userApi.endpoints.patchUserLocationPrivacy, { PrivacyMode: 1 });
    await outbox.flush();

    expect(persisted()).toHaveLength(1);
    expect(persisted()[0].args).toEqual({ PrivacyMode: 1 });
  });

  it('replays a queue persisted before an app restart, applying it over the freshly loaded value first', async () => {
    const queued: OutboxItem = {
      operationId: 'op-1',
      endpointName: 'patchUserLocationPrivacy',
      args: { PrivacyMode: 1 },
      entityKeys: ['UserLocationPrivacy:ME'],
      userId: USER_ID,
      createdAt: 1,
      status: 'sending', // was in flight when the app died -> treated as pending
      attempts: 1,
    };
    let patchBody: unknown;
    installApiMock({
      [`GET ${PRIVACY_PATH}`]: () => jsonResponse({ PrivacyMode: 0, LatestUpdate: 1 }),
      [`PATCH ${PRIVACY_PATH}`]: (req) => {
        patchBody = req.body;
        return jsonResponse({ PrivacyMode: 1, LatestUpdate: 2 });
      },
    });
    const { store, outbox, persisted } = await setup([queued]);
    await outbox.flush();

    expect(patchBody).toEqual({ PrivacyMode: 1 });
    expect(persisted()).toEqual([]);
    await refetchPrivacy(store);
    expect(cachedPrivacy(store)?.PrivacyMode).toBe(0); // queue empty: server truth, nothing re-applied
  });

  it("never sends or applies another user's queued items", async () => {
    const othersItem: OutboxItem = {
      operationId: 'op-other',
      endpointName: 'patchUserLocationPrivacy',
      args: { PrivacyMode: 1 },
      entityKeys: ['UserLocationPrivacy:ME'],
      userId: 99,
      createdAt: 1,
      status: 'pending',
      attempts: 0,
    };
    const api = installApiMock({
      [`GET ${PRIVACY_PATH}`]: () => jsonResponse({ PrivacyMode: 0, LatestUpdate: 1 }),
    });
    const { store, outbox, persisted } = await setup([othersItem]);
    await refetchPrivacy(store);
    await outbox.flush();

    expect(api.requests.map((r) => r.method)).toEqual(['GET']);
    expect(cachedPrivacy(store)?.PrivacyMode).toBe(0);
    expect(persisted()).toHaveLength(1); // kept for when that user logs back in
  });

  it('holds back later items for a rejected entity, but not items for other entities', async () => {
    const puts: string[] = [];
    installApiMock({
      [`PUT /api/test/notes/1`]: (req) => {
        puts.push(`1:${(req.body as { Text: string }).Text}`);
        return jsonResponse({ message: 'invalid' }, 400);
      },
      [`PUT /api/test/notes/2`]: (req) => {
        puts.push(`2:${(req.body as { Text: string }).Text}`);
        return jsonResponse({ Id: 2, Text: (req.body as { Text: string }).Text });
      },
      [`GET /api/test/notes/1`]: () => jsonResponse({ Id: 1, Text: 'server' }),
    });
    const { store, outbox } = await setup();

    await outbox.enqueue(noteApi.endpoints.setTestNote, { id: 1, text: 'a' });
    await outbox.enqueue(noteApi.endpoints.setTestNote, { id: 1, text: 'b' });
    await outbox.enqueue(noteApi.endpoints.setTestNote, { id: 2, text: 'c' });
    await outbox.flush();

    // One bad record doesn't block the whole queue - only its own entity.
    expect(puts).toEqual(['1:a', '2:c']);
    const items = store.getState().outbox.items;
    expect(items.map((i) => [i.args, i.status])).toEqual([
      [{ id: 1, text: 'a' }, 'failed'],
      [{ id: 1, text: 'b' }, 'pending'],
    ]);
    expect(items[0].lastError).toContain('400');

    // Discarding the rejected item releases the one behind it.
    await outbox.discard(items[0].operationId);
    await outbox.flush();
    expect(puts).toEqual(['1:a', '2:c', '1:b']);
  });

  it('brings LocationService back in line when the server refuses a privacy change', async () => {
    const setPrivateMode = jest.spyOn(LocationService, 'SetPrivateMode').mockImplementation(() => {});
    installApiMock({
      [`GET ${PRIVACY_PATH}`]: () => jsonResponse({ PrivacyMode: 0, LatestUpdate: 1 }),
      [`PATCH ${PRIVACY_PATH}`]: () => jsonResponse({ message: 'nope' }, 422),
    });
    const { store, outbox } = await setup();
    await refetchPrivacy(store);

    await outbox.enqueue(userApi.endpoints.patchUserLocationPrivacy, { PrivacyMode: 1 });
    await outbox.flush();

    expect(store.getState().outbox.items[0].status).toBe('failed');
    expect(cachedPrivacy(store)?.PrivacyMode).toBe(0);
    expect(setPrivateMode).toHaveBeenLastCalledWith(false);
  });

  it('waits for a session before sending anything', async () => {
    const api = installApiMock({});
    const queued: OutboxItem = {
      operationId: 'op-2',
      endpointName: 'patchUserLocationPrivacy',
      args: { PrivacyMode: 1 },
      entityKeys: ['UserLocationPrivacy:ME'],
      userId: USER_ID,
      createdAt: 1,
      status: 'pending',
      attempts: 0,
    };
    const { outbox } = await setup([queued], { session: false });
    await outbox.flush();
    expect(api.requests).toEqual([]);
  });
});
