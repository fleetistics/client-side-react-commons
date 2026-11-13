/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type UserJoinInvitationDto = {
    Id?: number;
    CompanyId?: number;
    CreatedByUserId?: number;
    JoinCode?: string;
    JoinQrCodeImageName?: string;
    PermissionRoleId?: number;
    GroupId?: number;
    IsPersonal?: boolean;
    IsAutoAppRegistrationAllowed?: boolean;
    DoesNotRequireAdminApproval?: boolean;
    UserId?: number;
    Email?: string;
    Name?: string;
    Message?: string;
    StatusId?: number;
    /**
     * Unix timestamp (seconds since epoch, UTC)
     */
    CreationDate?: number;
    /**
     * Unix timestamp (seconds since epoch, UTC)
     */
    ExpirationDate?: number;
};

