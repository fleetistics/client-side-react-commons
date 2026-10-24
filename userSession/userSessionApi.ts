import type { QueryReturnValue } from '@reduxjs/toolkit/query';
import type { FetchBaseQueryError, FetchBaseQueryMeta } from '@reduxjs/toolkit/query/react';
import { apiSlice, AuthToken, notifyAuthLost } from '@/client-side.Commons/dataLayer/core/apiSlice';
import { clearOutbox } from '@/client-side.Commons/dataLayer/outbox/outbox';
import { ClientSideInfoProvider } from '@/client-side.Impl/userSession/ClientSideInfoProvider';

import type { CheckSessionResult, LoginData, UserSessionCheckResponse } from './userSessionDto';
import { USER_SESSION_CONSTS } from '@/client-side.Impl/config/userSession-consts';

/**
 * Session endpoints on the same RTK Query slice as the rest of the app: one data
 * layer, one error model, and every request gets the shared base-query behavior
 * (bearer header, traceparent, retry policy). apiSlice special-cases these URIs so
 * their 401s read as "not signed in" instead of triggering a token refresh.
 */
export const userSessionApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    checkSession: builder.query<CheckSessionResult, void>({
      // Async because the body needs device/app details gathered at request time;
      // `query` must return synchronously, so this goes through `queryFn` instead,
      // delegating to the shared `baseQuery` for auth/retry/traceparent handling.
      queryFn: async (_arg, _api, _extraOptions, baseQuery) => {
        const clientInfo = await ClientSideInfoProvider.GetInstance().GetInfo();
        const result = await baseQuery({
          url: USER_SESSION_CONSTS.CHECK_SESSION_URL,
          method: 'POST',
          // The server binds AppVersionInfo straight from the body — no wrapper object.
          body: clientInfo,
        });
        if (result.error) {
          return result as QueryReturnValue<CheckSessionResult, FetchBaseQueryError, FetchBaseQueryMeta>;
        }
        // Pair the client info sent in the request with the server's response, so
        // callers get both without a second GetInfo() call.
        return {
          data: {
            clientInfo,
            serverSessionInfo: result.data as UserSessionCheckResponse,
          },
          meta: result.meta,
        };
      },
      // Seed the bearer token every ordinary request depends on — on initial load
      // and on every refetch (login, auth-lost recheck).
      onQueryStarted: async (_arg, { queryFulfilled }) => {
        try {
          const { data } = await queryFulfilled;
          AuthToken.set(data.serverSessionInfo.AccessToken);
        } catch {
          // 401 / network failure: stay logged out; the provider renders the login UI.
        }
      },
    }),

    login: builder.mutation<UserSessionCheckResponse, LoginData>({
      query: (credentials) => ({
        url: USER_SESSION_CONSTS.LOGIN_URL,
        method: 'POST',
        body: credentials,
      }),
    }),

    logout: builder.mutation<void, void>({
      query: () => ({
        url: USER_SESSION_CONSTS.LOGOUT_URL,
        method: 'POST',
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
        await clearOutbox();
        notifyAuthLost();
      },
    }),
  }),
});

export const { useCheckSessionQuery, useLoginMutation, useLogoutMutation } = userSessionApi;
