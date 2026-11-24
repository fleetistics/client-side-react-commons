/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type CompanyJoinCodeDto = {
    Id?: number;
    JoinCode?: string;
    /**
     * Unix timestamp (seconds since epoch, UTC)
     */
    ExpirationDate?: number;
    PermissionRoleId?: number;
    GroupId?: number;
    RequireAdminApproval?: boolean;
};

