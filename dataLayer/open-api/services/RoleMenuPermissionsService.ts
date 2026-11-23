/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { RoleMenuPermissionsDto } from '../models/RoleMenuPermissionsDto';
import type { RoleSummaryDto } from '../models/RoleSummaryDto';
import type { SetRoleMenuPermissionsDto } from '../models/SetRoleMenuPermissionsDto';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class RoleMenuPermissionsService {
    /**
     * @returns RoleSummaryDto OK
     * @throws ApiError
     */
    public static getApiAdminRoles(): CancelablePromise<Array<RoleSummaryDto>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/admin/roles',
            errors: {
                403: `Forbidden`,
            },
        });
    }
    /**
     * @param roleId
     * @returns RoleMenuPermissionsDto OK
     * @throws ApiError
     */
    public static getApiAdminRolesMenuPermissions(
        roleId: number,
    ): CancelablePromise<RoleMenuPermissionsDto> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/admin/roles/{roleId}/menu-permissions',
            path: {
                'roleId': roleId,
            },
            errors: {
                403: `Forbidden`,
                404: `Not Found`,
            },
        });
    }
    /**
     * @param roleId
     * @param requestBody
     * @returns void
     * @throws ApiError
     */
    public static putApiAdminRolesMenuPermissions(
        roleId: number,
        requestBody: SetRoleMenuPermissionsDto,
    ): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/admin/roles/{roleId}/menu-permissions',
            path: {
                'roleId': roleId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Bad Request`,
                403: `Forbidden`,
                404: `Not Found`,
                409: `Conflict`,
            },
        });
    }
}
