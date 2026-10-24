import { apiSlice } from '@/client-side.Commons/dataLayer/core/apiSlice';
import { USER_ACCOUNT_CONSTS } from '@/client-side.Impl/config/userSession-consts';

import type { RegisterUser, RequestPasswordReset, ResetPassword } from '../../model/auth/accountDto';

/**
 * Registration and the password-reset flow. All three are anonymous and answer 204 with no
 * body on success, so there is nothing to cache or invalidate. A 401 never comes from them,
 * which keeps them clear of apiSlice's refresh-and-retry path.
 */
export const accountApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    registerUser: builder.mutation<void, RegisterUser>({
      query: (body) => ({ url: USER_ACCOUNT_CONSTS.REGISTER_URL, method: 'POST', body }),
    }),
    requestPasswordReset: builder.mutation<void, RequestPasswordReset>({
      query: (body) => ({ url: USER_ACCOUNT_CONSTS.REQUEST_PASSWORD_RESET_URL, method: 'POST', body }),
    }),
    resetPassword: builder.mutation<void, ResetPassword>({
      query: (body) => ({ url: USER_ACCOUNT_CONSTS.RESET_PASSWORD_URL, method: 'POST', body }),
    }),
  }),
});

export const { useRegisterUserMutation, useRequestPasswordResetMutation, useResetPasswordMutation } = accountApi;

/** Alias for the RTK-generated `useRegisterUserMutation`. */
export const useRegisterUser = useRegisterUserMutation;

/** Alias for the RTK-generated `useRequestPasswordResetMutation`. */
export const useRequestPasswordReset = useRequestPasswordResetMutation;

/** Alias for the RTK-generated `useResetPasswordMutation`. */
export const useResetPassword = useResetPasswordMutation;
