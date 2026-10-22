import { useCallback, useState } from 'react';
import { apiSlice } from '@/client-side.Commons/dataLayer/core/apiSlice';
import { registerOfflineMutation } from '@/client-side.Commons/dataLayer/outbox/offlineMutation';
import { useOfflineMutation, useOutboxHydrated } from '@/client-side.Commons/dataLayer/outbox/outboxHooks';
import type { IPrivateModeChangeListener } from '@/client-side.Commons/lib/private-mode-change-listener';

import type { UserLocationPrivacyDto, UserLocationPrivacyPatch } from '../../model/user/userLocationPrivacyDto';
import { APP_CONFIG } from '@/client-side.Impl/config/app-config';
const LOCATION_PRIVACY_URL = APP_CONFIG.BASE_API_URL + 'users/me/location-privacy';

export const myUserLocationPrivacyApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // Standard auto-caching/refetching query — subscribers see fresh data whenever
    // patchUserLocationPrivacy's invalidatesTags fires. A 404 (no record yet for this
    // user) is a normal, expected outcome here, not an error, so this uses a custom
    // queryFn to turn it into `data: null` instead of letting it surface as `error`.
    getMyUserLocationPrivacy: builder.query<UserLocationPrivacyDto | null, void>({
      queryFn: async (_arg, _api, _extraOptions, baseQuery) => {
        const result = await baseQuery(LOCATION_PRIVACY_URL);
        if (result.error) {
          if (result.error.status === 404) return { data: null };
          return { error: result.error };
        }
        return { data: result.data as UserLocationPrivacyDto };
      },
      providesTags: [{ type: 'UserLocationPrivacy', id: 'ME' }],
    }),

    patchUserLocationPrivacy: builder.mutation<UserLocationPrivacyDto, UserLocationPrivacyPatch>({
      query: (patch) => ({
        url: LOCATION_PRIVACY_URL,
        method: 'PATCH',
        body: patch,
      }),
      invalidatesTags: [{ type: 'UserLocationPrivacy', id: 'ME' }],
    }),
  })
});

const { useGetMyUserLocationPrivacyQuery } = myUserLocationPrivacyApi;

/** Outbox entity key (and tag) for the current user's location-privacy record. */
export const PRIVACY_ENTITY_KEY = 'UserLocationPrivacy:ME';

// Whoever applies the privacy mode on this device (the app's LocationService) registers itself
// here; until then privacy changes only go to the cache and the outbox.
let mPrivateModeChangeListener: IPrivateModeChangeListener | undefined;

export function SetPrivateModeChangeListener(listener?: IPrivateModeChangeListener) {
  mPrivateModeChangeListener = listener;
}


/** Alias for the RTK-generated `useGetUserLocationPrivacyQuery`. */
export const useGetMyUserLocationPrivacy = useGetMyUserLocationPrivacyQuery;

/**
 * Same cache entry as useGetUserLocationPrivacy, narrowed to the boolean the rest of the app
 * cares about — no record (null) or PrivacyMode <= 0 means location sharing is not private.
 */
export function useGetMyUserPrivacyMode() {
  return useGetMyUserLocationPrivacyQuery(undefined, {
    selectFromResult: (result) => ({
      ...result,
      data: ((result.data?.PrivacyMode) ?? 0) > 0,
    }),
  });
}

/**
 * Like useGetUserPrivacyMode, but reads the mode once and then holds it: later changes to the
 * cache (the user switching privacy, an invalidation refetch) don't update the returned value.
 * It shares getUserLocationPrivacy's cache entry (a cached value is used at once, otherwise it
 * triggers the one fetch), and once it has a value it skips the query so it stops subscribing.
 *
 * It waits for the outbox to hydrate before taking the value: the cache only has choices the
 * server hasn't confirmed yet (queued before an app restart, say) applied once the persisted
 * queue is loaded, and those must win over the server's older value.
 */
export function useGetOnceMyUserPrivacyMode() {
  const isOutboxHydrated = useOutboxHydrated();
  const [snapshot, setSnapshot] = useState<boolean | undefined>(undefined);
  const result = useGetMyUserLocationPrivacyQuery(undefined, {
    skip: snapshot !== undefined,
    selectFromResult: (r) => ({
      ...r,
      data: r.isSuccess && isOutboxHydrated ? ((r.data?.PrivacyMode) ?? 0) > 0 : undefined,
    }),
  });
  // Adjusting state during render: React re-renders at once, before anything is committed.
  if (snapshot === undefined && result.data !== undefined) setSnapshot(result.data);
  return {
    ...result,
    data: snapshot ?? false,
    isSuccess: snapshot !== undefined,
    isFetching: snapshot === undefined && result.isFetching,
  };
}
// Location privacy is offline-first: the switch takes effect on this device at once
// (LocationService stops/starts reporting locally) and the PATCH is queued until the server
// is reachable. The PATCH sets an absolute value, so replaying it is harmless and only the
// latest queued value matters (coalesce: 'replace').
registerOfflineMutation(myUserLocationPrivacyApi.endpoints.patchUserLocationPrivacy, {
  entityKeys: () => [PRIVACY_ENTITY_KEY],
  coalesce: 'replace',
  optimistic: ({ PrivacyMode }) => [
    {
      endpointName: 'getMyUserLocationPrivacy',
      queryArgs: undefined,
      apply: (draft: UserLocationPrivacyDto | null) => {
        if (!draft) return { PrivacyMode, LatestUpdate: Math.floor(Date.now() / 1000) };
        draft.PrivacyMode = PrivacyMode;
      },
    },
  ],

});

/**
 * Mutator for the location-privacy record: returns a function that takes the patch
 * ({ PrivacyMode }) and hands it to the outbox, then applies the mode on this device through
 * the private-mode listener (LocationService), if one is registered.
 *
 * Offline mode (default): applies it to getUserLocationPrivacy's cache (the optimistic recipe
 * in registerOfflineMutation above) and queues the PATCH to send when the server is reachable.
 * The promise resolves once the call is queued, not when the server has it. Track sync state
 * with useOutboxStatus(PRIVACY_ENTITY_KEY).
 *
 * Online mode (OutboxPlatform.isOfflineMode === false): sends the PATCH at once. The promise
 * resolves when the server has it, and rejects with the standard RTK Query error (read it with
 * getErrorMessage / getErrorCategory from core/apiError) - in which case the device mode is
 * left unchanged.
 */
export function usePatchMyUserLocationPrivacy() {
  const enqueue = useOfflineMutation(myUserLocationPrivacyApi.endpoints.patchUserLocationPrivacy);
  return useCallback(
    async (patch: UserLocationPrivacyPatch) => {
      const result = await enqueue(patch);
      if (mPrivateModeChangeListener != undefined) mPrivateModeChangeListener.SetPrivateMode(patch.PrivacyMode > 0);
      return result;
    },
    [enqueue]
  );
}

export function EXAMPLE_usePatchUserLocationPrivacy() {
  return useOfflineMutation(myUserLocationPrivacyApi.endpoints.patchUserLocationPrivacy);
}
