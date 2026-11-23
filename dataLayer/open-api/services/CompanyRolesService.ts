/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AssignRoleUsersDto } from '../models/AssignRoleUsersDto';
import type { CreateRoleDto } from '../models/CreateRoleDto';
import type { RoleMenuPermissionsDto } from '../models/RoleMenuPermissionsDto';
import type { RoleSummaryDto } from '../models/RoleSummaryDto';
import type { RoleUserDto } from '../models/RoleUserDto';
import type { SetRoleMenuPermissionsDto } from '../models/SetRoleMenuPermissionsDto';
import type { UpdateRoleDto } from '../models/UpdateRoleDto';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class CompanyRolesService {
    /**
     * @returns RoleSummaryDto OK
     * @throws ApiError
     */
    public static getApiCompanyRoles(): CancelablePromise<Array<RoleSummaryDto>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/company/roles',
            errors: {
                403: `Forbidden`,
            },
        });
    }
    /**
     * @param requestBody
     * @returns RoleSummaryDto Created
     * @throws ApiError
     */
    public static postApiCompanyRoles(
        requestBody: CreateRoleDto,
    ): CancelablePromise<RoleSummaryDto> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/company/roles',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Bad Request`,
                403: `Forbidden`,
                409: `Conflict`,
            },
        });
    }
    /**
     * @param roleId
     * @param requestBody
     * @returns void
     * @throws ApiError
     */
    public static patchApiCompanyRoles(
        roleId: number,
        requestBody: UpdateRoleDto,
    ): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/company/roles/{roleId}',
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
    /**
     * @param roleId
     * @returns void
     * @throws ApiError
     */
    public static deleteApiCompanyRoles(
        roleId: number,
    ): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/company/roles/{roleId}',
            path: {
                'roleId': roleId,
            },
            errors: {
                403: `Forbidden`,
                404: `Not Found`,
                409: `Conflict`,
            },
        });
    }
    /**
     * @param roleId
     * @returns RoleMenuPermissionsDto OK
     * @throws ApiError
     */
    public static getApiCompanyRolesMenuPermissions(
        roleId: number,
    ): CancelablePromise<RoleMenuPermissionsDto> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/company/roles/{roleId}/menu-permissions',
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
    public static putApiCompanyRolesMenuPermissions(
        roleId: number,
        requestBody: SetRoleMenuPermissionsDto,
    ): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/company/roles/{roleId}/menu-permissions',
            path: {
                'roleId': roleId,
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
     * @param roleId
     * @returns void
     * @throws ApiError
     */
    public static deleteApiCompanyRolesMenuPermissions(
        roleId: number,
    ): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/company/roles/{roleId}/menu-permissions',
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
     * @returns RoleUserDto OK
     * @throws ApiError
     */
    public static getApiCompanyRolesUsers(): CancelablePromise<Array<RoleUserDto>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/company/roles/users',
            errors: {
                403: `Forbidden`,
            },
        });
    }
    /**
     * @param roleId
     * @param requestBody
     * @returns void
     * @throws ApiError
     */
    public static postApiCompanyRolesMembers(
        roleId: number,
        requestBody: AssignRoleUsersDto,
    ): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/company/roles/{roleId}/members',
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
