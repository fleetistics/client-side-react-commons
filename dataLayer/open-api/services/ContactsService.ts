/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ContactCompanyDto } from '../models/ContactCompanyDto';
import type { ContactCompanyRowDto } from '../models/ContactCompanyRowDto';
import type { ContactLookupsDto } from '../models/ContactLookupsDto';
import type { ContactMessageResultDto } from '../models/ContactMessageResultDto';
import type { ContactPersonDto } from '../models/ContactPersonDto';
import type { ContactPersonRowDto } from '../models/ContactPersonRowDto';
import type { PatchContactPersonDto } from '../models/PatchContactPersonDto';
import type { SaveContactCompanyDto } from '../models/SaveContactCompanyDto';
import type { SaveContactPersonDto } from '../models/SaveContactPersonDto';
import type { SendContactMessageDto } from '../models/SendContactMessageDto';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class ContactsService {
    /**
     * @returns ContactLookupsDto OK
     * @throws ApiError
     */
    public static getApiContactsLookups(): CancelablePromise<ContactLookupsDto> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/contacts/lookups',
            errors: {
                403: `Forbidden`,
            },
        });
    }
    /**
     * @returns ContactCompanyRowDto OK
     * @throws ApiError
     */
    public static getApiContactsCompanies(): CancelablePromise<Array<ContactCompanyRowDto>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/contacts/companies',
            errors: {
                403: `Forbidden`,
            },
        });
    }
    /**
     * @param requestBody
     * @returns ContactCompanyDto Created
     * @throws ApiError
     */
    public static postApiContactsCompanies(
        requestBody: SaveContactCompanyDto,
    ): CancelablePromise<ContactCompanyDto> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/contacts/companies',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Bad Request`,
                403: `Forbidden`,
            },
        });
    }
    /**
     * @param companyId
     * @returns ContactCompanyDto OK
     * @throws ApiError
     */
    public static getApiContactsCompanies1(
        companyId: number,
    ): CancelablePromise<ContactCompanyDto> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/contacts/companies/{companyId}',
            path: {
                'companyId': companyId,
            },
            errors: {
                403: `Forbidden`,
                404: `Not Found`,
            },
        });
    }
    /**
     * @param companyId
     * @param requestBody
     * @returns ContactCompanyDto OK
     * @throws ApiError
     */
    public static putApiContactsCompanies(
        companyId: number,
        requestBody: SaveContactCompanyDto,
    ): CancelablePromise<ContactCompanyDto> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/contacts/companies/{companyId}',
            path: {
                'companyId': companyId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Bad Request`,
                403: `Forbidden`,
                404: `Not Found`,
            },
        });
    }
    /**
     * @returns ContactPersonRowDto OK
     * @throws ApiError
     */
    public static getApiContactsPeople(): CancelablePromise<Array<ContactPersonRowDto>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/contacts/people',
            errors: {
                403: `Forbidden`,
            },
        });
    }
    /**
     * @param requestBody
     * @returns ContactPersonDto Created
     * @throws ApiError
     */
    public static postApiContactsPeople(
        requestBody: SaveContactPersonDto,
    ): CancelablePromise<ContactPersonDto> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/contacts/people',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Bad Request`,
                403: `Forbidden`,
            },
        });
    }
    /**
     * @param personId
     * @returns ContactPersonDto OK
     * @throws ApiError
     */
    public static getApiContactsPeople1(
        personId: number,
    ): CancelablePromise<ContactPersonDto> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/contacts/people/{personId}',
            path: {
                'personId': personId,
            },
            errors: {
                403: `Forbidden`,
                404: `Not Found`,
            },
        });
    }
    /**
     * @param personId
     * @param requestBody
     * @returns ContactPersonDto OK
     * @throws ApiError
     */
    public static putApiContactsPeople(
        personId: number,
        requestBody: SaveContactPersonDto,
    ): CancelablePromise<ContactPersonDto> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/contacts/people/{personId}',
            path: {
                'personId': personId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Bad Request`,
                403: `Forbidden`,
                404: `Not Found`,
            },
        });
    }
    /**
     * @param personId
     * @param requestBody
     * @returns ContactPersonDto OK
     * @throws ApiError
     */
    public static patchApiContactsPeople(
        personId: number,
        requestBody: PatchContactPersonDto,
    ): CancelablePromise<ContactPersonDto> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/contacts/people/{personId}',
            path: {
                'personId': personId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Bad Request`,
                403: `Forbidden`,
                404: `Not Found`,
            },
        });
    }
    /**
     * @param personId
     * @param requestBody
     * @returns ContactMessageResultDto OK
     * @throws ApiError
     */
    public static postApiContactsPeopleMessage(
        personId: number,
        requestBody: SendContactMessageDto,
    ): CancelablePromise<ContactMessageResultDto> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/contacts/people/{personId}/message',
            path: {
                'personId': personId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Bad Request`,
                403: `Forbidden`,
                404: `Not Found`,
            },
        });
    }
    /**
     * @param personId
     * @returns ContactPersonDto OK
     * @throws ApiError
     */
    public static postApiContactsPeopleSuspend(
        personId: number,
    ): CancelablePromise<ContactPersonDto> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/contacts/people/{personId}/suspend',
            path: {
                'personId': personId,
            },
            errors: {
                400: `Bad Request`,
                403: `Forbidden`,
                404: `Not Found`,
            },
        });
    }
    /**
     * @param personId
     * @returns ContactPersonDto OK
     * @throws ApiError
     */
    public static postApiContactsPeopleResume(
        personId: number,
    ): CancelablePromise<ContactPersonDto> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/contacts/people/{personId}/resume',
            path: {
                'personId': personId,
            },
            errors: {
                400: `Bad Request`,
                403: `Forbidden`,
                404: `Not Found`,
            },
        });
    }
    /**
     * @param personId
     * @returns ContactPersonDto OK
     * @throws ApiError
     */
    public static postApiContactsPeopleArchive(
        personId: number,
    ): CancelablePromise<ContactPersonDto> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/contacts/people/{personId}/archive',
            path: {
                'personId': personId,
            },
            errors: {
                400: `Bad Request`,
                403: `Forbidden`,
                404: `Not Found`,
            },
        });
    }
}
