/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { MenuItemDto } from '../models/MenuItemDto';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class MenuService {
    /**
     * @returns MenuItemDto OK
     * @throws ApiError
     */
    public static getApiMenu(): CancelablePromise<Array<MenuItemDto>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/menu',
        });
    }
}
