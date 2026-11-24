/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type JoinInvitationRowDto = {
    Id?: number;
    Email?: string;
    Name?: string;
    Message?: string;
    PermissionRoleId?: number;
    GroupId?: number;
    RequireAdminApproval?: boolean;
    StatusId?: number;
    IsExpired?: boolean;
    /**
     * Unix timestamp (seconds since epoch, UTC)
     */
    CreationDate?: number;
    /**
     * Unix timestamp (seconds since epoch, UTC)
     */
    ExpirationDate?: number;
    CreatedByUserId?: number;
    CreatedByName?: string;
};

