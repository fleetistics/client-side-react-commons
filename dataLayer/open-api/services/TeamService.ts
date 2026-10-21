/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { TeamCreateDto } from '../models/TeamCreateDto';
import type { TeamCreatePatchDto } from '../models/TeamCreatePatchDto';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class TeamService {
    /**
     * @returns number OK
     * @throws ApiError
     */
    public static getApiTeamActive(): CancelablePromise<number> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/team/active',
        });
    }
    /**
     * @returns TeamCreateDto OK
     * @throws ApiError
     */
    public static getApiTeamCreating(): CancelablePromise<TeamCreateDto> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/team/creating',
        });
    }
    /**
     * @param requestBody
     * @returns TeamCreateDto Created
     * @throws ApiError
     */
    public static postApiTeam(
        requestBody: TeamCreatePatchDto,
    ): CancelablePromise<TeamCreateDto> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/team',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Bad Request`,
            },
        });
    }
    /**
     * @param teamId
     * @param requestBody
     * @returns TeamCreateDto OK
     * @throws ApiError
     */
    public static patchApiTeam(
        teamId: number,
        requestBody: TeamCreatePatchDto,
    ): CancelablePromise<TeamCreateDto> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/team/{teamId}',
            path: {
                'teamId': teamId,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @param teamId
     * @returns void
     * @throws ApiError
     */
    public static postApiTeamStart(
        teamId: number,
    ): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/team/{teamId}/start',
            path: {
                'teamId': teamId,
            },
        });
    }
}
