import type {
  RegisterUserData,
  RequestPasswordResetData,
  ResetPasswordData,
} from '@/client-side.Commons/dataLayer/open-api';
import type { Concrete } from '@/client-side.Commons/dataLayer/core/apiTypes';
import type { ClientSideInfo } from '@/client-side.Commons/userSession/userSessionDto';

// Request bodies of the anonymous account endpoints (AuthController: register,
// request-password-reset, reset-password), derived from the generated OpenAPI models. The schema
// marks every property optional, so these narrow back to what the server requires.

/** Self-registration. UserName is only used (and required) when the server's Auth:EmailMode is UniqueUserName. */
export type RegisterUser = Concrete<RegisterUserData, 'Email' | 'DisplayName'> &
  Pick<RegisterUserData, 'UserName' | 'FullName' | 'Phone'> & {
    ClientSideInfo: ClientSideInfo;
  };

/** Asks for a password-reset message. Identifier is the e-mail in UniqueEmail mode, the user name otherwise. */
export type RequestPasswordReset = Concrete<RequestPasswordResetData, 'Identifier'>;

/** Sets a new password with the key from the reset / activation message. */
export type ResetPassword = Concrete<ResetPasswordData, 'ResetKey' | 'NewPassword'>;
