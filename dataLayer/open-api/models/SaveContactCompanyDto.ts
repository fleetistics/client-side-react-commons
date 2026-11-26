/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ContactLocationDto } from './ContactLocationDto';
import type { SaveContactPersonDto } from './SaveContactPersonDto';
export type SaveContactCompanyDto = {
    Name: string;
    TypeId?: number;
    StatusId?: number;
    LegalName?: string;
    Industry?: string;
    Website?: string;
    MainPhone?: string;
    AccountManagerUserId?: number;
    PaymentTermId?: number;
    TaxId?: string;
    Employees?: number;
    FleetVehicles?: number;
    CustomerSince?: string;
    AnnualRevenue?: number;
    Territory?: string;
    LeadSourceId?: number;
    Locations?: Array<ContactLocationDto>;
    IsPrivate?: boolean;
    PrimaryContact?: SaveContactPersonDto;
};

