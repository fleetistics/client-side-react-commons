/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { TwoFactorScope } from './TwoFactorScope';
export type TwoFactorSettings = {
    Required?: boolean;
    AppliesTo?: TwoFactorScope;
    AllowAuthenticatorApp?: boolean;
    AllowEmailOneTimeCode?: boolean;
    AllowBackupCodes?: boolean;
    AllowSmsMessage?: boolean;
    AllowSecurityKeyPasskey?: boolean;
    EnrollmentGraceDays?: number;
    RememberDeviceDays?: number;
};

