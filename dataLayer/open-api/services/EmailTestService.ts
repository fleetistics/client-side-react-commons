/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { EmailTestAcceptedDto } from '../models/EmailTestAcceptedDto';
import type { EmailTestRequestDto } from '../models/EmailTestRequestDto';
import type { EmailTestStatusDto } from '../models/EmailTestStatusDto';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class EmailTestService {
    /**
     * @param requestBody
     * @returns EmailTestAcceptedDto Accepted
     * @throws ApiError
     */
    public static postApiTestEmail(
        requestBody: EmailTestRequestDto,
    ): CancelablePromise<EmailTestAcceptedDto> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/test/email',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Bad Request`,
                404: `Not Found`,
                409: `Conflict`,
            },
        });
    }
    /**
     * @param reference
     * @returns EmailTestStatusDto OK
     * @throws ApiError
     */
    public static getApiTestEmail(
        reference: string,
    ): CancelablePromise<EmailTestStatusDto> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/test/email/{reference}',
            path: {
                'reference': reference,
            },
            errors: {
                404: `Not Found`,
            },
        });
    }
}
