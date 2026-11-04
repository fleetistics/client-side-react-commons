/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { MobileLocation } from '../models/MobileLocation';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class MobileGpsService {
    /**
     * @param requestBody
     * @returns any OK
     * @throws ApiError
     */
    public static postApiMobileGpsLocationReport(
        requestBody: Array<MobileLocation>,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/mobile-gps/location-report',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Bad Request`,
            },
        });
    }
}
