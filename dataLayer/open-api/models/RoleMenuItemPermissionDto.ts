/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type RoleMenuItemPermissionDto = {
    Id?: number;
    Title?: string;
    Icon?: string;
    Path?: string;
    CanView?: boolean;
    CanCreate?: boolean;
    CanEdit?: boolean;
    CanDelete?: boolean;
    Children?: Array<RoleMenuItemPermissionDto>;
};

