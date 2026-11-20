/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CheckSessionRequestData } from '../models/CheckSessionRequestData';
import type { CheckSessionResponseData } from '../models/CheckSessionResponseData';
import type { LoginRequestData } from '../models/LoginRequestData';
import type { LoginResponseData } from '../models/LoginResponseData';
import type { LogOutRequestData } from '../models/LogOutRequestData';
import type { RefreshKeyRequestData } from '../models/RefreshKeyRequestData';
import type { RefreshKeyResponseData } from '../models/RefreshKeyResponseData';
import type { RegisterUserData } from '../models/RegisterUserData';
import type { RequestPasswordResetData } from '../models/RequestPasswordResetData';
import type { ResetPasswordData } from '../models/ResetPasswordData';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class AuthService {
    /**
     * @param requestBody
     * @returns LoginResponseData OK
     * @throws ApiError
     */
    public static postApiAuthCookiePortalLogin(
        requestBody: LoginRequestData,
    ): CancelablePromise<LoginResponseData> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/auth_cookie/portal_login',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                401: `Unauthorized`,
                409: `Conflict`,
                429: `Too Many Requests`,
            },
        });
    }
    /**
     * @param requestBody
     * @returns LoginResponseData OK
     * @throws ApiError
     */
    public static postApiAuthAppLogin(
        requestBody: LoginRequestData,
    ): CancelablePromise<LoginResponseData> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/auth/app_login',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                401: `Unauthorized`,
                409: `Conflict`,
                429: `Too Many Requests`,
            },
        });
    }
    /**
     * @param requestBody
     * @returns LoginResponseData OK
     * @throws ApiError
     */
    public static postApiAuthAppAutoLogin(
        requestBody: LoginRequestData,
    ): CancelablePromise<LoginResponseData> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/auth/app_auto_login',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                401: `Unauthorized`,
                409: `Conflict`,
                429: `Too Many Requests`,
            },
        });
    }
    /**
     * @param requestBody
     * @returns CheckSessionResponseData OK
     * @throws ApiError
     */
    public static postApiAuthCookieCheckSession(
        requestBody: CheckSessionRequestData,
    ): CancelablePromise<CheckSessionResponseData> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/auth_cookie/check-session',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                401: `Unauthorized`,
            },
        });
    }
    /**
     * @param requestBody
     * @returns CheckSessionResponseData OK
     * @throws ApiError
     */
    public static postApiAuthCheckSession(
        requestBody: CheckSessionRequestData,
    ): CancelablePromise<CheckSessionResponseData> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/auth/check-session',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                401: `Unauthorized`,
            },
        });
    }
    /**
     * @returns RefreshKeyResponseData OK
     * @throws ApiError
     */
    public static postApiAuthCookieRefresh(): CancelablePromise<RefreshKeyResponseData> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/auth_cookie/refresh',
            errors: {
                401: `Unauthorized`,
            },
        });
    }
    /**
     * @param requestBody
     * @returns RefreshKeyResponseData OK
     * @throws ApiError
     */
    public static postApiAuthRefresh(
        requestBody: RefreshKeyRequestData,
    ): CancelablePromise<RefreshKeyResponseData> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/auth/refresh',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                401: `Unauthorized`,
            },
        });
    }
    /**
     * @returns any OK
     * @throws ApiError
     */
    public static postApiAuthCookieLogout(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/auth_cookie/logout',
        });
    }
    /**
     * @param requestBody
     * @returns any OK
     * @throws ApiError
     */
    public static postApiAuthLogout(
        requestBody: LogOutRequestData,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/auth/logout',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @param requestBody
     * @returns void
     * @throws ApiError
     */
    public static postApiUserPortalRegister(
        requestBody: RegisterUserData,
    ): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/user/portal_register',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Bad Request`,
                409: `Conflict`,
            },
        });
    }
    /**
     * @param requestBody
     * @returns void
     * @throws ApiError
     */
    public static postApiUserRegister(
        requestBody: RegisterUserData,
    ): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/user/register',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Bad Request`,
                409: `Conflict`,
            },
        });
    }
    /**
     * @param requestBody
     * @returns void
     * @throws ApiError
     */
    public static postApiUserAppRegister(
        requestBody: RegisterUserData,
    ): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/user/app_register',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Bad Request`,
                409: `Conflict`,
            },
        });
    }
    /**
     * @param requestBody
     * @returns void
     * @throws ApiError
     */
    public static postApiAuthRequestPasswordReset(
        requestBody: RequestPasswordResetData,
    ): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/auth/request-password-reset',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @param requestBody
     * @returns void
     * @throws ApiError
     */
    public static postApiAuthResetPassword(
        requestBody: ResetPasswordData,
    ): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/auth/reset-password',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Bad Request`,
                409: `Conflict`,
            },
        });
    }
}
