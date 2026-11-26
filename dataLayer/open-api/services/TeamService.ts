/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { TeamCreateDto } from '../models/TeamCreateDto';
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
}
