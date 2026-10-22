import type { ReactNode } from 'react';
import { Provider } from 'react-redux';
import { act, installApiMock, jsonResponse, renderHook, waitFor } from '@test-utils';
import { makeStore } from '@/client-side.Commons/dataLayer/core/store';
import { getOutbox } from '@/client-side.Commons/dataLayer/outbox/outbox';
import { SetPrivateModeChangeListener, myUserLocationPrivacyApi, useGetOnceUserPrivacyMode, usePatchUserLocationPrivacy } from './myUserLocationPrivacyApi';

const PRIVACY_PATH = '/api/users/me/location-privacy';

const outboxes: ReturnType<typeof getOutbox>[] = [];
afterEach(() => {
  outboxes.splice(0).forEach((o) => o.stop());
  jest.restoreAllMocks();
  SetPrivateModeChangeListener(undefined);
});

async function startStore() {
  const store = makeStore({ autoBatch: false });
  const outbox = getOutbox(store);
  outboxes.push(outbox);
  const data = new Map<string, string>();
  outbox.start({
    storage: { getItem: async (k) => data.get(k) ?? null, setItem: async (k, v) => void data.set(k, v) },
    getUserId: () => 7,
  });
  await outbox.startSending();
  const wrapper = ({ children }: { children: ReactNode }) => <Provider store={store}>{children}</Provider>;
  return { store, outbox, wrapper };
}

describe('usePatchUserLocationPrivacy (offline-first)', () => {
  it('applies the mode on the device, updates the cache, and queues only the final value', async () => {
    const setPrivateMode = jest.fn();
    SetPrivateModeChangeListener({ SetPrivateMode: setPrivateMode });
    installApiMock({
      [`GET ${PRIVACY_PATH}`]: () => jsonResponse({ PrivacyMode: 0, LatestUpdate: 1 }),
      [`PATCH ${PRIVACY_PATH}`]: () => {
        throw new TypeError('Network request failed'); // phone is offline
      },
    });
    const { store, outbox, wrapper } = await startStore();
    await store.dispatch(myUserLocationPrivacyApi.endpoints.getUserLocationPrivacy.initiate());

    const { result } = renderHook(() => usePatchUserLocationPrivacy(), { wrapper });
    await act(async () => {
      await Promise.all([
        result.current({ PrivacyMode: 1 }),
        result.current({ PrivacyMode: 0 }),
        result.current({ PrivacyMode: 1 }),
      ]);
    });
    await outbox.flush();

    expect(setPrivateMode.mock.calls.map(([isPrivate]) => isPrivate)).toEqual([true, false, true]);
    expect(store.getState().outbox.items.map((i) => i.args)).toEqual([{ PrivacyMode: 1 }]);
    expect(myUserLocationPrivacyApi.endpoints.getUserLocationPrivacy.select()(store.getState()).data?.PrivacyMode).toBe(1);
  });
});

describe('useGetOnceUserPrivacyMode', () => {
  it('reads the shared cache once and ignores later changes', async () => {
    installApiMock({ [`GET ${PRIVACY_PATH}`]: () => jsonResponse({ PrivacyMode: 0, LatestUpdate: 1 }) });
    const { store, wrapper } = await startStore();
    const { result } = renderHook(() => useGetOnceUserPrivacyMode(), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toBe(false);

    await act(async () => {
      store.dispatch(
        myUserLocationPrivacyApi.util.upsertQueryData('getUserLocationPrivacy', undefined, { PrivacyMode: 1, LatestUpdate: 2 })
      );
    });
    expect(myUserLocationPrivacyApi.endpoints.getUserLocationPrivacy.select()(store.getState()).data?.PrivacyMode).toBe(1);
    expect(result.current.data).toBe(false);
  });
});
