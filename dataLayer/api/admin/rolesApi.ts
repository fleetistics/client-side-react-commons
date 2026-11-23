import { apiSlice } from '@/client-side.Commons/dataLayer/core/apiSlice';
import type { AssignRoleUsersDto } from '@/client-side.Commons/dataLayer/open-api/models/AssignRoleUsersDto';
import type { CreateRoleDto } from '@/client-side.Commons/dataLayer/open-api/models/CreateRoleDto';
import type { RoleMenuPermissionsDto } from '@/client-side.Commons/dataLayer/open-api/models/RoleMenuPermissionsDto';
import type { RoleSummaryDto } from '@/client-side.Commons/dataLayer/open-api/models/RoleSummaryDto';
import type { RoleUserDto } from '@/client-side.Commons/dataLayer/open-api/models/RoleUserDto';
import type { SetRoleMenuPermissionsDto } from '@/client-side.Commons/dataLayer/open-api/models/SetRoleMenuPermissionsDto';
import type { UpdateRoleDto } from '@/client-side.Commons/dataLayer/open-api/models/UpdateRoleDto';
import { APP_CONFIG } from '@/client-side.Impl/config/app-config';

// api-server's RolesAdminController (/api/admin/roles), Portal Admin only; types generated from its OpenAPI.
// Errors are ProblemDetails { title, detail }: 404 unknown role, 400 bad input, 409 a rule says no (the Portal Admin role is read-only,
// system roles cannot be renamed or deleted, a role in use cannot be deleted, a name is taken, nobody changes their own role).
const base = APP_CONFIG.BASE_API_URL + 'admin/roles';

const LIST_TAG = { type: 'Role', id: 'LIST' } as const;
const USERS_TAG = { type: 'Role', id: 'USERS' } as const;
const roleTag = (roleId: number) => ({ type: 'Role', id: roleId }) as const;

export const rolesApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // The roles the company can use, with member counts and how much of the menu each may use.
    getRoles: builder.query<RoleSummaryDto[], void>({
      query: () => base,
      providesTags: [LIST_TAG],
    }),

    // The whole menu as a tree, each item with the role's View/Create/Edit/Delete flags.
    getRoleMenuPermissions: builder.query<RoleMenuPermissionsDto, number>({
      query: (roleId) => `${base}/${roleId}/menu-permissions`,
      providesTags: (_r, _e, roleId) => [roleTag(roleId)],
    }),

    // Replaces the role's flags (idempotent, so a retry after a 5xx is harmless). 204.
    setRoleMenuPermissions: builder.mutation<void, { roleId: number; body: SetRoleMenuPermissionsDto }>({
      query: ({ roleId, body }) => ({ url: `${base}/${roleId}/menu-permissions`, method: 'PUT', body }),
      invalidatesTags: (_r, _e, { roleId }) => [LIST_TAG, roleTag(roleId)],
    }),

    // A new role of the caller's company; with CopyFromRoleId it starts with that role's access rights (this is how a role is duplicated). 201.
    // apiSlice retries a network error or 5xx twice, whatever the method: if the first attempt had already created the role, the retry
    // answers 409 (name taken), and the role is there after the list refreshes.
    createRole: builder.mutation<RoleSummaryDto, CreateRoleDto>({
      query: (body) => ({ url: base, method: 'POST', body }),
      invalidatesTags: [LIST_TAG],
    }),

    // Renames a role of the company and/or changes its description (a field that is left out stays; an empty description clears it). 204.
    updateRole: builder.mutation<void, { roleId: number; body: UpdateRoleDto }>({
      query: ({ roleId, body }) => ({ url: `${base}/${roleId}`, method: 'PATCH', body }),
      invalidatesTags: (_r, _e, { roleId }) => [LIST_TAG, roleTag(roleId)],
    }),

    // Deletes a role of the company that nobody has, with its access rights. 204.
    deleteRole: builder.mutation<void, number>({
      query: (roleId) => ({ url: `${base}/${roleId}`, method: 'DELETE' }),
      invalidatesTags: (_r, _e, roleId) => [LIST_TAG, roleTag(roleId), USERS_TAG],
    }),

    // The company's users with the role each has.
    getRoleUsers: builder.query<RoleUserDto[], void>({
      query: () => `${base}/users`,
      providesTags: [USERS_TAG],
    }),

    // Gives the role to these users, replacing the role each had (idempotent). 204.
    assignRoleUsers: builder.mutation<void, { roleId: number; body: AssignRoleUsersDto }>({
      query: ({ roleId, body }) => ({ url: `${base}/${roleId}/members`, method: 'POST', body }),
      invalidatesTags: [LIST_TAG, USERS_TAG],
    }),
  }),
});

export const {
  useGetRolesQuery, useGetRoleMenuPermissionsQuery, useSetRoleMenuPermissionsMutation,
  useCreateRoleMutation, useUpdateRoleMutation, useDeleteRoleMutation, useGetRoleUsersQuery, useAssignRoleUsersMutation,
} = rolesApi;
