import { apiSlice } from '@/client-side.Commons/dataLayer/core/apiSlice';
import type { CompanyJoinCodeDto } from '@/client-side.Commons/dataLayer/open-api/models/CompanyJoinCodeDto';
import type { InvitationResultDto } from '@/client-side.Commons/dataLayer/open-api/models/InvitationResultDto';
import type { InviteUserDto } from '@/client-side.Commons/dataLayer/open-api/models/InviteUserDto';
import type { JoinAcceptedDto } from '@/client-side.Commons/dataLayer/open-api/models/JoinAcceptedDto';
import type { JoinInfoDto } from '@/client-side.Commons/dataLayer/open-api/models/JoinInfoDto';
import type { JoinInvitationRowDto } from '@/client-side.Commons/dataLayer/open-api/models/JoinInvitationRowDto';
import type { JoinRequestRowDto } from '@/client-side.Commons/dataLayer/open-api/models/JoinRequestRowDto';
import type { RegenerateCompanyJoinCodeDto } from '@/client-side.Commons/dataLayer/open-api/models/RegenerateCompanyJoinCodeDto';
import { companyApi } from '@/client-side.Commons/dataLayer/api/company/companyApi';
import { APP_CONFIG } from '@/client-side.Impl/config/app-config';

// api-server's CompanyJoinController (/api/company/join: the Invites & Join tab of User Management) and JoinController (/api/join: the
// accept page). Types are generated from the OpenAPI. Not restricted by role yet.
// Errors are ProblemDetails { title, detail }: 400 bad input, 403 joining switched off / account suspended, 404 not found / wrong code /
// no invitation, 409 a rule says no (for example already a member), 429 too many wrong codes.
const company = APP_CONFIG.BASE_API_URL + 'company/join';
const join = APP_CONFIG.BASE_API_URL + 'join';

const INVITATIONS_TAG = { type: 'Join', id: 'INVITATIONS' } as const;
const REQUESTS_TAG = { type: 'Join', id: 'REQUESTS' } as const;
const COMPANY_CODE_TAG = { type: 'Join', id: 'COMPANY_CODE' } as const;

/** What the accept page sends: the typed (or linked) code, and whether it came by the company link (no invitation needed). */
export type JoinCodeArgs = { code: string; companyLink: boolean };

