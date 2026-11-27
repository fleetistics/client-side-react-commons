/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ActivityRecurrenceDto } from './ActivityRecurrenceDto';
export type SaveActivityDto = {
    TypeId?: number;
    Subject?: string;
    Notes?: string;
    PriorityId?: number;
    CompanyId?: number;
    ContactUserId?: number;
    AssignedToUserId?: number;
    /**
     * Unix timestamp (seconds since epoch, UTC)
     */
    StartAt?: number;
    DurationMinutes?: number;
    Log?: boolean;
    Recurrence?: ActivityRecurrenceDto;
    IsPrivate?: boolean;
};

