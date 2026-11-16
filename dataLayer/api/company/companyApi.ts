import { apiSlice } from '@/client-side.Commons/dataLayer/core/apiSlice';
import { APP_URLS } from '@/client-side.Impl/config/app-urls';
import type {
  CompanyDto,
  CompanyUserManagementContextDto,
  LatestUserSessionDto,
  PermissionRoleDto,
  User2CompanyDto,
  User2GroupDto,
  UserDto,
  UserGroupDto,
  UserJoinInvitationDto,
  UserJoinRequestDto,
} from '@/client-side.Commons/dataLayer/open-api';
import type { User2CompanyPatch, User2GroupPatch, UserGroupCreate, UserGroupPatch } from '@/client-side.Commons/dataLayer/model/company/companyPatchDto';
import { User2CompanyStatus } from '@/client-side.Commons/dataLayer/refs/User2CompanyStatus';

// Mirrors api-server's CompanyAdminController. Every endpoint is scoped to the caller's current
// company (the CompanyId claim) and answers 403 when the caller has none. All of them are reads
// except the patch* / createUserGroup / deleteUserGroup mutations.
export const companyApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // GET /api/company-admin/company - 404 when the company does not exist.
    getCompany: builder.query<CompanyDto, void>({
      query: () => APP_URLS.BASE_COMPANY_ADMIN_URL + '/company',
    }),

    // GET /api/company-admin/user-management-context - everything the user-management page needs in one
    // call: users, permission roles, user groups, join requests/invitations, user2group, user2company
    // and latest user activities.
    getUserManagementContext: builder.query<CompanyUserManagementContextDto, void>({
      query: () => APP_URLS.BASE_COMPANY_ADMIN_URL + '/user-management-context',
    }),

    // PATCH /api/company-admin/user2company/{userId} - changes a user's membership in the current company:
    // the status (Suspended / Active / Deleted) and/or the permission role. Answers 204.
    // On success the cached user-management context is patched in place (Deleted removes the row), so
    // the page isn't reloaded from the server on each change.
    patchUser2Company: builder.mutation<void, { userId: number; patch: User2CompanyPatch }>({
      query: ({ userId, patch }) => ({
        url: APP_URLS.BASE_COMPANY_ADMIN_URL + `/user2company/${userId}`,
        method: 'PATCH',
        body: patch,
      }),
      async onQueryStarted({ userId, patch }, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
        } catch {
          return; // nothing changed on the server, so leave the cache alone
        }
        dispatch(
          companyApi.util.updateQueryData('getUserManagementContext', undefined, (draft) => {
            const items = draft.User2Companies;
            if (!items) return;
            if (patch.StatusId === User2CompanyStatus.Deleted || patch.StatusId === User2CompanyStatus.DeletedBySiteAdmin) {
              draft.User2Companies = items.filter((x) => x.UserId !== userId);
              return;
            }
            const item = items.find((x) => x.UserId === userId);
            if (!item) return;
            if (patch.StatusId !== undefined) item.StatusId = patch.StatusId;
            if (patch.PermissionRoleId !== undefined) item.PermissionRoleId = patch.PermissionRoleId;
          }),
        );
      },
    }),

    // PATCH /api/company-admin/user2group/{userId} - adds the user to / removes the user from groups of the
    // current company. Answers 204. On success the cached context's User2Groups is updated in place.
    patchUser2Groups: builder.mutation<void, { userId: number; patch: User2GroupPatch }>({
      query: ({ userId, patch }) => ({
        url: APP_URLS.BASE_COMPANY_ADMIN_URL + `/user2group/${userId}`,
        method: 'PATCH',
        body: patch,
      }),
      async onQueryStarted({ userId, patch }, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
        } catch {
          return;
        }
        dispatch(
          companyApi.util.updateQueryData('getUserManagementContext', undefined, (draft) => {
            const companyId = draft.User2Companies?.find((x) => x.UserId === userId)?.CompanyId;
            const remove = new Set(patch.RemoveGroupIds ?? []);
            const rest = (draft.User2Groups ?? []).filter((x) => !(x.UserId === userId && remove.has(x.GroupId!)));
            for (const groupId of patch.AddGroupIds ?? []) {
              if (!rest.some((x) => x.UserId === userId && x.GroupId === groupId)) rest.push({ CompanyId: companyId, UserId: userId, GroupId: groupId });
            }
            draft.User2Groups = rest;
          }),
        );
      },
    }),

    // POST /api/company-admin/user-groups - creates a group, optionally with its first members. Answers 201 with the
    // group (400 when a member isn't in the company, 409 when the name is taken). On success the group and its
    // memberships are added to the cached user-management context.
    createUserGroup: builder.mutation<UserGroupDto, UserGroupCreate>({
      query: (body) => ({
        url: APP_URLS.BASE_COMPANY_ADMIN_URL + '/user-groups',
        method: 'POST',
        body,
      }),
      async onQueryStarted(body, { dispatch, queryFulfilled }) {
        let group: UserGroupDto;
        try {
          group = (await queryFulfilled).data;
        } catch {
          return;
        }
        dispatch(
          companyApi.util.updateQueryData('getUserManagementContext', undefined, (draft) => {
            draft.UserGroups = [...(draft.UserGroups ?? []), group];
            draft.User2Groups = [
              ...(draft.User2Groups ?? []),
              ...(body.AddUserIds ?? []).map((userId) => ({ CompanyId: group.CompanyId, UserId: userId, GroupId: group.Id })),
            ];
          }),
        );
      },
    }),

    // PATCH /api/company-admin/user-groups/{groupId} - changes the group's name / description / colour and/or adds
    // and removes members. Answers 204 (409 when the name is taken). On success the cached context is updated in place.
    patchUserGroup: builder.mutation<void, { groupId: number; patch: UserGroupPatch }>({
      query: ({ groupId, patch }) => ({
        url: APP_URLS.BASE_COMPANY_ADMIN_URL + `/user-groups/${groupId}`,
        method: 'PATCH',
        body: patch,
      }),
      async onQueryStarted({ groupId, patch }, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
        } catch {
          return;
        }
        dispatch(
          companyApi.util.updateQueryData('getUserManagementContext', undefined, (draft) => {
            const group = draft.UserGroups?.find((x) => x.Id === groupId);
            if (!group) return;
            if (patch.Name !== undefined) group.Name = patch.Name.trim();
            if (patch.Description !== undefined) group.Description = patch.Description?.trim() || undefined;
            if (patch.GroupColor !== undefined) group.GroupColor = patch.GroupColor;
            const remove = new Set(patch.RemoveUserIds ?? []);
            const rest = (draft.User2Groups ?? []).filter((x) => !(x.GroupId === groupId && remove.has(x.UserId!)));
            for (const userId of patch.AddUserIds ?? []) {
              if (!rest.some((x) => x.GroupId === groupId && x.UserId === userId)) rest.push({ CompanyId: group.CompanyId, UserId: userId, GroupId: groupId });
            }
            draft.User2Groups = rest;
          }),
        );
      },
    }),

    // DELETE /api/company-admin/user-groups/{groupId} - deletes the group with its memberships. Answers 204.
    // On success the group and its memberships are removed from the cached context.
    deleteUserGroup: builder.mutation<void, { groupId: number }>({
      query: ({ groupId }) => ({
        url: APP_URLS.BASE_COMPANY_ADMIN_URL + `/user-groups/${groupId}`,
        method: 'DELETE',
      }),
      async onQueryStarted({ groupId }, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
        } catch {
          return;
        }
        dispatch(
          companyApi.util.updateQueryData('getUserManagementContext', undefined, (draft) => {
            draft.UserGroups = (draft.UserGroups ?? []).filter((x) => x.Id !== groupId);
            draft.User2Groups = (draft.User2Groups ?? []).filter((x) => x.GroupId !== groupId);
          }),
        );
      },
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
  useGetUserManagementContextQuery,
  useLazyGetUserManagementContextQuery,
  usePatchUser2CompanyMutation,
  usePatchUser2GroupsMutation,
  useCreateUserGroupMutation,
  usePatchUserGroupMutation,
  useDeleteUserGroupMutation,
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

/** Alias for the RTK-generated `useGetUserManagementContextQuery`. */
export const useGetUserManagementContext = useGetUserManagementContextQuery;

/** Alias for the RTK-generated `usePatchUser2CompanyMutation`. */
export const usePatchUser2Company = usePatchUser2CompanyMutation;

/** Alias for the RTK-generated `usePatchUser2GroupsMutation`. */
export const usePatchUser2Groups = usePatchUser2GroupsMutation;

/** Alias for the RTK-generated `useCreateUserGroupMutation`. */
export const useCreateUserGroup = useCreateUserGroupMutation;

/** Alias for the RTK-generated `usePatchUserGroupMutation`. */
export const usePatchUserGroup = usePatchUserGroupMutation;

/** Alias for the RTK-generated `useDeleteUserGroupMutation`. */
export const useDeleteUserGroup = useDeleteUserGroupMutation;

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
