/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { InboundUploadedMediaDto } from './InboundUploadedMediaDto';
export type UserPatchDto = {
    DisplayName?: string;
    FirstName?: string;
    LastName?: string | null;
    Phone?: string | null;
    Email?: string | null;
    IconKeyOnMap?: number | null;
    IsMfaEnabled?: boolean;
    InsertMedias?: Array<InboundUploadedMediaDto>;
    RemoveMediaIds?: Array<number>;
};

