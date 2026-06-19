import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { API_BASE_URL } from '../../../lib/apiClient';
import type {
  AnalysesListResponse,
  AnalysisResponse,
  ApplyKeywordsPayload,
  ApplyKeywordsResponse,
  OptimizedResume,
  StoredAnalysis,
} from '../types/analysis.types';

export interface ExportResumePayload {
  resume: OptimizedResume;
  candidateName?: string;
  companyName?: string;
  jobTitle?: string;
}

export interface ExportCoverLetterPayload {
  coverLetter: string;
  candidateName?: string;
  companyName?: string;
  jobTitle?: string;
}

const blobResponseHandler = (response: Response) => response.blob();

export const analysisApi = createApi({
  reducerPath: 'analysisApi',
  baseQuery: fetchBaseQuery({ baseUrl: API_BASE_URL }),
  tagTypes: ['Analysis'],
  endpoints: (builder) => ({
    createAnalysis: builder.mutation<AnalysisResponse, FormData>({
      query: (formData) => ({
        url: '/analysis',
        method: 'POST',
        body: formData,
      }),
      // A new analysis is persisted server-side, so the history list is stale.
      invalidatesTags: [{ type: 'Analysis', id: 'LIST' }],
    }),
    getAnalyses: builder.query<AnalysesListResponse, void>({
      query: () => '/analysis',
      providesTags: (result) => [
        { type: 'Analysis', id: 'LIST' },
        ...(result?.analyses ?? []).map((item) => ({ type: 'Analysis' as const, id: item.id })),
      ],
    }),
    getAnalysisById: builder.query<StoredAnalysis, string>({
      query: (id) => `/analysis/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'Analysis', id }],
    }),
    deleteAnalysis: builder.mutation<void, string>({
      query: (id) => ({ url: `/analysis/${id}`, method: 'DELETE' }),
      invalidatesTags: (_result, _error, id) => [
        { type: 'Analysis', id },
        { type: 'Analysis', id: 'LIST' },
      ],
    }),
    applyKeywords: builder.mutation<ApplyKeywordsResponse, ApplyKeywordsPayload>({
      query: (payload) => ({
        url: '/analysis/keywords',
        method: 'POST',
        body: payload,
      }),
    }),
    exportResumePdf: builder.mutation<Blob, ExportResumePayload>({
      query: (payload) => ({
        url: '/export/resume/pdf',
        method: 'POST',
        body: payload,
        responseHandler: blobResponseHandler,
      }),
    }),
    exportResumeDocx: builder.mutation<Blob, ExportResumePayload>({
      query: (payload) => ({
        url: '/export/resume/docx',
        method: 'POST',
        body: payload,
        responseHandler: blobResponseHandler,
      }),
    }),
    exportCoverLetterPdf: builder.mutation<Blob, ExportCoverLetterPayload>({
      query: (payload) => ({
        url: '/export/cover-letter/pdf',
        method: 'POST',
        body: payload,
        responseHandler: blobResponseHandler,
      }),
    }),
    exportCoverLetterDocx: builder.mutation<Blob, ExportCoverLetterPayload>({
      query: (payload) => ({
        url: '/export/cover-letter/docx',
        method: 'POST',
        body: payload,
        responseHandler: blobResponseHandler,
      }),
    }),
  }),
});

export const {
  useCreateAnalysisMutation,
  useApplyKeywordsMutation,
  useGetAnalysesQuery,
  useGetAnalysisByIdQuery,
  useDeleteAnalysisMutation,
  useExportResumePdfMutation,
  useExportResumeDocxMutation,
  useExportCoverLetterPdfMutation,
  useExportCoverLetterDocxMutation,
} = analysisApi;
