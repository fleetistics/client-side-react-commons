/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CompanyDto } from '../models/CompanyDto';
import type { LatestUserSessionDto } from '../models/LatestUserSessionDto';
import type { PermissionRoleDto } from '../models/PermissionRoleDto';
import type { User2CompanyDto } from '../models/User2CompanyDto';
import type { User2GroupDto } from '../models/User2GroupDto';
import type { UserDto } from '../models/UserDto';
import type { UserGroupDto } from '../models/UserGroupDto';
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
     * @returns LatestUserSessionDto OK
     * @throws ApiError
     */
    public static getApiCompanyAdminLatestUserSessions(): CancelablePromise<Array<LatestUserSessionDto>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/company-admin/latest-user-sessions',
            errors: {
                403: `Forbidden`,
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
