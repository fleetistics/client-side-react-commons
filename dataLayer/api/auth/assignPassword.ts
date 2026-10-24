import { getErrorMessage, getErrorStatus, getFieldErrors } from '@/client-side.Commons/dataLayer/core/apiError';

import { useResetPasswordMutation } from './accountApi';

/** What the user can be told about a rejected attempt. */
export type AssignPasswordResult =
  | { ok: true }
  | {
      ok: false;
      /** One-line summary, always present. */
      message: string;
      /** The server's explanations of the password rules the new password broke, when it sent them. */
      passwordErrors: string[];
      /**
       * True when the key itself was refused (wrong, expired, already used) — retyping the
       * password cannot help; the user needs a new link.
       */
      keyRejected: boolean;
    };

/**
 * Client-side checks before anything is sent: the password is not empty and the confirmation
 * matches it. Returns the message to show, or undefined when both hold. The password's
 * strength is the server's call and comes back through [[AssignPasswordResult]].
 */
export function validateNewPassword(password: string, confirmPassword: string): string | undefined {
  if (password === '') {
    return 'Enter a new password';
  }
  if (confirmPassword === '') {
    return 'Repeat the new password';
  }
  if (password !== confirmPassword) {
    return 'The passwords do not match';
  }
  return undefined;
}

/**
 * Assigns a new password using the key from a password-reset / account-activation link.
 * `assign` validates locally (see [[validateNewPassword]]), then sends the password with the
 * key, and reports the outcome instead of throwing.
 */
export function useAssignPassword(passwordResetKey: string) {
  const [resetPassword, state] = useResetPasswordMutation();

  const assign = async (password: string, confirmPassword: string): Promise<AssignPasswordResult> => {
    const validationError = validateNewPassword(password, confirmPassword);
    if (validationError) {
      return { ok: false, message: validationError, passwordErrors: [], keyRejected: false };
    }

    const result = await resetPassword({ ResetKey: passwordResetKey, NewPassword: password });
    if (!('error' in result)) {
      return { ok: true };
    }

    const error = result.error;
    const passwordErrors = getFieldErrors(error)['NewPassword'] ?? [];
    // The server answers 400 for both a bad key (plain message) and a rejected password
    // (field errors); only the first means the link is no good.
    const keyRejected = getErrorStatus(error) === 400 && passwordErrors.length === 0;
    return {
      ok: false,
      message: passwordErrors[0] ?? getErrorMessage(error, 'Could not set the password — please try again'),
      passwordErrors,
      keyRejected,
    };
  };

  return { assign, isLoading: state.isLoading };
}
