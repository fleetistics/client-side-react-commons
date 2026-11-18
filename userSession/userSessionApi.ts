import type { QueryReturnValue } from '@reduxjs/toolkit/query';
import type { FetchBaseQueryError, FetchBaseQueryMeta } from '@reduxjs/toolkit/query/react';
import {
  apiSlice,
  AuthToken,
  getRawBaseQuery,
  notifyAuthLost,
  setSessionRefresher,
  type RefreshApi,
} from '@/client-side.Commons/dataLayer/core/apiSlice';
import { clearOutbox } from '@/client-side.Commons/dataLayer/outbox/outbox';
import { ClientSideInfoProvider } from './ClientSideInfoProvider';

import { USER_ACCOUNT_CONSTS, USER_SESSION_CONSTS } from '@/client-side.Impl/config/userSession-consts';
import type { CheckSessionRequestData, CheckSessionResponseData, LoginRequestData, LoginResponseData, RefreshKeyRequestData, RefreshKeyResponseData, UserSessionInfoDto } from '../dataLayer/open-api';
import type { Concrete } from '@/client-side.Commons/dataLayer/core/apiTypes';
import { UserSessionContext } from './userSessionContext';
import type { SessionKeyStorage } from './sessionKeyStore';

var mSessionKeyStore: SessionKeyStorage|null = null;

/** What checkSession returns: the server's user session info, with the user id guaranteed present. */
export type CheckedUserSessionInfo = UserSessionInfoDto & Concrete<UserSessionInfoDto, 'UserId'>;

/**
 * Minimal BaseQueryApi stand-in for callers outside RTK Query (e.g. the native media
 * upload path) that still need to drive refreshAccessToken()'s single-flight latch.
 * Sharing that latch matters: it's what stops a query and an upload racing to refresh
 * at the same moment from each invalidating the other's refresh cookie.
 */
export const createStandaloneRefreshApi = (endpoint: string): RefreshApi => ({
  signal: new AbortController().signal,
  abort: () => {},
  dispatch: (() => {}) as RefreshApi['dispatch'],
  getState: () => undefined,
  extra: undefined,
  endpoint,
  type: 'mutation',
});

const doRefresh = async (api: RefreshApi, extraOptions: {}): Promise<boolean> => {

  const result = await getRawBaseQuery()(
    {
      url: USER_SESSION_CONSTS.REFRESH_TOKEN_URL,
      method: 'POST',
      body:
        mSessionKeyStore != null
          ? ({
              SessionSign: mSessionKeyStore?.SessionSign,
              RotationCounter: mSessionKeyStore?.RotationCounter,
              SessionKey: mSessionKeyStore?.SessionKey,
            } as RefreshKeyRequestData)
          : undefined,
      credentials: USER_SESSION_CONSTS.SESSION_CREDENTIALS_MODE,
    },
    api,
    extraOptions
  );

  if (!result.data || !(result.data as RefreshKeyResponseData).AccessToken) {
    AuthToken.clear();
    return false;
  }
  
  const response = result.data as RefreshKeyResponseData;
  AuthToken.set(response.AccessToken);
  if (mSessionKeyStore != null) {
    if (response.SessionSign && response.RotationCounter) await mSessionKeyStore.WriteRotation( response.SessionSign,response.RotationCounter );
    else await mSessionKeyStore.Clear();
  }
  return true;
};

/**
 * Single-flight latch. Without it, N queries in flight when the token expires would
 * each fire their own refresh — the server invalidates the old refresh cookie on the
 * first one, so the rest fail and log the user out spuriously.
 */
let refreshInFlight: Promise<boolean> | null = null;

export const refreshAccessToken = (api: RefreshApi, extraOptions: {}): Promise<boolean> => {
  if (!refreshInFlight) {
    refreshInFlight = doRefresh(api, extraOptions);
    // Release the latch once settled so a later expiry can refresh again.
    void refreshInFlight.finally(() => {
      refreshInFlight = null;
    });
  }
  return refreshInFlight;
};

// apiSlice's reauth wrapper calls this on a 401 (it cannot import this file: cycle).
setSessionRefresher(refreshAccessToken);

