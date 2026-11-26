/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ContactLocationDto } from './ContactLocationDto';
export type ContactCompanyDto = {
    Id?: number;
    Name?: string;
    StatusId?: number;
    TypeId?: number;
    IsOwnCompany?: boolean;
    IsPrivate?: boolean;
    LegalName?: string;
    Industry?: string;
    Website?: string;
    MainPhone?: string;
    AccountNumber?: string;
    AccountManagerUserId?: number;
    AccountManagerName?: string;
    PaymentTermId?: number;
    TaxId?: string;
    Employees?: number;
    FleetVehicles?: number;
    CustomerSince?: string;
    AnnualRevenue?: number;
    Territory?: string;
    LeadSourceId?: number;
    PrimaryContactUserId?: number;
    ContactCount?: number;
    Locations?: Array<ContactLocationDto>;
};

