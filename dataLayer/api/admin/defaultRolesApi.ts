import { apiSlice } from '@/client-side.Commons/dataLayer/core/apiSlice';
import type { RoleMenuPermissionsDto } from '@/client-side.Commons/dataLayer/open-api/models/RoleMenuPermissionsDto';
import type { RoleSummaryDto } from '@/client-side.Commons/dataLayer/open-api/models/RoleSummaryDto';
import type { SetRoleMenuPermissionsDto } from '@/client-side.Commons/dataLayer/open-api/models/SetRoleMenuPermissionsDto';
import { APP_CONFIG } from '@/client-side.Impl/config/app-config';

// api-server's RolesAdminController (/api/admin/roles): the DEFAULT access rights of the system roles (Portal Admin > Roles). A company
// that has not overridden a role uses these. Nothing else is edited here; a company's own roles, overrides and users are rolesApi.ts.
// Not restricted by role yet: the server only needs a signed-in user. Types are generated from the OpenAPI.
const base = APP_CONFIG.BASE_API_URL + 'admin/roles';

// Tag ids are strings so they never collide with the company screen's tags (rolesApi.ts uses numbers and 'LIST').
const LIST_TAG = { type: 'Role', id: 'DEFAULTS' } as const;
const roleTag = (roleId: number) => ({ type: 'Role', id: `defaults-${roleId}` }) as const;

export const defaultRolesApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // The system roles, each with how much of the menu it may use by default.
    getDefaultRoles: builder.query<RoleSummaryDto[], void>({
      query: () => base,
      providesTags: [LIST_TAG],
    }),

    // The whole menu as a tree, each item with the role's default View/Create/Edit/Delete flags.
    getDefaultRoleMenuPermissions: builder.query<RoleMenuPermissionsDto, number>({
      query: (roleId) => `${base}/${roleId}/menu-permissions`,
      providesTags: (_r, _e, roleId) => [roleTag(roleId)],
    }),

    // Replaces the role's default flags (idempotent, so a retry after a 5xx is harmless). It applies to every company without an override. 204.
    setDefaultRoleMenuPermissions: builder.mutation<void, { roleId: number; body: SetRoleMenuPermissionsDto }>({
      query: ({ roleId, body }) => ({ url: `${base}/${roleId}/menu-permissions`, method: 'PUT', body }),
      invalidatesTags: (_r, _e, { roleId }) => [LIST_TAG, roleTag(roleId)],
    }),
  }),
});

export const { useGetDefaultRolesQuery, useGetDefaultRoleMenuPermissionsQuery, useSetDefaultRoleMenuPermissionsMutation } = defaultRolesApi;
