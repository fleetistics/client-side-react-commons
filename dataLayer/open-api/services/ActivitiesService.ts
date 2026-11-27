/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ActivityDto } from '../models/ActivityDto';
import type { ActivityLookupsDto } from '../models/ActivityLookupsDto';
import type { ActivityRowDto } from '../models/ActivityRowDto';
import type { ActivityScope } from '../models/ActivityScope';
import type { SaveActivityDto } from '../models/SaveActivityDto';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class ActivitiesService {
    /**
     * @returns ActivityLookupsDto OK
     * @throws ApiError
     */
    public static getApiContactsActivitiesLookups(): CancelablePromise<ActivityLookupsDto> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/contacts/activities/lookups',
            errors: {
                403: `Forbidden`,
            },
        });
    }
    /**
     * @param companyId
     * @param contactUserId
     * @param personUserId
     * @param from
     * @param to
     * @param typeId
     * @param priorityId
     * @param statusId
     * @param creatorUserId
     * @param limit
     * @returns ActivityRowDto OK
     * @throws ApiError
     */
    public static getApiContactsActivities(
        companyId?: number,
        contactUserId?: number,
        personUserId?: number,
        from?: number,
        to?: number,
        typeId?: number,
        priorityId?: number,
        statusId?: number,
        creatorUserId?: number,
        limit?: number,
    ): CancelablePromise<Array<ActivityRowDto>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/contacts/activities',
            query: {
                'CompanyId': companyId,
                'ContactUserId': contactUserId,
                'PersonUserId': personUserId,
                'From': from,
                'To': to,
                'TypeId': typeId,
                'PriorityId': priorityId,
                'StatusId': statusId,
                'CreatorUserId': creatorUserId,
                'Limit': limit,
            },
            errors: {
                403: `Forbidden`,
            },
        });
    }
    /**
     * @param requestBody
     * @returns ActivityDto Created
     * @throws ApiError
     */
    public static postApiContactsActivities(
        requestBody: SaveActivityDto,
    ): CancelablePromise<ActivityDto> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/contacts/activities',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Bad Request`,
                403: `Forbidden`,
            },
        });
    }
    /**
     * @param activityId
     * @returns ActivityDto OK
     * @throws ApiError
     */
    public static getApiContactsActivities1(
        activityId: number,
    ): CancelablePromise<ActivityDto> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/contacts/activities/{activityId}',
            path: {
                'activityId': activityId,
            },
            errors: {
                403: `Forbidden`,
                404: `Not Found`,
            },
        });
    }
    /**
     * @param activityId
     * @param requestBody
     * @param scope
     * @returns ActivityDto OK
     * @throws ApiError
     */
    public static putApiContactsActivities(
        activityId: number,
        requestBody: SaveActivityDto,
        scope: ActivityScope = 1,
    ): CancelablePromise<ActivityDto> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/contacts/activities/{activityId}',
            path: {
                'activityId': activityId,
            },
            query: {
                'scope': scope,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Bad Request`,
                403: `Forbidden`,
                404: `Not Found`,
            },
        });
    }
    /**
     * @param activityId
     * @returns ActivityDto OK
     * @throws ApiError
     */
    public static postApiContactsActivitiesComplete(
        activityId: number,
    ): CancelablePromise<ActivityDto> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/contacts/activities/{activityId}/complete',
            path: {
                'activityId': activityId,
            },
            errors: {
                400: `Bad Request`,
                403: `Forbidden`,
                404: `Not Found`,
            },
        });
    }
    /**
     * @param activityId
     * @param scope
     * @returns ActivityDto OK
     * @throws ApiError
     */
    public static postApiContactsActivitiesCancel(
        activityId: number,
        scope: ActivityScope = 1,
    ): CancelablePromise<ActivityDto> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/contacts/activities/{activityId}/cancel',
            path: {
                'activityId': activityId,
            },
            query: {
                'scope': scope,
            },
            errors: {
                400: `Bad Request`,
                403: `Forbidden`,
                404: `Not Found`,
            },
        });
    }
}
