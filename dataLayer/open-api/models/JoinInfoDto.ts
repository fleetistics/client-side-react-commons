/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type JoinInfoDto = {
    InvitationId?: number;
    CompanyName?: string;
    InviterName?: string;
    InviteeName?: string;
    Message?: string;
    RequiresApproval?: boolean;
    /**
     * Unix timestamp (seconds since epoch, UTC)
     */
    ExpirationDate?: number;
};

