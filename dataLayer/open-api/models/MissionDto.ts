/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type MissionDto = {
    Id?: number;
    CreatorUserId?: number;
    CompanyId?: number;
    Name?: string;
    StatusId?: number;
    /**
     * Unix timestamp (seconds since epoch, UTC)
     */
    CreatedDate?: number;
    /**
     * Unix timestamp (seconds since epoch, UTC)
     */
    ClosedDate?: number;
    JoinKey?: string;
    JoinQrCode?: string;
};

