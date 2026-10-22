import { installApiMock, jsonResponse } from '@test-utils';
import { apiSlice, setOnAuthLost } from '@/client-side.Commons/dataLayer/core/apiSlice';
import { makeStore } from '@/client-side.Commons/dataLayer/core/store';
import { SetPrivateModeChangeListener, myUserLocationPrivacyApi } from '@/client-side.Commons/dataLayer/api/user/myUserLocationPrivacyApi';
import { getOfflineMutation, registerOfflineMutation } from './offlineMutation';
import { clearOutbox, getOutbox } from './outbox';
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

function memoryPlatform(initial: OutboxItem[] | undefined, userId: number | undefined, isOfflineMode?: boolean) {
  const data = new Map<string, string>();
  if (initial) data.set('outbox.v1', JSON.stringify({ version: 1, items: initial }));
  const platform: OutboxPlatform = {
    storage: {
      getItem: async (key) => data.get(key) ?? null,
      setItem: async (key, value) => void data.set(key, value),
    },
    getUserId: () => userId,
    isOfflineMode,
  };
  const persisted = (): OutboxItem[] => JSON.parse(data.get('outbox.v1') ?? '{"items":[]}').items;
  return { platform, persisted };
}

// `session: false` = no logged-in user yet (a default parameter can't express that: undefined means "use the default").
async function setup(initial?: OutboxItem[], options: { session?: boolean; isOfflineMode?: boolean } = {}) {
  const store = makeStore({ autoBatch: false });
  const outbox = getOutbox(store);
  const { platform, persisted } = memoryPlatform(initial, options.session === false ? undefined : USER_ID, options.isOfflineMode);
  outbox.start(platform);
  await outbox.startSending();
  started.push(outbox);
  return { store, outbox, persisted };
}

const started: ReturnType<typeof getOutbox>[] = [];
afterEach(() => {
  started.splice(0).forEach((o) => o.stop());
  jest.restoreAllMocks();
  SetPrivateModeChangeListener(undefined);
});

const cachedPrivacy = (store: ReturnType<typeof makeStore>) =>
  myUserLocationPrivacyApi.endpoints.getUserLocationPrivacy.select()(store.getState()).data;

const refetchPrivacy = (store: ReturnType<typeof makeStore>) =>
  store.dispatch(myUserLocationPrivacyApi.endpoints.getUserLocationPrivacy.initiate(undefined, { forceRefetch: true }));

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

    await outbox.enqueue(myUserLocationPrivacyApi.endpoints.patchUserLocationPrivacy, { PrivacyMode: 1 });
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

    await outbox.enqueue(myUserLocationPrivacyApi.endpoints.patchUserLocationPrivacy, { PrivacyMode: 1 });
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

    const enqueued = outbox.enqueue(myUserLocationPrivacyApi.endpoints.patchUserLocationPrivacy, { PrivacyMode: 1 });
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

    await outbox.enqueue(myUserLocationPrivacyApi.endpoints.patchUserLocationPrivacy, { PrivacyMode: 1 });
    await outbox.flush();
    await outbox.enqueue(myUserLocationPrivacyApi.endpoints.patchUserLocationPrivacy, { PrivacyMode: 0 });
    await outbox.enqueue(myUserLocationPrivacyApi.endpoints.patchUserLocationPrivacy, { PrivacyMode: 1 });
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

  it('clearOutbox() drops everything saved - from memory and storage - and refetches what it touched', async () => {
    let serverText = 'server';
    const api = installApiMock({
      [`GET /api/test/notes/1`]: () => jsonResponse({ Id: 1, Text: serverText }),
      [`PUT /api/test/notes/1`]: networkDown,
    });
    const { store, outbox, persisted } = await setup();
    await store.dispatch(noteApi.endpoints.getTestNote.initiate(1));
    await outbox.enqueue(noteApi.endpoints.setTestNote, { id: 1, text: 'a' });
    await outbox.flush();
    const note = () => noteApi.endpoints.getTestNote.select(1)(store.getState()).data?.Text;
    expect(note()).toBe('a');
    expect(persisted()).toHaveLength(1);

    const putsBefore = api.requests.filter((r) => r.method === 'PUT').length;
    serverText = 'fresh';
    await clearOutbox();
    await outbox.flush();

    expect(store.getState().outbox.items).toEqual([]);
    expect(persisted()).toEqual([]);
    await jest.requireActual<typeof import('timers/promises')>('timers/promises').setImmediate();
    expect(note()).toBe('fresh'); // the optimistic value is gone, the tags were refetched
    expect(api.requests.filter((r) => r.method === 'PUT')).toHaveLength(putsBefore); // nothing sent after the clear
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
    const setPrivateMode = jest.fn();
    SetPrivateModeChangeListener({ SetPrivateMode: setPrivateMode });
    installApiMock({
      [`GET ${PRIVACY_PATH}`]: () => jsonResponse({ PrivacyMode: 0, LatestUpdate: 1 }),
      [`PATCH ${PRIVACY_PATH}`]: () => jsonResponse({ message: 'nope' }, 422),
    });
    const { store, outbox } = await setup();
    await refetchPrivacy(store);

    await outbox.enqueue(myUserLocationPrivacyApi.endpoints.patchUserLocationPrivacy, { PrivacyMode: 1 });
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
      createdAt: 1,
      status: 'pending',
      attempts: 0,
    };
    const { outbox } = await setup([queued], { session: false });
    await outbox.flush();
    expect(api.requests).toEqual([]);
  });
});

