import { apiSlice } from '@/client-side.Commons/dataLayer/core/apiSlice';

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

/** Alias for the RTK-generated `usePatchUserMutation`. */
export const usePatchUser = usePatchUserMutation;
