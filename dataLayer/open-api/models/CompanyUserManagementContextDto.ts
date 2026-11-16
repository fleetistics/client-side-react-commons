/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { LatestUserActivityDto } from './LatestUserActivityDto';
import type { PermissionRoleDto } from './PermissionRoleDto';
import type { User2CompanyDto } from './User2CompanyDto';
import type { User2GroupDto } from './User2GroupDto';
import type { UserDto } from './UserDto';
import type { UserGroupDto } from './UserGroupDto';
import type { UserJoinInvitationDto } from './UserJoinInvitationDto';
import type { UserJoinRequestDto } from './UserJoinRequestDto';
export type CompanyUserManagementContextDto = {
    LatestUpdate?: number;
    Users?: Array<UserDto>;
    PermissionRoles?: Array<PermissionRoleDto>;
    UserGroups?: Array<UserGroupDto>;
    UserJoinRequests?: Array<UserJoinRequestDto>;
    UserJoinInvitations?: Array<UserJoinInvitationDto>;
    User2Groups?: Array<User2GroupDto>;
    User2Companies?: Array<User2CompanyDto>;
    LatestUserActivities?: Array<LatestUserActivityDto>;
};

