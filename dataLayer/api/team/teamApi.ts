import { apiSlice } from '@/client-side.Commons/dataLayer/core/apiSlice';
import { APP_URLS } from '@/client-side.Impl/config/app-urls';
import type { TeamCreateDto } from '@/client-side.Commons/dataLayer/open-api';

// Mirrors api-server's TeamController, which now only answers GET /api/team/active and GET /api/team/creating.
// Creating, patching and starting a team moved to the mission endpoints (missionApi.ts), so the old create/patch/start
// mutations of this file are gone.
export const teamApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // GET /api/team/active - 204 (no body) when the user has no active team, normalized to undefined.
    getActiveTeamId: builder.query<number | undefined, void>({
      queryFn: async (_arg, _api, _extraOptions, baseQuery) => {
        const result = await baseQuery(APP_URLS.BASE_TEAM_URL + '/active');
        if (result.error) return { error: result.error };
        return { data: typeof result.data === 'number' ? result.data : undefined };
      },
    }),

    // Mutation-shaped counterpart of getActiveTeamId: mutations never carry providesTags, so nothing
    // can make it re-run on its own. Call its trigger once (e.g. from a mount effect) to load the
    // value a single time; onQueryStarted seeds getActiveTeamId's cache entry with the same result,
    // so useGetActiveTeamIdQuery reads it too without a second request.
    loadActiveTeamId: builder.mutation<number | undefined, void>({
      queryFn: async (_arg, _api, _extraOptions, baseQuery) => {
        const result = await baseQuery(APP_URLS.BASE_TEAM_URL + '/active');
        if (result.error) return { error: result.error };
        return { data: typeof result.data === 'number' ? result.data : undefined };
      },
      onQueryStarted: async (_arg, { dispatch, queryFulfilled }) => {
        try {
          const { data } = await queryFulfilled;
          dispatch(teamApi.util.upsertQueryData('getActiveTeamId', undefined, data));
        } catch {
          // The request failed - nothing to seed.
        }
      },
    }),

    // GET /api/team/creating - the team this user is still setting up; 204 (no body) -> null.
    getCreatingTeam: builder.query<TeamCreateDto | null, void>({
      queryFn: async (_arg, _api, _extraOptions, baseQuery) => {
        const result = await baseQuery(APP_URLS.BASE_TEAM_URL + '/creating');
        if (result.error) return { error: result.error };
        return { data: (result.data as TeamCreateDto | null | undefined) ?? null };
      },
    }),
  }),
});

export const {
  useGetActiveTeamIdQuery,
  useLoadActiveTeamIdMutation,
  useGetCreatingTeamQuery,
  useLazyGetCreatingTeamQuery,
} = teamApi;

/** Alias for the RTK-generated `useGetActiveTeamIdQuery`. */
export const useGetActiveTeamId = useGetActiveTeamIdQuery;

/** Alias for the RTK-generated `useLoadActiveTeamIdMutation` - call its trigger once (e.g. on mount) to load the value a single time. */
export const useLoadActiveTeamId = useLoadActiveTeamIdMutation;

/** Alias for the RTK-generated `useGetCreatingTeamQuery`. */
export const useGetCreatingTeam = useGetCreatingTeamQuery;
