import { apiSlice } from '@/client-side.Commons/dataLayer/core/apiSlice';
import type { CompanyJoinCodeDto } from '@/client-side.Commons/dataLayer/open-api/models/CompanyJoinCodeDto';
import type { InvitationResultDto } from '@/client-side.Commons/dataLayer/open-api/models/InvitationResultDto';
import type { InviteUserDto } from '@/client-side.Commons/dataLayer/open-api/models/InviteUserDto';
import type { JoinAcceptedDto } from '@/client-side.Commons/dataLayer/open-api/models/JoinAcceptedDto';
import type { JoinInfoDto } from '@/client-side.Commons/dataLayer/open-api/models/JoinInfoDto';
import type { JoinInvitationRowDto } from '@/client-side.Commons/dataLayer/open-api/models/JoinInvitationRowDto';
import type { JoinRequestRowDto } from '@/client-side.Commons/dataLayer/open-api/models/JoinRequestRowDto';
import type { UpdateCompanyJoinCodeDto } from '@/client-side.Commons/dataLayer/open-api/models/UpdateCompanyJoinCodeDto';
import { companyApi } from '@/client-side.Commons/dataLayer/api/company/companyApi';
import { APP_CONFIG } from '@/client-side.Impl/config/app-config';

// api-server's CompanyJoinController (/api/company/join: the Invites & Join tab of User Management) and JoinController (/api/join: the
// accept-invitation page). Types are generated from the OpenAPI. Not restricted by role yet.
// Errors are ProblemDetails { title, detail }: 400 bad input, 404 not found / wrong code, 409 a rule says no, 429 too many wrong codes.
const company = APP_CONFIG.BASE_API_URL + 'company/join';
const join = APP_CONFIG.BASE_API_URL + 'join';

const INVITATIONS_TAG = { type: 'Join', id: 'INVITATIONS' } as const;
const REQUESTS_TAG = { type: 'Join', id: 'REQUESTS' } as const;

export const companyJoinApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // The company's personal invitations, newest first (their codes are never returned: only a hash is stored).
    getJoinInvitations: builder.query<JoinInvitationRowDto[], void>({
      query: () => `${company}/invitations`,
      providesTags: [INVITATIONS_TAG],
    }),

    // Invites one person: stores the invitation and emails the code and the accept link. 201 with the code in plain text (shown once)
    // and EmailState. 409 when the address already belongs to a member. Not retried by hand: the server cancels an earlier open invitation
    // to the same address, so a repeat would only replace this one with another.
    inviteUser: builder.mutation<InvitationResultDto, InviteUserDto>({
      query: (body) => ({ url: `${company}/invitations`, method: 'POST', body }),
      invalidatesTags: [INVITATIONS_TAG],
    }),

    // New code + new expiry, sent again. 200 like inviteUser. 409 for an accepted or cancelled invitation.
    renewJoinInvitation: builder.mutation<InvitationResultDto, number>({
      query: (invitationId) => ({ url: `${company}/invitations/${invitationId}/renew`, method: 'POST' }),
      invalidatesTags: [INVITATIONS_TAG],
    }),

    // Cancels an open invitation. 204.
    revokeJoinInvitation: builder.mutation<void, number>({
      query: (invitationId) => ({ url: `${company}/invitations/${invitationId}`, method: 'DELETE' }),
      invalidatesTags: [INVITATIONS_TAG],
    }),

    // Makes a new one-time company code and cancels the old one: called when the tab opens. The code is in the answer only.
    newCompanyJoinCode: builder.mutation<CompanyJoinCodeDto, void>({
      query: () => ({ url: `${company}/company-code`, method: 'POST' }),
    }),

    // What people who join with the current company code get (the three values replace the old ones). 204.
    updateCompanyJoinCode: builder.mutation<void, { invitationId: number; body: UpdateCompanyJoinCodeDto }>({
      query: ({ invitationId, body }) => ({ url: `${company}/company-code/${invitationId}`, method: 'PUT', body }),
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

    // What the page opened from the email link shows; 404 when the invitation is not open for this user.
    getJoinInvitationInfo: builder.query<JoinInfoDto, number>({
      query: (invitationId) => `${join}/invitations/${invitationId}`,
    }),

    // Which company a code leads to, without using it. 404 for a wrong code (counts against the user), 429 when locked.
    lookupJoinCode: builder.mutation<JoinInfoDto, string>({
      query: (code) => ({ url: `${join}/lookup`, method: 'POST', body: { Code: code } }),
    }),

    // Uses the code: Result is "Joined" or "PendingApproval". 403 for an invitation sent to another address, 409 when already a member.
    acceptJoin: builder.mutation<JoinAcceptedDto, string>({
      query: (code) => ({ url: `${join}/accept`, method: 'POST', body: { Code: code } }),
    }),

    // Turns a personal invitation down. 204.
    denyJoin: builder.mutation<void, string>({
      query: (code) => ({ url: `${join}/deny`, method: 'POST', body: { Code: code } }),
    }),
  }),
});

export const {
  useGetJoinInvitationsQuery,
  useInviteUserMutation,
  useRenewJoinInvitationMutation,
  useRevokeJoinInvitationMutation,
  useNewCompanyJoinCodeMutation,
  useUpdateCompanyJoinCodeMutation,
  useGetJoinRequestsQuery,
  useApproveJoinRequestMutation,
  useDenyJoinRequestMutation,
  useGetJoinInvitationInfoQuery,
  useLookupJoinCodeMutation,
  useAcceptJoinMutation,
  useDenyJoinMutation,
} = companyJoinApi;
