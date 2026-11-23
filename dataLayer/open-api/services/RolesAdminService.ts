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
export class RolesAdminService {
    /**
     * @returns RoleSummaryDto OK
     * @throws ApiError
     */
    public static getApiAdminRoles(): CancelablePromise<Array<RoleSummaryDto>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/admin/roles',
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
                404: `Not Found`,
            },
        });
    }
}
