import { apiSlice } from '@/client-side.Commons/dataLayer/core/apiSlice';
import type { MissionCreatePatchDto } from '@/client-side.Commons/dataLayer/open-api/models/MissionCreatePatchDto';
import type { MissionCreateResult } from '@/client-side.Commons/dataLayer/open-api/models/MissionCreateResult';
import type { MissionPrimaryTargetUserAssignDto } from '@/client-side.Commons/dataLayer/open-api/models/MissionPrimaryTargetUserAssignDto';
import type { MissionPrimaryTargetUserDto } from '@/client-side.Commons/dataLayer/open-api/models/MissionPrimaryTargetUserDto';
import { APP_CONFIG } from '@/client-side.Impl/config/app-config';

// Mirrors api-server's MissionController (/api/mission). Types are generated from the OpenAPI.
// The mission being set up ("creating") is cached under getCreatingMission; the mutations keep that cache in sync.
const mission = APP_CONFIG.BASE_API_URL + 'mission';

export const missionApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // GET /api/mission/creating - the mission the current user is still setting up. 204 (null here) when there is none.
    getCreatingMission: builder.query<MissionCreateResult | null, void>({
      query: () => `${mission}/creating`,
      transformResponse: (response: MissionCreateResult | null | undefined) => response ?? null,
    }),

    // POST /api/mission - creates a mission; Mission.Name is required (400 otherwise). Answers 201 with the new mission id.
    // On success the creating mission is reloaded.
    createMission: builder.mutation<number, MissionCreatePatchDto>({
      query: (body) => ({ url: mission, method: 'POST', body }),
      async onQueryStarted(_body, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
        } catch {
          return;
        }
        void dispatch(missionApi.endpoints.getCreatingMission.initiate(undefined, { forceRefetch: true }));
      },
    }),

    // PATCH /api/mission/{missionId} - changes the creating mission (omitted fields stay unchanged). Answers 200 with the
    // updated creating mission, which replaces the cached one.
    patchCreatingMission: builder.mutation<MissionCreateResult, { missionId: number; patch: MissionCreatePatchDto }>({
      query: ({ missionId, patch }) => ({ url: `${mission}/${missionId}`, method: 'PATCH', body: patch }),
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        let result: MissionCreateResult;
        try {
          result = (await queryFulfilled).data;
        } catch {
          return;
        }
        dispatch(missionApi.util.upsertQueryData('getCreatingMission', undefined, result));
      },
    }),

    // PUT /api/mission/{missionId}/primary-target-user - assigns the primary target user (an existing one is replaced).
    // Answers 200 with the assignment, which is put into the cached creating mission.
    assignPrimaryTargetUser: builder.mutation<MissionPrimaryTargetUserDto, { missionId: number; body: MissionPrimaryTargetUserAssignDto }>({
      query: ({ missionId, body }) => ({ url: `${mission}/${missionId}/primary-target-user`, method: 'PUT', body }),
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        let target: MissionPrimaryTargetUserDto;
        try {
          target = (await queryFulfilled).data;
        } catch {
          return;
        }
        dispatch(
          missionApi.util.updateQueryData('getCreatingMission', undefined, (draft) => {
            if (draft) draft.PrimaryTargetUser = target;
          }),
        );
      },
    }),

    // POST /api/mission/{missionId}/start - starts the mission. Answers 204. The mission is no longer "creating",
    // so the cached creating mission is cleared.
    startMission: builder.mutation<void, number>({
      query: (missionId) => ({ url: `${mission}/${missionId}/start`, method: 'POST' }),
      async onQueryStarted(_id, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
        } catch {
          return;
        }
        dispatch(missionApi.util.upsertQueryData('getCreatingMission', undefined, null));
      },
    }),
  }),
});

export const {
  useGetCreatingMissionQuery,
  useLazyGetCreatingMissionQuery,
  useCreateMissionMutation,
  usePatchCreatingMissionMutation,
  useAssignPrimaryTargetUserMutation,
  useStartMissionMutation,
} = missionApi;
