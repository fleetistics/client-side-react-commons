/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { SaveContactCompanyDto } from './SaveContactCompanyDto';
export type SaveContactPersonDto = {
    FirstName: string;
    LastName?: string;
    Title?: string;
    Email?: string;
    Phone?: string;
    Mobile?: string;
    ContactTypeId?: number;
    EmployeeStatusId?: number;
    LeadSourceId?: number;
    CompanyId?: number;
    IsPrivate?: boolean;
    IsPrimary?: boolean;
    NewCompany?: SaveContactCompanyDto;
};

