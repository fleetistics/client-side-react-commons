/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CreatingMissionDto } from '../models/CreatingMissionDto';
import type { MissionCreatePatchDto } from '../models/MissionCreatePatchDto';
import type { MissionPrimaryTargetUserAssignDto } from '../models/MissionPrimaryTargetUserAssignDto';
import type { MissionPrimaryTargetUserDto } from '../models/MissionPrimaryTargetUserDto';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class MissionService {
    /**
     * @returns CreatingMissionDto OK
     * @throws ApiError
     */
    public static getApiMissionCreating(): CancelablePromise<CreatingMissionDto> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/mission/creating',
        });
    }
    /**
     * @param requestBody
     * @returns number Created
     * @throws ApiError
     */
    public static postApiMission(
        requestBody: MissionCreatePatchDto,
    ): CancelablePromise<number> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/mission',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Bad Request`,
            },
        });
    }
    /**
     * @param missionId
     * @param requestBody
     * @returns MissionPrimaryTargetUserDto OK
     * @throws ApiError
     */
    public static putApiMissionPrimaryTargetUser(
        missionId: number,
        requestBody: MissionPrimaryTargetUserAssignDto,
    ): CancelablePromise<MissionPrimaryTargetUserDto> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/mission/{missionId}/primary-target-user',
            path: {
                'missionId': missionId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Bad Request`,
            },
        });
    }
    /**
     * @param missionId
     * @param requestBody
     * @returns CreatingMissionDto OK
     * @throws ApiError
     */
    public static patchApiMission(
        missionId: number,
        requestBody: MissionCreatePatchDto,
    ): CancelablePromise<CreatingMissionDto> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/mission/{missionId}',
            path: {
                'missionId': missionId,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @param missionId
     * @returns void
     * @throws ApiError
     */
    public static postApiMissionStart(
        missionId: number,
    ): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/mission/{missionId}/start',
            path: {
                'missionId': missionId,
            },
        });
    }
}
