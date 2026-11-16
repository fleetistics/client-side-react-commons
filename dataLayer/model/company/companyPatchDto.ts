// Request bodies of CompanyAdminController's PATCH endpoints. Only the fields present are applied
// (see User2CompanyPatchDto.cs, User2GroupPatchDto.cs). Written by hand until
// open-api is regenerated from a server that has these endpoints.

/** PATCH company-admin/user2company/{userId}. StatusId may only be Active, Suspended or Deleted. */
export type User2CompanyPatch = {
  StatusId?: number;
  PermissionRoleId?: number;
};

/** PATCH company-admin/user2group/{userId}: changes, not the full list, so concurrent admins don't overwrite each other. */
export type User2GroupPatch = {
  AddGroupIds?: number[];
  RemoveGroupIds?: number[];
};

/** POST company-admin/user-groups: a new group, optionally with its first members (who must be members of the company). */
export type UserGroupCreate = {
  Name: string;
  Description?: string | null;
  GroupColor: number;
  AddUserIds?: number[];
};

/** PATCH company-admin/user-groups/{groupId}: only the fields present change; members are sent as changes, not the full list. */
export type UserGroupPatch = {
  Name?: string;
  Description?: string | null;
  GroupColor?: number;
  AddUserIds?: number[];
  RemoveUserIds?: number[];
};
