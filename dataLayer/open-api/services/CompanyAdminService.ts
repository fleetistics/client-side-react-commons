/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CompanyDto } from '../models/CompanyDto';
import type { CompanyUserManagementContextDto } from '../models/CompanyUserManagementContextDto';
import type { PermissionRoleDto } from '../models/PermissionRoleDto';
import type { User2CompanyDto } from '../models/User2CompanyDto';
import type { User2CompanyPatchDto } from '../models/User2CompanyPatchDto';
import type { User2GroupDto } from '../models/User2GroupDto';
import type { User2GroupPatchDto } from '../models/User2GroupPatchDto';
import type { UserDto } from '../models/UserDto';
import type { UserGroupCreateDto } from '../models/UserGroupCreateDto';
import type { UserGroupDto } from '../models/UserGroupDto';
import type { UserGroupPatchDto } from '../models/UserGroupPatchDto';
import type { UserJoinInvitationDto } from '../models/UserJoinInvitationDto';
import type { UserJoinRequestDto } from '../models/UserJoinRequestDto';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class CompanyAdminService {
    /**
     * @returns CompanyDto OK
     * @throws ApiError
     */
    public static getApiCompanyAdminCompany(): CancelablePromise<CompanyDto> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/company-admin/company',
            errors: {
                403: `Forbidden`,
                404: `Not Found`,
            },
        });
    }
    /**
     * @returns CompanyUserManagementContextDto OK
     * @throws ApiError
     */
    public static getApiCompanyAdminUserManagementContext(): CancelablePromise<CompanyUserManagementContextDto> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/company-admin/user-management-context',
            errors: {
                403: `Forbidden`,
            },
        });
    }
    /**
     * @returns UserDto OK
     * @throws ApiError
     */
    public static getApiCompanyAdminActiveCompanyUsers(): CancelablePromise<Array<UserDto>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/company-admin/active-company-users',
            errors: {
                403: `Forbidden`,
            },
        });
    }
    /**
     * @returns UserDto OK
     * @throws ApiError
     */
    public static getApiCompanyAdminNotActiveRelatedUsers(): CancelablePromise<Array<UserDto>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/company-admin/not-active-related-users',
            errors: {
                403: `Forbidden`,
            },
        });
    }
    /**
     * @returns User2CompanyDto OK
     * @throws ApiError
     */
    public static getApiCompanyAdminUser2Company(): CancelablePromise<Array<User2CompanyDto>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/company-admin/user2company',
            errors: {
                403: `Forbidden`,
            },
        });
    }
    /**
     * @param userId
     * @param requestBody
     * @returns void
     * @throws ApiError
     */
    public static patchApiCompanyAdminUser2Company(
        userId: number,
        requestBody: User2CompanyPatchDto,
    ): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/company-admin/user2company/{userId}',
            path: {
                'userId': userId,
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
     * @param userId
     * @param requestBody
     * @returns void
     * @throws ApiError
     */
    public static patchApiCompanyAdminUser2Group(
        userId: number,
        requestBody: User2GroupPatchDto,
    ): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/company-admin/user2group/{userId}',
            path: {
                'userId': userId,
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
     * @returns PermissionRoleDto OK
     * @throws ApiError
     */
    public static getApiCompanyAdminPermissionRoles(): CancelablePromise<Array<PermissionRoleDto>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/company-admin/permission-roles',
            errors: {
                403: `Forbidden`,
            },
        });
    }
    /**
     * @returns UserGroupDto OK
     * @throws ApiError
     */
    public static getApiCompanyAdminUserGroups(): CancelablePromise<Array<UserGroupDto>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/company-admin/user-groups',
            errors: {
                403: `Forbidden`,
            },
        });
    }
    /**
     * @param requestBody
     * @returns UserGroupDto Created
     * @throws ApiError
     */
    public static postApiCompanyAdminUserGroups(
        requestBody: UserGroupCreateDto,
    ): CancelablePromise<UserGroupDto> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/company-admin/user-groups',
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
     * @param groupId
     * @param requestBody
     * @returns void
     * @throws ApiError
     */
    public static patchApiCompanyAdminUserGroups(
        groupId: number,
        requestBody: UserGroupPatchDto,
    ): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/company-admin/user-groups/{groupId}',
            path: {
                'groupId': groupId,
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
     * @param groupId
     * @returns void
     * @throws ApiError
     */
    public static deleteApiCompanyAdminUserGroups(
        groupId: number,
    ): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/company-admin/user-groups/{groupId}',
            path: {
                'groupId': groupId,
            },
            errors: {
                403: `Forbidden`,
                404: `Not Found`,
            },
        });
    }
    /**
     * @returns User2GroupDto OK
     * @throws ApiError
     */
    public static getApiCompanyAdminUser2Group(): CancelablePromise<Array<User2GroupDto>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/company-admin/user2group',
            errors: {
                403: `Forbidden`,
            },
        });
    }
    /**
     * @returns UserJoinInvitationDto OK
     * @throws ApiError
     */
    public static getApiCompanyAdminUserJoinInvitations(): CancelablePromise<Array<UserJoinInvitationDto>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/company-admin/user-join-invitations',
            errors: {
                403: `Forbidden`,
            },
        });
    }
    /**
     * @returns UserJoinRequestDto OK
     * @throws ApiError
     */
    public static getApiCompanyAdminUserJoinRequests(): CancelablePromise<Array<UserJoinRequestDto>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/company-admin/user-join-requests',
            errors: {
                403: `Forbidden`,
            },
        });
    }
}
