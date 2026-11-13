/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { SessionClientInfo } from './SessionClientInfo';
export type LatestUserSessionDto = {
    Id?: number;
    UserId?: number;
    MobileGpsDeviceId?: number;
    StatusId?: number;
    SessionSourceId?: number;
    /**
     * Unix timestamp (seconds since epoch, UTC)
     */
    LatestUpdate?: number;
    ClientInfo?: SessionClientInfo;
};