describe('Outbox online mode (isOfflineMode: false)', () => {
  it('calls the server at once, resolves with the result and leaves nothing queued', async () => {
    let putBody: unknown;
    installApiMock({
      [`PUT /api/test/notes/1`]: (req) => {
        putBody = req.body;
        return jsonResponse({ Id: 1, Text: 'saved' });
      },
      [`GET /api/test/notes/1`]: () => jsonResponse({ Id: 1, Text: 'server' }),
    });
    const { store, outbox, persisted } = await setup(undefined, { isOfflineMode: false });
    expect(store.getState().outbox.hydrated).toBe(true);

    const result = await outbox.enqueue(noteApi.endpoints.setTestNote, { id: 1, text: 'a' });

    expect(result).toEqual({ Id: 1, Text: 'saved' });
    expect(putBody).toEqual({ Text: 'a' });
    expect(store.getState().outbox.items).toEqual([]);
    expect(persisted()).toEqual([]);
  });

  it('rejects with the standard RTK Query error and queues nothing', async () => {
    installApiMock({
      [`PUT /api/test/notes/1`]: () => jsonResponse({ message: 'invalid' }, 400),
    });
    const { store, outbox, persisted } = await setup(undefined, { isOfflineMode: false });

    await expect(outbox.enqueue(noteApi.endpoints.setTestNote, { id: 1, text: 'a' })).rejects.toMatchObject({
      status: 400,
      data: { message: 'invalid' },
    });
    expect(store.getState().outbox.items).toEqual([]);
    expect(persisted()).toEqual([]);
  });

  it('does not apply the optimistic recipe', async () => {
    installApiMock({
      [`GET /api/test/notes/1`]: () => jsonResponse({ Id: 1, Text: 'server' }),
      [`PUT /api/test/notes/1`]: () => jsonResponse({ message: 'invalid' }, 400),
    });
    const { store, outbox } = await setup(undefined, { isOfflineMode: false });
    await store.dispatch(noteApi.endpoints.getTestNote.initiate(1));

    await outbox.enqueue(noteApi.endpoints.setTestNote, { id: 1, text: 'a' }).catch(() => {});

    expect(noteApi.endpoints.getTestNote.select(1)(store.getState()).data?.Text).toBe('server');
  });
});

// Its reconcile callback throws - a bug there must not be mistaken for a failed send.
const reconcileApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    setTestReconcile: builder.mutation<{ Id: number }, { id: number }>({
      query: ({ id }) => ({ url: `test/reconcile/${id}`, method: 'PUT', body: {} }),
    }),
  }),
});
const onReconcilePermanentFailure = jest.fn();
registerOfflineMutation(reconcileApi.endpoints.setTestReconcile, {
  entityKeys: ({ id }) => [`User:reconcile-${id}`],
  reconcile: () => {
    throw new Error('reconcile bug');
  },
  onPermanentFailure: onReconcilePermanentFailure,
});

