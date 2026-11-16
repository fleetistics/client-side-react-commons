import { useState } from 'react';
import { apiSlice } from '@/client-side.Commons/dataLayer/core/apiSlice';
import { companyApi } from '@/client-side.Commons/dataLayer/api/company/companyApi';

import type { User } from '../../model/user/userDto';
import type { UserPatch } from '../../model/user/userPatchDto';
import { APP_CONFIG } from '@/client-side.Impl/config/app-config';
const BASE_USERS_URL = APP_CONFIG.BASE_API_URL + 'users';

export const userApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getMyUser: builder.query<User, void>({
      query: () => BASE_USERS_URL + '/me',
      providesTags: (result) => [{ type: 'User', id: result?.Id ?? 'ME' }],
    }),
    patchUser: builder.mutation<User, { userId: number; patch: UserPatch }>({
      query: ({ userId, patch }) => ({
        url: BASE_USERS_URL + `/${userId}`,
        method: 'PATCH',
        body: patch,
      }),
      invalidatesTags: (_result, _error, { userId }) => [{ type: 'User', id: userId }],
      // The user-management page keeps its own copy of the company's users: bring it up to date without a reload.
      // No-op when that page's data isn't cached. Images aren't copied (they need the reload that follows an upload).
      async onQueryStarted({ userId, patch }, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
        } catch {
          return;
        }
        dispatch(
          companyApi.util.updateQueryData('getUserManagementContext', undefined, (draft) => {
            const user = draft.Users?.find((x) => x.Id === userId);
            if (!user) return;
            if (patch.DisplayName !== undefined) user.DisplayName = patch.DisplayName;
            if (patch.FullName !== undefined) user.FullName = patch.FullName ?? undefined;
            if (patch.Phone !== undefined) user.Phone = patch.Phone ?? undefined;
            if (patch.Email !== undefined) user.Email = patch.Email ?? undefined;
            if (patch.IsMfaEnabled !== undefined) user.IsMfaEnabled = patch.IsMfaEnabled;
          }),
        );
      },
    }),
  })
});

export const {
  useGetMyUserQuery,
  useLazyGetMyUserQuery,
  usePatchUserMutation,
} = userApi;

/** Alias for the RTK-generated `useGetMyUserQuery`. */
export const useGetMyUser = useGetMyUserQuery;

/**
 * Like useGetMyUser, but reads the user once and then holds it: later changes to the cache
 * (a patch, an invalidation refetch) don't update the returned value. It shares getMyUser's
 * cache entry (a cached value is used at once, otherwise it triggers the one fetch), and once
 * it has a value it skips the query so it stops subscribing.
 */
export function useGetOnceMyUser() {
  const [snapshot, setSnapshot] = useState<User | undefined>(undefined);
  const result = useGetMyUserQuery(undefined, {
    skip: snapshot !== undefined,
  });
  // Adjusting state during render: React re-renders at once, before anything is committed.
  if (snapshot === undefined && result.isSuccess && result.data !== undefined) setSnapshot(result.data);
  return {
    ...result,
    data: snapshot,
    isSuccess: snapshot !== undefined,
    isFetching: snapshot === undefined && result.isFetching,
  };
}

/** Alias for the RTK-generated `usePatchUserMutation`. */
export const usePatchUser = usePatchUserMutation;
