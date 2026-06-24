import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { API_BASE_URL } from '../../../lib/apiClient';
import { analysisApi } from '../../analysis/api/analysisApi';
import type {
  ApplicationDetail,
  ApplicationInput,
  ApplicationListItem,
  Company,
  ContactInput,
  DuplicateCheckArgs,
  DuplicateCheckResult,
  EventInput,
  FollowUpInput,
  FollowUpTask,
  JobSearchArgs,
  JobSearchResponse,
} from '../types/tracker.types';

/** Mutations on an application's sub-resources carry its id so the detail re-fetches. */
interface ScopedBody<T> {
  applicationId: string;
  body: T;
}
interface ScopedId {
  id: string;
  applicationId: string;
}

export const trackerApi = createApi({
  reducerPath: 'trackerApi',
  baseQuery: fetchBaseQuery({ baseUrl: API_BASE_URL }),
  tagTypes: ['Application', 'Company', 'FollowUp'],
  endpoints: (builder) => ({
    getApplications: builder.query<ApplicationListItem[], void>({
      query: () => '/applications',
      transformResponse: (response: { applications: ApplicationListItem[] }) => response.applications,
      providesTags: (result) => [
        { type: 'Application', id: 'LIST' },
        ...(result ?? []).map((app) => ({ type: 'Application' as const, id: app.id })),
      ],
    }),
    getApplication: builder.query<ApplicationDetail, string>({
      query: (id) => `/applications/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'Application', id }],
    }),
    createApplication: builder.mutation<ApplicationDetail, ApplicationInput>({
      query: (body) => ({ url: '/applications', method: 'POST', body }),
      invalidatesTags: [{ type: 'Application', id: 'LIST' }],
    }),
    updateApplication: builder.mutation<ApplicationDetail, { id: string; body: ApplicationInput }>({
      query: ({ id, body }) => ({ url: `/applications/${id}`, method: 'PATCH', body }),
      // Optimistically reflect a status change in the list cache so Kanban
      // drag-and-drop moves the card instantly; the invalidation below then
      // refetches the authoritative row (dates, follow-ups). Rolled back on error.
      async onQueryStarted({ id, body }, { dispatch, queryFulfilled }) {
        if (!body.status) return;
        const patch = dispatch(
          trackerApi.util.updateQueryData('getApplications', undefined, (draft) => {
            const app = draft.find((item) => item.id === id);
            if (app && body.status) app.status = body.status;
          }),
        );
        try {
          await queryFulfilled;
        } catch {
          patch.undo();
        }
      },
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'Application', id },
        { type: 'Application', id: 'LIST' },
        { type: 'FollowUp', id: 'LIST' },
      ],
    }),
    deleteApplication: builder.mutation<void, string>({
      query: (id) => ({ url: `/applications/${id}`, method: 'DELETE' }),
      invalidatesTags: (_result, _error, id) => [
        { type: 'Application', id },
        { type: 'Application', id: 'LIST' },
      ],
    }),
    // Promote a stored analysis into a tracked application (idempotent).
    createApplicationFromAnalysis: builder.mutation<ApplicationDetail, string>({
      query: (analysisId) => ({ url: `/analysis/${analysisId}/application`, method: 'POST' }),
      invalidatesTags: [{ type: 'Application', id: 'LIST' }],
      async onQueryStarted(analysisId, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
          // The analysis now has a linked application — refresh its cache (other slice).
          dispatch(
            analysisApi.util.invalidateTags([
              { type: 'Analysis', id: 'LIST' },
              { type: 'Analysis', id: analysisId },
            ]),
          );
        } catch {
          // Surfaced via the mutation's error state at the call site.
        }
      },
    }),

    getCompanies: builder.query<Company[], void>({
      query: () => '/companies',
      transformResponse: (response: { companies: Company[] }) => response.companies,
      providesTags: [{ type: 'Company', id: 'LIST' }],
    }),

    // Deterministic duplicate detection — advisory only, no tags.
    checkDuplicates: builder.query<DuplicateCheckResult, DuplicateCheckArgs>({
      query: (body) => ({ url: '/applications/check-duplicates', method: 'POST', body }),
    }),

    // Aggregated job search across public boards, minus what's already tracked.
    searchJobs: builder.mutation<JobSearchResponse, JobSearchArgs>({
      query: (body) => ({ url: '/jobs/search', method: 'POST', body }),
    }),

    // Events
    createEvent: builder.mutation<unknown, ScopedBody<EventInput>>({
      query: ({ applicationId, body }) => ({
        url: `/applications/${applicationId}/events`,
        method: 'POST',
        body,
      }),
      invalidatesTags: (_r, _e, { applicationId }) => [{ type: 'Application', id: applicationId }],
    }),

    // Contacts
    createContact: builder.mutation<unknown, ScopedBody<ContactInput>>({
      query: ({ applicationId, body }) => ({
        url: `/applications/${applicationId}/contacts`,
        method: 'POST',
        body,
      }),
      invalidatesTags: (_r, _e, { applicationId }) => [{ type: 'Application', id: applicationId }],
    }),
    updateContact: builder.mutation<unknown, ScopedId & { body: Partial<ContactInput> }>({
      query: ({ id, body }) => ({ url: `/contacts/${id}`, method: 'PATCH', body }),
      invalidatesTags: (_r, _e, { applicationId }) => [{ type: 'Application', id: applicationId }],
    }),
    deleteContact: builder.mutation<void, ScopedId>({
      query: ({ id }) => ({ url: `/contacts/${id}`, method: 'DELETE' }),
      invalidatesTags: (_r, _e, { applicationId }) => [{ type: 'Application', id: applicationId }],
    }),

    // Follow-ups
    getFollowUps: builder.query<{ followUps: FollowUpTask[] }, void>({
      query: () => '/follow-ups',
      providesTags: [{ type: 'FollowUp', id: 'LIST' }],
    }),
    createFollowUp: builder.mutation<unknown, ScopedBody<FollowUpInput>>({
      query: ({ applicationId, body }) => ({
        url: `/applications/${applicationId}/follow-ups`,
        method: 'POST',
        body,
      }),
      invalidatesTags: (_r, _e, { applicationId }) => [
        { type: 'Application', id: applicationId },
        { type: 'FollowUp', id: 'LIST' },
      ],
    }),
    updateFollowUp: builder.mutation<unknown, ScopedId & { body: Partial<FollowUpInput> & { completedAt?: string } }>({
      query: ({ id, body }) => ({ url: `/follow-ups/${id}`, method: 'PATCH', body }),
      invalidatesTags: (_r, _e, { applicationId }) => [
        { type: 'Application', id: applicationId },
        { type: 'FollowUp', id: 'LIST' },
      ],
    }),
    deleteFollowUp: builder.mutation<void, ScopedId>({
      query: ({ id }) => ({ url: `/follow-ups/${id}`, method: 'DELETE' }),
      invalidatesTags: (_r, _e, { applicationId }) => [
        { type: 'Application', id: applicationId },
        { type: 'FollowUp', id: 'LIST' },
      ],
    }),
  }),
});

export const {
  useGetApplicationsQuery,
  useGetApplicationQuery,
  useCreateApplicationMutation,
  useUpdateApplicationMutation,
  useDeleteApplicationMutation,
  useCreateApplicationFromAnalysisMutation,
  useGetCompaniesQuery,
  useCheckDuplicatesQuery,
  useSearchJobsMutation,
  useCreateEventMutation,
  useCreateContactMutation,
  useUpdateContactMutation,
  useDeleteContactMutation,
  useGetFollowUpsQuery,
  useCreateFollowUpMutation,
  useUpdateFollowUpMutation,
  useDeleteFollowUpMutation,
} = trackerApi;
