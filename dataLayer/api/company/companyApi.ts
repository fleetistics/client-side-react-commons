import { apiSlice } from '@/client-side.Commons/dataLayer/core/apiSlice';
import { APP_URLS } from '@/client-side.Impl/config/app-urls';
import type {
  CompanyDto,
  LatestUserSessionDto,
  PermissionRoleDto,
  User2CompanyDto,
  User2GroupDto,
  UserDto,
  UserGroupDto,
  UserJoinInvitationDto,
  UserJoinRequestDto,
} from '@/client-side.Commons/dataLayer/open-api';

// Mirrors api-server's CompanyAdminController. Every endpoint is scoped to the caller's current
// company (the CompanyId claim) and answers 403 when the caller has none. All of them are reads.
export const companyApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // GET /api/company-admin/company - 404 when the company does not exist.
    getCompany: builder.query<CompanyDto, void>({
      query: () => APP_URLS.BASE_COMPANY_ADMIN_URL + '/company',
    }),

    // GET /api/company-admin/active-company-users - active users whose CompanyId is the current company.
    getActiveCompanyUsers: builder.query<UserDto[], void>({
      query: () => APP_URLS.BASE_COMPANY_ADMIN_URL + '/active-company-users',
    }),

    // GET /api/company-admin/not-active-related-users - users with a non-active User2Company status
    // plus users with a join request to the company (any request status).
    getNotActiveCompanyRelatedUsers: builder.query<UserDto[], void>({
      query: () => APP_URLS.BASE_COMPANY_ADMIN_URL + '/not-active-related-users',
    }),

    // GET /api/company-admin/user2company
    getUser2Company: builder.query<User2CompanyDto[], void>({
      query: () => APP_URLS.BASE_COMPANY_ADMIN_URL + '/user2company',
    }),

    // GET /api/company-admin/latest-user-sessions - one session per user: the latest active one, or the
    // latest of any status when the user has no active session. Users without sessions are omitted.
    getLatestUserSessions: builder.query<LatestUserSessionDto[], void>({
      query: () => APP_URLS.BASE_COMPANY_ADMIN_URL + '/latest-user-sessions',
    }),

    // GET /api/company-admin/permission-roles - system-wide roles (no CompanyId) plus the company's own.
    getPermissionRoles: builder.query<PermissionRoleDto[], void>({
      query: () => APP_URLS.BASE_COMPANY_ADMIN_URL + '/permission-roles',
    }),

    // GET /api/company-admin/user-groups
    getUserGroups: builder.query<UserGroupDto[], void>({
      query: () => APP_URLS.BASE_COMPANY_ADMIN_URL + '/user-groups',
    }),

    // GET /api/company-admin/user2group
    getUser2Groups: builder.query<User2GroupDto[], void>({
      query: () => APP_URLS.BASE_COMPANY_ADMIN_URL + '/user2group',
    }),

    // GET /api/company-admin/user-join-invitations
    getUserJoinInvitations: builder.query<UserJoinInvitationDto[], void>({
      query: () => APP_URLS.BASE_COMPANY_ADMIN_URL + '/user-join-invitations',
    }),

    // GET /api/company-admin/user-join-requests
    getUserJoinRequests: builder.query<UserJoinRequestDto[], void>({
      query: () => APP_URLS.BASE_COMPANY_ADMIN_URL + '/user-join-requests',
    }),
  }),
});

export const {
  useGetCompanyQuery,
  useLazyGetCompanyQuery,
  useGetActiveCompanyUsersQuery,
  useLazyGetActiveCompanyUsersQuery,
  useGetNotActiveCompanyRelatedUsersQuery,
  useLazyGetNotActiveCompanyRelatedUsersQuery,
  useGetUser2CompanyQuery,
  useLazyGetUser2CompanyQuery,
  useGetLatestUserSessionsQuery,
  useLazyGetLatestUserSessionsQuery,
  useGetPermissionRolesQuery,
  useLazyGetPermissionRolesQuery,
  useGetUserGroupsQuery,
  useLazyGetUserGroupsQuery,
  useGetUser2GroupsQuery,
  useLazyGetUser2GroupsQuery,
  useGetUserJoinInvitationsQuery,
  useLazyGetUserJoinInvitationsQuery,
  useGetUserJoinRequestsQuery,
  useLazyGetUserJoinRequestsQuery,
} = companyApi;

/** Alias for the RTK-generated `useGetCompanyQuery`. */
export const useGetCompany = useGetCompanyQuery;

/** Alias for the RTK-generated `useGetActiveCompanyUsersQuery`. */
export const useGetActiveCompanyUsers = useGetActiveCompanyUsersQuery;

/** Alias for the RTK-generated `useGetNotActiveCompanyRelatedUsersQuery`. */
export const useGetNotActiveCompanyRelatedUsers = useGetNotActiveCompanyRelatedUsersQuery;

/** Alias for the RTK-generated `useGetUser2CompanyQuery`. */
export const useGetUser2Company = useGetUser2CompanyQuery;

/** Alias for the RTK-generated `useGetLatestUserSessionsQuery`. */
export const useGetLatestUserSessions = useGetLatestUserSessionsQuery;

/** Alias for the RTK-generated `useGetPermissionRolesQuery`. */
export const useGetPermissionRoles = useGetPermissionRolesQuery;

/** Alias for the RTK-generated `useGetUserGroupsQuery`. */
export const useGetUserGroups = useGetUserGroupsQuery;

/** Alias for the RTK-generated `useGetUser2GroupsQuery`. */
export const useGetUser2Groups = useGetUser2GroupsQuery;

/** Alias for the RTK-generated `useGetUserJoinInvitationsQuery`. */
export const useGetUserJoinInvitations = useGetUserJoinInvitationsQuery;

/** Alias for the RTK-generated `useGetUserJoinRequestsQuery`. */
export const useGetUserJoinRequests = useGetUserJoinRequestsQuery;
