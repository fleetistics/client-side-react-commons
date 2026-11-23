import { apiSlice } from '@/client-side.Commons/dataLayer/core/apiSlice';
import type { MenuItemDto } from '@/client-side.Commons/dataLayer/open-api/models/MenuItemDto';
import { APP_CONFIG } from '@/client-side.Impl/config/app-config';

const BASE_MENU_URL = APP_CONFIG.BASE_API_URL + 'menu';

export const menuApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // The menu the signed-in user's role may see in their company, as a tree (api-server MenuController; type generated from its OpenAPI).
    getMyMenu: builder.query<MenuItemDto[], void>({
      query: () => BASE_MENU_URL,
      // Belongs to one user: never keep it around for the next one to find after a logout.
      keepUnusedDataFor: 0,
    }),
  }),
});

export const { useGetMyMenuQuery } = menuApi;
