/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type MenuItemDto = {
    Id?: number;
    Title?: string;
    Description?: string;
    Icon?: string;
    Path?: string;
    DividerBefore?: boolean;
    DividerAfter?: boolean;
    CanEdit?: boolean;
    CanCreate?: boolean;
    CanDelete?: boolean;
    Children?: Array<MenuItemDto>;
};

