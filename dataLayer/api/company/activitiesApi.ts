import { apiSlice } from '@/client-side.Commons/dataLayer/core/apiSlice';
import type { ActivityDto } from '@/client-side.Commons/dataLayer/open-api/models/ActivityDto';
import type { ActivityLookupsDto } from '@/client-side.Commons/dataLayer/open-api/models/ActivityLookupsDto';
import type { ActivityRowDto } from '@/client-side.Commons/dataLayer/open-api/models/ActivityRowDto';
import type { SaveActivityDto } from '@/client-side.Commons/dataLayer/open-api/models/SaveActivityDto';
import { APP_CONFIG } from '@/client-side.Impl/config/app-config';

// api-server's ActivitiesController (/api/contacts/activities): calls, meetings, emails and visits with the caller's companies and people.
// Types are generated from the OpenAPI. Not restricted by role yet.
// Errors are ProblemDetails { title, detail }: 400 bad input (or an action the status does not allow), 404 not found (or private to another user).
// Dates are Unix seconds (StartAt, CompletedAt).
const activities = APP_CONFIG.BASE_API_URL + 'contacts/activities';

/** Which occurrences an edit or a cancel reaches: 1 only this one, 2 this one and the later scheduled ones of its series. */
export const ACTIVITY_SCOPE = { This: 1, ThisAndFollowing: 2 } as const;

/** The list's filters. From is included and To excluded (Unix seconds). */
export type ActivityFilter = {
  companyId?: number;
  contactUserId?: number;
  personUserId?: number;
  from?: number;
  to?: number;
  typeId?: number;
  priorityId?: number;
  statusId?: number;
  creatorUserId?: number;
  limit?: number;
};

const LOOKUPS_TAG = { type: 'Activities', id: 'LOOKUPS' } as const;
// Every activity belongs to a series, a company and a person, and a change to one (a recurring one especially) changes others,
// so every mutation refetches every list and detail.
const ALL_TAG = { type: 'Activities', id: 'ALL' } as const;

export const activitiesApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // Types, priorities, statuses, repeat units, and the members of the caller's company (people to assign to).
    getActivityLookups: builder.query<ActivityLookupsDto, void>({
      query: () => `${activities}/lookups`,
      providesTags: [LOOKUPS_TAG],
    }),

    // Newest first.
    getActivities: builder.query<ActivityRowDto[], ActivityFilter | void>({
      query: (filter) => ({ url: activities, params: filter ?? {} }),
      providesTags: [ALL_TAG],
    }),

    getActivity: builder.query<ActivityDto, number>({
      query: (id) => `${activities}/${id}`,
      providesTags: [ALL_TAG],
    }),

    // 201 with the activity (the first one of a series). Log: true saves it as completed.
    createActivity: builder.mutation<ActivityDto, SaveActivityDto>({
      query: (body) => ({ url: activities, method: 'POST', body }),
      invalidatesTags: [ALL_TAG],
    }),

    // Replaces the details (the whole form is sent). scope 2 also changes the later scheduled ones of its series.
    updateActivity: builder.mutation<ActivityDto, { id: number; body: SaveActivityDto; scope?: number }>({
      query: ({ id, body, scope }) => ({ url: `${activities}/${id}`, method: 'PUT', body, params: { scope: scope ?? ACTIVITY_SCOPE.This } }),
      invalidatesTags: [ALL_TAG],
    }),

    completeActivity: builder.mutation<ActivityDto, number>({
      query: (id) => ({ url: `${activities}/${id}/complete`, method: 'POST' }),
      invalidatesTags: [ALL_TAG],
    }),

    // The activity stays in the history as Cancelled.
    cancelActivity: builder.mutation<ActivityDto, { id: number; scope?: number }>({
      query: ({ id, scope }) => ({ url: `${activities}/${id}/cancel`, method: 'POST', params: { scope: scope ?? ACTIVITY_SCOPE.This } }),
      invalidatesTags: [ALL_TAG],
    }),
  }),
});

export const {
  useGetActivityLookupsQuery,
  useGetActivitiesQuery,
  useGetActivityQuery,
  useCreateActivityMutation,
  useUpdateActivityMutation,
  useCompleteActivityMutation,
  useCancelActivityMutation,
} = activitiesApi;