// Both of its app callbacks throw - neither may take the queue down.
const badApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    setTestBad: builder.mutation<{ Id: number }, { id: number }>({
      query: ({ id }) => ({ url: `test/bad/${id}`, method: 'PUT', body: {} }),
    }),
  }),
});
registerOfflineMutation(badApi.endpoints.setTestBad, {
  entityKeys: ({ id }) => [`User:bad-${id}`],
  optimistic: () => {
    throw new Error('recipe bug');
  },
  onPermanentFailure: () => {
    throw new Error('callback bug');
  },
});

// A 'replace' endpoint (only the latest value matters) for the supersede case.
const flagApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    setTestFlag: builder.mutation<{ On: boolean }, { id: number; on: boolean }>({
      query: ({ id, on }) => ({ url: `test/flags/${id}`, method: 'PUT', body: { On: on } }),
    }),
  }),
});
registerOfflineMutation(flagApi.endpoints.setTestFlag, {
  entityKeys: ({ id }) => [`User:flag-${id}`],
  coalesce: 'replace',
});

describe('Outbox reconcile errors', () => {
  beforeEach(() => onReconcilePermanentFailure.mockClear());

  it('offline: a throwing reconcile is logged, the sent item stays removed and onPermanentFailure is not called', async () => {
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    const errorLog = jest.spyOn(console, 'error').mockImplementation(() => {});
    installApiMock({ [`PUT /api/test/reconcile/1`]: () => jsonResponse({ Id: 1 }) });
    const { outbox, store, persisted } = await setup();

    await outbox.enqueue(reconcileApi.endpoints.setTestReconcile, { id: 1 });
    await outbox.flush();

    expect(store.getState().outbox.items).toEqual([]);
    expect(persisted()).toEqual([]);
    expect(onReconcilePermanentFailure).not.toHaveBeenCalled();
    expect(errorLog).toHaveBeenCalledWith(expect.stringContaining('reconcile threw'), expect.any(Error));
  });

  it('online: a throwing reconcile does not reject a call the server accepted', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    installApiMock({ [`PUT /api/test/reconcile/1`]: () => jsonResponse({ Id: 1 }) });
    const { outbox } = await setup(undefined, { isOfflineMode: false });

    await expect(outbox.enqueue(reconcileApi.endpoints.setTestReconcile, { id: 1 })).resolves.toEqual({ Id: 1 });
  });
});

