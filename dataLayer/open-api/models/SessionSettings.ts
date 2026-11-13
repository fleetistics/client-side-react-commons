/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type SessionSettings = {
    IdleTimeoutMinutes?: number;
    MaxSessionHours?: number;
    ConcurrentSessions?: number;
    LockoutAttempts?: number;
    LockoutMinutes?: number;
    StepUpReauthentication?: boolean;
    IpAllowlistEnabled?: boolean;
    GeoBlockingEnabled?: boolean;
    DeviceTrustForAdminRoles?: boolean;
    CaptchaOnRepeatedFailures?: boolean;
    CaptchaAfterFailedAttempts?: number;
};

