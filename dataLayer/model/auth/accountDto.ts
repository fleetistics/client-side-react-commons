// Request bodies of the anonymous account endpoints (AuthController: register,
// request-password-reset, reset-password). Property names are PascalCase because that is
// the server's wire format. Hand-written, not generated: these endpoints postdate the
// last `pnpm generate:api:codegen` run.

/** Self-registration. UserName is only used (and required) when the server's Auth:EmailMode is UniqueUserName. */
export type RegisterUser = {
  UserName?: string;
  Email: string;
  DisplayName: string;
  FullName?: string;
  Phone?: string;
};

/** Asks for a password-reset message. Identifier is the e-mail in UniqueEmail mode, the user name otherwise. */
export type RequestPasswordReset = {
  Identifier: string;
};

/** Sets a new password with the key from the reset / activation message. */
export type ResetPassword = {
  ResetKey: string;
  NewPassword: string;
};