describe('Outbox retry policy (offline mode)', () => {
  // Backoff is wall-clock based: each pass runs "200s later" so nothing is still waiting.
  function clock() {
    let now = Date.now();
    const spy = jest.spyOn(Date, 'now');
    return async (outbox: ReturnType<typeof getOutbox>) => {
      now += 200_000;
      spy.mockReturnValue(now);
      await outbox.flush();
    };
  }
  const quiet = () => {
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    return jest.spyOn(console, 'error').mockImplementation(() => {});
  };

  it('keeps resending a network failure endlessly', async () => {
    quiet();
    installApiMock({ [`PUT /api/test/notes/1`]: networkDown });
    const { outbox, store } = await setup();
    const pass = clock();
    await outbox.enqueue(noteApi.endpoints.setTestNote, { id: 1, text: 'a' });
    await outbox.flush();
    for (let i = 0; i < 8; i++) await pass(outbox);

    expect(store.getState().outbox.items).toHaveLength(1);
    expect(store.getState().outbox.items[0]).toMatchObject({ status: 'pending' });
    expect(store.getState().outbox.items[0].attempts).toBeGreaterThan(8);
  });

  it('retries a 5xx four times, then drops the item and logs the error', async () => {
    const errorLog = quiet();
    installApiMock({
      [`PUT /api/test/notes/1`]: () => jsonResponse({ message: 'boom' }, 500),
      [`GET /api/test/notes/1`]: () => jsonResponse({ Id: 1, Text: 'server' }),
    });
    const { outbox, store, persisted } = await setup();
    const pass = clock();
    await outbox.enqueue(noteApi.endpoints.setTestNote, { id: 1, text: 'a' });
    await outbox.flush();
    expect(store.getState().outbox.items[0].serverErrors).toBe(1);

    for (const expected of [2, 3, 4]) {
      await pass(outbox);
      expect(store.getState().outbox.items[0]).toMatchObject({ status: 'pending', serverErrors: expected });
    }
    expect(errorLog).not.toHaveBeenCalled();

    await pass(outbox); // the 4th retry fails too
    expect(store.getState().outbox.items).toEqual([]);
    expect(persisted()).toEqual([]);
    expect(errorLog).toHaveBeenCalledWith(expect.stringContaining('dropped after 5 server errors'));
  });

  it('calls the auth-lost handler on a 401 and stops resending', async () => {
    quiet();
    const authLost = jest.fn();
    setOnAuthLost(authLost);
    const api = installApiMock({
      [`PUT /api/test/notes/1`]: () => jsonResponse({ message: 'no' }, 401),
      [`POST /api/auth_auto/refresh`]: () => jsonResponse({ message: 'no' }, 401),
      [`POST /api/auth/refresh`]: () => jsonResponse({ message: 'no' }, 401),
    });
    const { outbox, store } = await setup();
    const pass = clock();
    try {
      await outbox.enqueue(noteApi.endpoints.setTestNote, { id: 1, text: 'a' });
      await outbox.flush();
      expect(authLost).toHaveBeenCalled();
      expect(store.getState().outbox.items[0]).toMatchObject({ status: 'pending' });

      // Parked: nothing more goes out until the park time has passed.
      const sent = api.requests.length;
      await outbox.flush();
      expect(api.requests.length).toBe(sent);
      await pass(outbox);
      expect(api.requests.length).toBeGreaterThan(sent);
    } finally {
      setOnAuthLost(null);
    }
  });

  it('gives a newer superseding item its own attempt when the in-flight one fails on the network', async () => {
    quiet();
    let release!: () => void;
    const gate = new Promise<void>((resolve) => (release = resolve));
    installApiMock({
      [`PUT /api/test/flags/1`]: async () => {
        await gate;
        throw new TypeError('Network request failed');
      },
    });
    const { outbox, store } = await setup();

    await outbox.enqueue(flagApi.endpoints.setTestFlag, { id: 1, on: true }); // goes in flight, held by the gate
    await new Promise((r) => setTimeout(r, 0));
    await outbox.enqueue(flagApi.endpoints.setTestFlag, { id: 1, on: false }); // queued behind it
    release();
    await outbox.flush();

    // The first item is dropped as superseded; the newer one was tried in the same pass (attempts: 1)
    // and is waiting on a retry timer instead of being stranded with no trigger.
    const items = store.getState().outbox.items;
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({ args: { id: 1, on: false }, status: 'pending', attempts: 1 });
  });

  it('counts only consecutive 5xx: any other failure starts the count over', async () => {
    quiet();
    let calls = 0;
    installApiMock({
      [`PUT /api/test/notes/1`]: () => {
        calls += 1;
        return calls <= 6 ? jsonResponse({ message: 'boom' }, 500) : networkDown();
      },
    });
    const { outbox, store } = await setup();
    const pass = clock();
    await outbox.enqueue(noteApi.endpoints.setTestNote, { id: 1, text: 'a' });
    await outbox.flush(); // 5xx (each pass is 1 + 2 inner retries = 3 requests)
    await pass(outbox); // 5xx
    expect(store.getState().outbox.items[0].serverErrors).toBe(2);

    await pass(outbox); // network error
    expect(store.getState().outbox.items[0]).toMatchObject({ status: 'pending', serverErrors: 0 });
  });

  it('survives app callbacks that throw: a bad recipe on a saved item, a bad onPermanentFailure', async () => {
    const errorLog = quiet();
    installApiMock({
      [`PUT /api/test/bad/1`]: () => jsonResponse({ message: 'no' }, 400),
      [`PUT /api/test/bad/2`]: () => jsonResponse({ Id: 2 }),
      [`PUT /api/test/notes/3`]: () => jsonResponse({ Id: 3, Text: 'x' }),
    });
    const saved: OutboxItem = {
      operationId: 'op-bad-2',
      endpointName: 'setTestBad',
      args: { id: 2 },
      entityKeys: ['User:bad-2'],
      createdAt: 1,
      status: 'pending',
      attempts: 0,
    };
    // Loading the saved queue runs the throwing recipe: it must still finish loading and send.
    const { outbox, store } = await setup([saved]);
    await outbox.flush();
    expect(store.getState().outbox.hydrated).toBe(true);
    expect(store.getState().outbox.items).toEqual([]);

    // A rejected item whose onPermanentFailure throws must not stop the items behind it.
    await outbox.enqueue(badApi.endpoints.setTestBad, { id: 1 });
    await outbox.enqueue(noteApi.endpoints.setTestNote, { id: 3, text: 'x' });
    await outbox.flush();
    expect(store.getState().outbox.items.map((i) => [i.endpointName, i.status])).toEqual([['setTestBad', 'failed']]);
    expect(errorLog).toHaveBeenCalledWith(expect.stringContaining('optimistic recipe'), expect.any(Error));
    expect(errorLog).toHaveBeenCalledWith(expect.stringContaining('onPermanentFailure threw'), expect.any(Error));
  });

  it.each([
    ['a permanent rejection', () => jsonResponse({ message: 'no' }, 400)],
    ['a server error', () => jsonResponse({ message: 'boom' }, 500)],
    ['a network failure', () => networkDown()],
  ])('ignores %s that arrives after clear(): no callback, no retry timer', async (_name, answer) => {
    quiet();
    let release!: () => void;
    const gate = new Promise<void>((resolve) => (release = resolve));
    installApiMock({
      [`PUT /api/test/bad/1`]: async () => {
        await gate;
        return answer();
      },
    });
    const onPermanentFailure = jest.fn();
    const def = getOfflineMutation('setTestBad')!.def;
    const original = def.onPermanentFailure;
    def.onPermanentFailure = onPermanentFailure;
    try {
      const { outbox, store, persisted } = await setup();
      await outbox.enqueue(badApi.endpoints.setTestBad, { id: 1 }); // in flight, held by the gate
      await new Promise((r) => setTimeout(r, 0));
      expect(store.getState().outbox.items[0].status).toBe('sending');

      await outbox.clear();
      release();
      await outbox.flush();

      expect(store.getState().outbox.items).toEqual([]);
      expect(persisted()).toEqual([]);
      expect(onPermanentFailure).not.toHaveBeenCalled();
      // Nothing was scheduled for the cleared item (private fields, read to prove no timer leaks).
      const internals = outbox as unknown as { retryTimer?: unknown; backoff: Map<string, unknown> };
      expect(internals.retryTimer).toBeUndefined();
      expect(internals.backoff.size).toBe(0);    } finally {
      def.onPermanentFailure = original;
    }
  });
});

