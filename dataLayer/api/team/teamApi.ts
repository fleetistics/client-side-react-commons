import { apiSlice } from '@/client-side.Commons/dataLayer/core/apiSlice';
import { APP_URLS } from '@/client-side.Impl/config/app-urls';
import type { TeamCreateDto, TeamCreatePatchDto } from '@/client-side.Commons/dataLayer/open-api';

// Mirrors api-server's TeamController. A team is set up in three steps: create (Creating status),
// patch while the user fills in the rest, start (Active). create/patch return the whole
// creating-team view, and every call below keeps getCreatingTeam's cache in step with it, so the
// create-team screen needs no extra refetch.
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

    // POST /api/team - creates the team, applies the creator's user patch and registers them as its
    // first member, all from this single body. TeamName is required. The server answers with the new
    // team's id, which is what `createTeam(...).unwrap()` resolves to. getCreatingTeam's cache is
    // refreshed before resolving, so callers can rely on it right after the await. Invalidates every
    // cached User - the same call may have changed the caller's name/phone.
    createTeam: builder.mutation<number, TeamCreatePatchDto>({
      queryFn: async (body, { dispatch }, _extraOptions, baseQuery) => {
        const created = await baseQuery({ url: APP_URLS.BASE_TEAM_URL, method: 'POST', body });
        if (created.error) return { error: created.error };
        const teamId = created.data as number;

        const creating = await baseQuery(APP_URLS.BASE_TEAM_URL + '/creating');
        if (!creating.error) {
          dispatch(teamApi.util.upsertQueryData('getCreatingTeam', undefined, (creating.data as TeamCreateDto | null | undefined) ?? null));
        }
        return { data: teamId };
      },
      invalidatesTags: ['User'],
    }),

    // PATCH /api/team/{teamId} - only the fields present in the body change.
    patchCreatingTeam: builder.mutation<TeamCreateDto, { teamId: number; patch: TeamCreatePatchDto }>({
      query: ({ teamId, patch }) => ({
        url: APP_URLS.BASE_TEAM_URL + `/${teamId}`,
        method: 'PATCH',
        body: patch,
      }),
      invalidatesTags: ['User'],
      onQueryStarted: async (_arg, { dispatch, queryFulfilled }) => {
        try {
          const { data } = await queryFulfilled;
          dispatch(teamApi.util.upsertQueryData('getCreatingTeam', undefined, data));
        } catch {
          // The request failed - nothing to seed.
        }
      },
    }),

    // POST /api/team/{teamId}/start - activates the team (204). Only its creator can start it.
    // The team is no longer in Creating status afterwards, and the user's active team changed.
    startTeam: builder.mutation<void, number>({
      query: (teamId) => ({
        url: APP_URLS.BASE_TEAM_URL + `/${teamId}/start`,
        method: 'POST',
      }),
      invalidatesTags: ['User'],
      onQueryStarted: async (_teamId, { dispatch, queryFulfilled }) => {
        try {
          await queryFulfilled;
          dispatch(teamApi.util.upsertQueryData('getCreatingTeam', undefined, null));
        } catch {
          // The request failed - the team is still being created.
        }
      },
    }),
  }),
});

export const {
  useGetActiveTeamIdQuery,
  useLoadActiveTeamIdMutation,
  useGetCreatingTeamQuery,
  useLazyGetCreatingTeamQuery,
  useCreateTeamMutation,
  usePatchCreatingTeamMutation,
  useStartTeamMutation,
} = teamApi;

/** Alias for the RTK-generated `useGetActiveTeamIdQuery`. */
export const useGetActiveTeamId = useGetActiveTeamIdQuery;

/** Alias for the RTK-generated `useLoadActiveTeamIdMutation` - call its trigger once (e.g. on mount) to load the value a single time. */
export const useLoadActiveTeamId = useLoadActiveTeamIdMutation;

/** Alias for the RTK-generated `useGetCreatingTeamQuery`. */
export const useGetCreatingTeam = useGetCreatingTeamQuery;

/** Alias for the RTK-generated `useCreateTeamMutation`. */
export const useCreateTeam = useCreateTeamMutation;

/** Alias for the RTK-generated `usePatchCreatingTeamMutation`. */
export const usePatchCreatingTeam = usePatchCreatingTeamMutation;

/** Alias for the RTK-generated `useStartTeamMutation`. */
export const useStartTeam = useStartTeamMutation;
