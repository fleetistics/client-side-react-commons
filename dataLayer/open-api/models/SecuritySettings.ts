/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { EmailDomainSettings } from './EmailDomainSettings';
import type { PasswordSettings } from './PasswordSettings';
import type { SessionSettings } from './SessionSettings';
import type { TwoFactorSettings } from './TwoFactorSettings';
export type SecuritySettings = {
    Password?: PasswordSettings;
    TwoFactor?: TwoFactorSettings;
    EmailDomain?: EmailDomainSettings;
    Sessions?: SessionSettings;
};

