/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { JoinAcceptedDto } from '../models/JoinAcceptedDto';
import type { JoinCodeRequestDto } from '../models/JoinCodeRequestDto';
import type { JoinInfoDto } from '../models/JoinInfoDto';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class JoinService {
    /**
     * @param requestBody
     * @returns JoinInfoDto OK
     * @throws ApiError
     */
    public static postApiJoinLookup(
        requestBody: JoinCodeRequestDto,
    ): CancelablePromise<JoinInfoDto> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/join/lookup',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                403: `Forbidden`,
                404: `Not Found`,
                429: `Too Many Requests`,
            },
        });
    }
    /**
     * @param requestBody
     * @returns JoinAcceptedDto OK
     * @throws ApiError
     */
    public static postApiJoinAccept(
        requestBody: JoinCodeRequestDto,
    ): CancelablePromise<JoinAcceptedDto> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/join/accept',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                403: `Forbidden`,
                404: `Not Found`,
                409: `Conflict`,
                429: `Too Many Requests`,
            },
        });
    }
    /**
     * @param requestBody
     * @returns void
     * @throws ApiError
     */
    public static postApiJoinDeny(
        requestBody: JoinCodeRequestDto,
    ): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/join/deny',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                403: `Forbidden`,
                404: `Not Found`,
                429: `Too Many Requests`,
            },
        });
    }
}
