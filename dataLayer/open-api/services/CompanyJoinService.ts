/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CompanyJoinCodeDto } from '../models/CompanyJoinCodeDto';
import type { InvitationResultDto } from '../models/InvitationResultDto';
import type { InviteUserDto } from '../models/InviteUserDto';
import type { JoinInvitationRowDto } from '../models/JoinInvitationRowDto';
import type { JoinRequestRowDto } from '../models/JoinRequestRowDto';
import type { UpdateCompanyJoinCodeDto } from '../models/UpdateCompanyJoinCodeDto';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class CompanyJoinService {
    /**
     * @returns JoinInvitationRowDto OK
     * @throws ApiError
     */
    public static getApiCompanyJoinInvitations(): CancelablePromise<Array<JoinInvitationRowDto>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/company/join/invitations',
            errors: {
                403: `Forbidden`,
            },
        });
    }
    /**
     * @param requestBody
     * @returns InvitationResultDto Created
     * @throws ApiError
     */
    public static postApiCompanyJoinInvitations(
        requestBody: InviteUserDto,
    ): CancelablePromise<InvitationResultDto> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/company/join/invitations',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Bad Request`,
                403: `Forbidden`,
                409: `Conflict`,
            },
        });
    }
    /**
     * @param invitationId
     * @returns InvitationResultDto OK
     * @throws ApiError
     */
    public static postApiCompanyJoinInvitationsRenew(
        invitationId: number,
    ): CancelablePromise<InvitationResultDto> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/company/join/invitations/{invitationId}/renew',
            path: {
                'invitationId': invitationId,
            },
            errors: {
                403: `Forbidden`,
                404: `Not Found`,
                409: `Conflict`,
            },
        });
    }
    /**
     * @param invitationId
     * @returns void
     * @throws ApiError
     */
    public static deleteApiCompanyJoinInvitations(
        invitationId: number,
    ): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/company/join/invitations/{invitationId}',
            path: {
                'invitationId': invitationId,
            },
            errors: {
                403: `Forbidden`,
                404: `Not Found`,
                409: `Conflict`,
            },
        });
    }
    /**
     * @returns CompanyJoinCodeDto OK
     * @throws ApiError
     */
    public static postApiCompanyJoinCompanyCode(): CancelablePromise<CompanyJoinCodeDto> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/company/join/company-code',
            errors: {
                403: `Forbidden`,
            },
        });
    }
    /**
     * @param invitationId
     * @param requestBody
     * @returns void
     * @throws ApiError
     */
    public static putApiCompanyJoinCompanyCode(
        invitationId: number,
        requestBody: UpdateCompanyJoinCodeDto,
    ): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/company/join/company-code/{invitationId}',
            path: {
                'invitationId': invitationId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Bad Request`,
                403: `Forbidden`,
                404: `Not Found`,
                409: `Conflict`,
            },
        });
    }
    /**
     * @returns JoinRequestRowDto OK
     * @throws ApiError
     */
    public static getApiCompanyJoinRequests(): CancelablePromise<Array<JoinRequestRowDto>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/company/join/requests',
            errors: {
                403: `Forbidden`,
            },
        });
    }
    /**
     * @param requestId
     * @returns void
     * @throws ApiError
     */
    public static postApiCompanyJoinRequestsApprove(
        requestId: number,
    ): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/company/join/requests/{requestId}/approve',
            path: {
                'requestId': requestId,
            },
            errors: {
                403: `Forbidden`,
                404: `Not Found`,
                409: `Conflict`,
            },
        });
    }
    /**
     * @param requestId
     * @returns void
     * @throws ApiError
     */
    public static postApiCompanyJoinRequestsDeny(
        requestId: number,
    ): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/company/join/requests/{requestId}/deny',
            path: {
                'requestId': requestId,
            },
            errors: {
                403: `Forbidden`,
                404: `Not Found`,
                409: `Conflict`,
            },
        });
    }
}