describe('Outbox saved queue (start / startSending)', () => {
  const saved = (id: number, text: string): OutboxItem => ({
    operationId: `op-${id}`,
    endpointName: 'setTestNote',
    args: { id, text },
    entityKeys: [`User:note-${id}`],
    createdAt: id,
    status: 'pending',
    attempts: 0,
  });
  const ok = (id: number) => ({ [`PUT /api/test/notes/${id}`]: () => jsonResponse({ Id: id, Text: 'x' }) });

  it('loads and sends nothing until startSending()', async () => {
    const api = installApiMock(ok(1));
    const store = makeStore({ autoBatch: false });
    const outbox = getOutbox(store);
    started.push(outbox);
    const { platform, persisted } = memoryPlatform([saved(1, 'a')], USER_ID);

    outbox.start(platform);
    await new Promise((r) => setTimeout(r, 10));
    expect(store.getState().outbox.hydrated).toBe(false);
    expect(api.requests).toEqual([]);

    await outbox.startSending();
    await outbox.flush();
    expect(store.getState().outbox.hydrated).toBe(true);
    expect(api.requests.map((r) => r.method)).toEqual(['PUT']);
    expect(persisted()).toEqual([]);
  });

  it('works in the other order too (the session can be ready before start() runs)', async () => {
    const api = installApiMock(ok(1));
    const store = makeStore({ autoBatch: false });
    const outbox = getOutbox(store);
    started.push(outbox);
    const { platform } = memoryPlatform([saved(1, 'a')], USER_ID);

    const loaded = outbox.startSending();
    outbox.start(platform);
    await loaded;
    await outbox.flush();
    expect(api.requests.map((r) => r.method)).toEqual(['PUT']);
  });

  it('keeps the saved queue when something is enqueued before it has been loaded', async () => {
    installApiMock({
      [`PUT /api/test/notes/1`]: networkDown,
      [`PUT /api/test/notes/2`]: networkDown,
    });
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    const store = makeStore({ autoBatch: false });
    const outbox = getOutbox(store);
    started.push(outbox);
    const { platform, persisted } = memoryPlatform([saved(1, 'a')], USER_ID);
    outbox.start(platform);

    const enqueued = outbox.enqueue(noteApi.endpoints.setTestNote, { id: 2, text: 'b' }); // waits for the load
    await new Promise((r) => setTimeout(r, 10));
    expect(persisted().map((i) => i.args)).toEqual([{ id: 1, text: 'a' }]); // not overwritten

    await outbox.startSending();
    await enqueued;
    expect(persisted().map((i) => i.args)).toEqual([
      { id: 1, text: 'a' },
      { id: 2, text: 'b' },
    ]);
  });

  it('clearOutbox() before the session wipes the saved queue, so it is never loaded', async () => {
    const api = installApiMock(ok(1));
    const store = makeStore({ autoBatch: false });
    const outbox = getOutbox(store);
    started.push(outbox);
    const { platform, persisted } = memoryPlatform([saved(1, 'a')], USER_ID);
    outbox.start(platform);

    await clearOutbox(); // e.g. a different user logging in
    expect(persisted()).toEqual([]);

    await outbox.startSending();
    await outbox.flush();
    expect(store.getState().outbox.items).toEqual([]);
    expect(api.requests).toEqual([]);
  });
});

