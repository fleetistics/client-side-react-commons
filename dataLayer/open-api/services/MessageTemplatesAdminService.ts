/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CreateMessageTemplateVersionRequestDto } from '../models/CreateMessageTemplateVersionRequestDto';
import type { MessageTemplatePreviewDto } from '../models/MessageTemplatePreviewDto';
import type { MessageTemplateVersionDto } from '../models/MessageTemplateVersionDto';
import type { PreviewMessageTemplateRequestDto } from '../models/PreviewMessageTemplateRequestDto';
import type { TemplateKeySummary } from '../models/TemplateKeySummary';
import type { TemplateModelDescription } from '../models/TemplateModelDescription';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class MessageTemplatesAdminService {
    /**
     * @returns TemplateModelDescription OK
     * @throws ApiError
     */
    public static getApiAdminMessageTemplatesModels(): CancelablePromise<Array<TemplateModelDescription>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/admin/message-templates/models',
        });
    }
    /**
     * @returns TemplateKeySummary OK
     * @throws ApiError
     */
    public static getApiAdminMessageTemplates(): CancelablePromise<Array<TemplateKeySummary>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/admin/message-templates',
        });
    }
    /**
     * @param key
     * @param language
     * @returns MessageTemplateVersionDto OK
     * @throws ApiError
     */
    public static getApiAdminMessageTemplatesVersions(
        key: string,
        language?: string,
    ): CancelablePromise<Array<MessageTemplateVersionDto>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/admin/message-templates/{key}/versions',
            path: {
                'key': key,
            },
            query: {
                'language': language,
            },
        });
    }
    /**
     * @param key
     * @param requestBody
     * @returns MessageTemplateVersionDto Created
     * @throws ApiError
     */
    public static postApiAdminMessageTemplatesVersions(
        key: string,
        requestBody: CreateMessageTemplateVersionRequestDto,
    ): CancelablePromise<MessageTemplateVersionDto> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/admin/message-templates/{key}/versions',
            path: {
                'key': key,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Bad Request`,
                404: `Not Found`,
                422: `Unprocessable Entity`,
            },
        });
    }
    /**
     * @param id
     * @returns void
     * @throws ApiError
     */
    public static postApiAdminMessageTemplatesVersionsActivate(
        id: number,
    ): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/admin/message-templates/versions/{id}/activate',
            path: {
                'id': id,
            },
            errors: {
                404: `Not Found`,
            },
        });
    }
    /**
     * @param key
     * @param requestBody
     * @returns MessageTemplatePreviewDto OK
     * @throws ApiError
     */
    public static postApiAdminMessageTemplatesPreview(
        key: string,
        requestBody: PreviewMessageTemplateRequestDto,
    ): CancelablePromise<MessageTemplatePreviewDto> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/admin/message-templates/{key}/preview',
            path: {
                'key': key,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Bad Request`,
                404: `Not Found`,
                422: `Unprocessable Entity`,
            },
        });
    }
}
