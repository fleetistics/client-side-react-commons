/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ActivityRecurrenceDto } from './ActivityRecurrenceDto';
export type ActivityDto = {
    Recurrence?: ActivityRecurrenceDto;
    Id?: number;
    TypeId?: number;
    Subject?: string;
    Notes?: string;
    PriorityId?: number;
    StatusId?: number;
    CompanyId?: number;
    CompanyName?: string;
    ContactUserId?: number;
    ContactName?: string;
    AssignedToUserId?: number;
    AssignedToName?: string;
    CreatedByUserId?: number;
    CreatedByName?: string;
    /**
     * Unix timestamp (seconds since epoch, UTC)
     */
    StartAt?: number;
    DurationMinutes?: number;
    /**
     * Unix timestamp (seconds since epoch, UTC)
     */
    CompletedAt?: number;
    SeriesId?: number;
    OccurrenceNumber?: number;
    OccurrenceCount?: number;
    IsPrivate?: boolean;
};

