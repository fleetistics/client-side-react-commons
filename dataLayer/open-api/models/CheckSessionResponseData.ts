/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { RefreshAppLocationTokenResponseData } from './RefreshAppLocationTokenResponseData';
import type { UserSessionInfoDto } from './UserSessionInfoDto';
export type CheckSessionResponseData = {
    SessionSign?: string;
    RotationCounter?: number;
    AccessToken?: string;
    UserSessionInfo?: UserSessionInfoDto;
    AppLocationTokenInfo?: RefreshAppLocationTokenResponseData;
};

