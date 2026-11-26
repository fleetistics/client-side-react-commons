/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type UserEmergencyAlertDto = {
    Id?: number;
    UserId?: number;
    GpsDeviceId?: number;
    /**
     * Unix timestamp (seconds since epoch, UTC)
     */
    CreatedDate?: number;
    /**
     * Unix timestamp (seconds since epoch, UTC)
     */
    CompletedDate?: number;
    Latitude?: number;
    Longitude?: number;
    StatusId?: number;
    /**
     * Unix timestamp (seconds since epoch, UTC)
     */
    LatestUpdate?: number;
};

