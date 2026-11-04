/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { MobileLocationActivity } from './MobileLocationActivity';
import type { MobileLocationBattery } from './MobileLocationBattery';
import type { MobileLocationCoords } from './MobileLocationCoords';
import type { MobileLocationProvider } from './MobileLocationProvider';
export type MobileLocation = {
    /**
     * Unix timestamp (seconds since epoch, UTC)
     */
    timestamp?: number;
    odometer?: number;
    odometer_error?: number;
    coords?: MobileLocationCoords;
    battery?: MobileLocationBattery;
    activity?: MobileLocationActivity;
    provider?: MobileLocationProvider;
};

