/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { InboundUploadedMediaDto } from './InboundUploadedMediaDto';
export type TeamDetailsPatchDto = {
    IncidentName?: string | null;
    Notes?: string | null;
    InsertMedias?: Array<InboundUploadedMediaDto>;
    RemoveMediaIds?: Array<number>;
};

