import type { QueryReturnValue } from '@reduxjs/toolkit/query';
import type { FetchBaseQueryError, FetchBaseQueryMeta } from '@reduxjs/toolkit/query/react';
import { apiSlice, AuthToken } from '@/app.Commons/dataLayer/apiSlice';
import { ClientSideInfoProvider } from '@/app.Impl/userSession/ClientSideInfoProvider';

import type { LoginData, UserSessionCheckResponse } from './userSessionDto';
import { USER_SESSION_CONSTS } from '@/app.Impl/configs/userSession-consts';

/**
 * Session endpoints on the same RTK Query slice as the rest of the app: one data
 * layer, one error model, and every request gets the shared base-query behavior
 * (bearer header, traceparent, retry policy). apiSlice special-cases these URIs so
 * their 401s read as "not signed in" instead of triggering a token refresh.
 */
export const userSessionApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    checkSession: builder.query<UserSessionCheckResponse, void>({
      // Async because the body needs device/app details gathered at request time;
      // `query` must return synchronously, so this goes through `queryFn` instead,
      // delegating to the shared `baseQuery` for auth/retry/traceparent handling.
      queryFn: async (_arg, _api, _extraOptions, baseQuery) => {
        const result = await baseQuery({
          url: USER_SESSION_CONSTS.CHECK_SESSION_URL,
          method: 'POST',
          // The server binds AppVersionInfo straight from the body — no wrapper object.
          body: await ClientSideInfoProvider.GetInstance().GetInfo(),
        });
        return result as QueryReturnValue<
          UserSessionCheckResponse,
          FetchBaseQueryError,
          FetchBaseQueryMeta
        >;
      },
      // Seed the bearer token every ordinary request depends on — on initial load
      // and on every refetch (login, auth-lost recheck).
      onQueryStarted: async (_arg, { queryFulfilled }) => {
        try {
          const { data } = await queryFulfilled;
          AuthToken.set(data.AccessToken);
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
  }),
});

export const { useCheckSessionQuery, useLoginMutation } = userSessionApi;