export const companyJoinApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // The company's invitations to people, newest first. The company code is not among them.
    getJoinInvitations: builder.query<JoinInvitationRowDto[], void>({
      query: () => `${company}/invitations`,
      providesTags: [INVITATIONS_TAG],
    }),

    // Invites one person: stores the invitation and emails the code and the accept link. 201 with the code and EmailState.
    // 409 when the address already belongs to a member. The server cancels an earlier open invitation to the same address.
    inviteUser: builder.mutation<InvitationResultDto, InviteUserDto>({
      query: (body) => ({ url: `${company}/invitations`, method: 'POST', body }),
      invalidatesTags: [INVITATIONS_TAG],
    }),

    // Sends the email of an open invitation again, with the same code. 409 when it is expired, accepted or cancelled.
    resendJoinInvitation: builder.mutation<InvitationResultDto, number>({
      query: (invitationId) => ({ url: `${company}/invitations/${invitationId}/resend`, method: 'POST' }),
      invalidatesTags: [INVITATIONS_TAG],
    }),

    // A new expiry (the configured length, from now) for an expired invitation, and the email again. 409 for an accepted or cancelled one.
    renewJoinInvitation: builder.mutation<InvitationResultDto, number>({
      query: (invitationId) => ({ url: `${company}/invitations/${invitationId}/renew`, method: 'POST' }),
      invalidatesTags: [INVITATIONS_TAG],
    }),

    // Cancels an open invitation. 204.
    revokeJoinInvitation: builder.mutation<void, number>({
      query: (invitationId) => ({ url: `${company}/invitations/${invitationId}`, method: 'DELETE' }),
      invalidatesTags: [INVITATIONS_TAG],
    }),

    // The company's join code, the one anonymous row: it is the same each visit and is made only when the company has none.
    // It also counts the open invitations (they carry this code), so a new invitation or a revoke refreshes it.
    getCompanyJoinCode: builder.query<CompanyJoinCodeDto, void>({
      query: () => `${company}/company-code`,
      providesTags: [COMPANY_CODE_TAG, INVITATIONS_TAG],
    }),

    // A new code on the same row with the role, group and approval setting in the body. The old code, its links and the emails that
    // carry it stop working.
    regenerateCompanyJoinCode: builder.mutation<CompanyJoinCodeDto, RegenerateCompanyJoinCodeDto>({
      query: (body) => ({ url: `${company}/company-code/regenerate`, method: 'POST', body }),
      invalidatesTags: [COMPANY_CODE_TAG],
    }),

    // Switches joining with the company link on or off ("Allow people to request access with a code").
    setCompanyJoinCodeEnabled: builder.mutation<CompanyJoinCodeDto, boolean>({
      query: (enabled) => ({ url: `${company}/company-code/enabled`, method: 'PUT', body: { Enabled: enabled } }),
      invalidatesTags: [COMPANY_CODE_TAG],
    }),

    // Every request to join the company, newest first.
    getJoinRequests: builder.query<JoinRequestRowDto[], void>({
      query: () => `${company}/requests`,
      providesTags: [REQUESTS_TAG],
    }),

    // Lets the person in (makes them a member): refetches the user-management context, which lists the members. 204.
    approveJoinRequest: builder.mutation<void, number>({
      query: (requestId) => ({ url: `${company}/requests/${requestId}/approve`, method: 'POST' }),
      invalidatesTags: [REQUESTS_TAG],
      async onQueryStarted(_id, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
        } catch {
          return;
        }
        void dispatch(companyApi.endpoints.getUserManagementContext.initiate(undefined, { forceRefetch: true }));
      },
    }),

    denyJoinRequest: builder.mutation<void, number>({
      query: (requestId) => ({ url: `${company}/requests/${requestId}/deny`, method: 'POST' }),
      invalidatesTags: [REQUESTS_TAG],
    }),

    // ---- the accept page (the signed-in invitee) ----

    // Which company a code leads to, without using it. 404 for a wrong code (counts against the user) or no invitation, 403 when
    // the company link is switched off, 429 when locked.
    lookupJoinCode: builder.mutation<JoinInfoDto, JoinCodeArgs>({
      query: ({ code, companyLink }) => ({ url: `${join}/lookup`, method: 'POST', body: { Code: code, CompanyLink: companyLink } }),
    }),

    // Uses the code: Result is "Joined" or "PendingApproval". 409 when the person (or another account with their email) is already a member.
    acceptJoin: builder.mutation<JoinAcceptedDto, JoinCodeArgs>({
      query: ({ code, companyLink }) => ({ url: `${join}/accept`, method: 'POST', body: { Code: code, CompanyLink: companyLink } }),
    }),

    // Turns the person's invitation down. 204. (The company link has no Deny.)
    denyJoin: builder.mutation<void, JoinCodeArgs>({
      query: ({ code, companyLink }) => ({ url: `${join}/deny`, method: 'POST', body: { Code: code, CompanyLink: companyLink } }),
    }),
  }),
});

export const {
  useGetJoinInvitationsQuery,
  useInviteUserMutation,
  useResendJoinInvitationMutation,
  useRenewJoinInvitationMutation,
  useRevokeJoinInvitationMutation,
  useGetCompanyJoinCodeQuery,
  useRegenerateCompanyJoinCodeMutation,
  useSetCompanyJoinCodeEnabledMutation,
  useGetJoinRequestsQuery,
  useApproveJoinRequestMutation,
  useDenyJoinRequestMutation,
  useLookupJoinCodeMutation,
  useAcceptJoinMutation,
  useDenyJoinMutation,
} = companyJoinApi;
