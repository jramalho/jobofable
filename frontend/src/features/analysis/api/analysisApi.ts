import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { API_BASE_URL } from '../../../lib/apiClient';
import type {
  AnalysisResponse,
  ApplyKeywordsPayload,
  ApplyKeywordsResponse,
  OptimizedResume,
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
  endpoints: (builder) => ({
    createAnalysis: builder.mutation<AnalysisResponse, FormData>({
      query: (formData) => ({
        url: '/analysis',
        method: 'POST',
        body: formData,
      }),
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
  useExportResumePdfMutation,
  useExportResumeDocxMutation,
  useExportCoverLetterPdfMutation,
  useExportCoverLetterDocxMutation,
} = analysisApi;