/**
 * Session endpoints on the same RTK Query slice as the rest of the app: one data
 * layer, one error model, and every request gets the shared base-query behavior
 * (bearer header, traceparent, retry policy). apiSlice special-cases these URIs so
 * their 401s read as "not signed in" instead of triggering a token refresh.
 */
export const userSessionApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    checkSession: builder.query<CheckedUserSessionInfo, void>({
      // Async because the body needs device/app details gathered at request time;
      // `query` must return synchronously, so this goes through `queryFn` instead,
      // delegating to the shared `baseQuery` for auth/retry/traceparent handling.
      queryFn: async (_arg, _api, _extraOptions, baseQuery) => {
        await ClientSideInfoProvider.CheckInfoCollected ();
        const body = { ClientSideInfo: ClientSideInfoProvider.Info } as CheckSessionRequestData;
        if (mSessionKeyStore != null) {
          body.SessionSign = mSessionKeyStore?.SessionSign;
          body.RotationCounter = mSessionKeyStore?.RotationCounter;
          body.SessionKey = mSessionKeyStore?.SessionKey;
        }
          
        const result = await baseQuery({
          url: USER_SESSION_CONSTS.CHECK_SESSION_URL,
          method: 'POST',
          body,
          credentials: USER_SESSION_CONSTS.SESSION_CREDENTIALS_MODE,
        });
        if (result.error) {
          return { error: result.error, meta: result.meta };
        }
        const response = result.data as CheckSessionResponseData;
       
        AuthToken.set(response.AccessToken);
        if (mSessionKeyStore != null) {
          if (response.SessionSign && response.RotationCounter) await mSessionKeyStore.WriteRotation( response.SessionSign,response.RotationCounter );
          else await mSessionKeyStore.Clear();
        }
        const userSessionInfo = response.UserSessionInfo;
        if (userSessionInfo?.UserId == null) {
          return {
            error: { status: 'CUSTOM_ERROR', error: 'check-session response has no UserSessionInfo' },
            meta: result.meta,
          };
        }
        // Assigned here, before the result reaches the provider, so it is in place when the
        // children first render and on every refetch.
        UserSessionContext.AssignUserId(userSessionInfo.UserId);
        return { data: userSessionInfo as CheckedUserSessionInfo, meta: result.meta };
      },
    }),

    // Callers pass only the credentials; the client info is gathered here at request time.
    login: builder.mutation<LoginResponseData, Omit<LoginRequestData, 'ClientSideInfo'>>({
      queryFn: async (credentials, _api, _extraOptions, baseQuery) => {
        await ClientSideInfoProvider.CheckInfoCollected ();
        const body: LoginRequestData = { ...credentials, ClientSideInfo: ClientSideInfoProvider.Info };
        const result = await baseQuery({
          url: USER_ACCOUNT_CONSTS.LOGIN_URL,
          method: 'POST',
          body,
          credentials: USER_SESSION_CONSTS.SESSION_CREDENTIALS_MODE,
        });
        return result as QueryReturnValue<LoginResponseData, FetchBaseQueryError, FetchBaseQueryMeta>;
      },
    }),

    logout: builder.mutation<void, void>({
      query: () => ({
        url: USER_ACCOUNT_CONSTS.LOGOUT_URL,
        method: 'POST',
        credentials: USER_SESSION_CONSTS.SESSION_CREDENTIALS_MODE,
      }),
      // The user is signed out locally whether or not the server call succeeded (e.g. offline,
      // or the session had already expired): drop the saved offline queue and the token, then
      // notify auth-lost, which re-runs the session check and swaps in the login UI.
      onQueryStarted: async (_arg, { queryFulfilled }) => {
        try {
          await queryFulfilled;
        } catch (error) {
          console.warn('[userSessionApi] logout request failed; signing out locally anyway', error);
        }
        if (mSessionKeyStore != null) {
          try {
            await mSessionKeyStore.Clear();
          } catch (error) {
            console.warn('[userSessionApi] clearing the session key failed; signing out locally anyway', error);
          }
        }
        await clearOutbox();
        notifyAuthLost();
      },
    }),
  }),
});

export const { useCheckSessionQuery, useLoginMutation, useLogoutMutation } = userSessionApi;