describe('Outbox response handling', () => {
  it('treats a 2xx with a non-JSON body as accepted - offline and online', async () => {
    installApiMock({ [`PUT /api/test/notes/1`]: () => new Response('OK', { status: 200 }) });
    const offline = await setup();
    await offline.outbox.enqueue(noteApi.endpoints.setTestNote, { id: 1, text: 'a' });
    await offline.outbox.flush();
    expect(offline.store.getState().outbox.items).toEqual([]); // not marked failed

    const online = await setup(undefined, { isOfflineMode: false });
    await expect(online.outbox.enqueue(noteApi.endpoints.setTestNote, { id: 1, text: 'a' })).resolves.toBeUndefined();
  });

  it("does not leave a rejected item blocking the newer value queued behind it ('replace')", async () => {
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    let release!: () => void;
    const gate = new Promise<void>((resolve) => (release = resolve));
    installApiMock({
      [`PUT /api/test/flags/1`]: async () => {
        await gate;
        return jsonResponse({ message: 'no' }, 400);
      },
    });
    const { outbox, store } = await setup();

    await outbox.enqueue(flagApi.endpoints.setTestFlag, { id: 1, on: true }); // in flight, held by the gate
    await new Promise((r) => setTimeout(r, 0));
    await outbox.enqueue(flagApi.endpoints.setTestFlag, { id: 1, on: false }); // queued behind it
    release();
    await outbox.flush();

    // The stale first item is dropped; only the newer one remains (and got its own answer).
    const items = store.getState().outbox.items;
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({ args: { id: 1, on: false }, status: 'failed' });
  });
});
