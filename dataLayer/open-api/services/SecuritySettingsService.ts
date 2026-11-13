/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { SecuritySettingsDto } from '../models/SecuritySettingsDto';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class SecuritySettingsService {
    /**
     * @returns SecuritySettingsDto OK
     * @throws ApiError
     */
    public static getApiAuthSecuritySettings(): CancelablePromise<SecuritySettingsDto> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/auth/security-settings',
        });
    }
}
