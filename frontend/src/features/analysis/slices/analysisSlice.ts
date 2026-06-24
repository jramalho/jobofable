import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type {
  AIProviderName,
  AnalysisResponse,
  CoverLetterMeta,
  CoverLetterTone,
  OptimizedResume,
  ResumeHeader,
} from '../types/analysis.types';

export type AnalysisState = {
  jobDescription: string;
  selectedResumeFileName: string | null;
  selectedLinkedInFileName: string | null;
  coverLetterTone: CoverLetterTone;
  selectedAIProvider: AIProviderName;
  currentAnalysisId: string | null;
  analysisResult: AnalysisResponse | null;
  editableResume: OptimizedResume | null;
  editableCoverLetter: string;
  coverLetterMeta: CoverLetterMeta | null;
  editorDirtyState: boolean;
};

const initialState: AnalysisState = {
  jobDescription: '',
  selectedResumeFileName: null,
  selectedLinkedInFileName: null,
  coverLetterTone: 'professional',
  selectedAIProvider: 'groq',
  currentAnalysisId: null,
  analysisResult: null,
  editableResume: null,
  editableCoverLetter: '',
  coverLetterMeta: null,
  editorDirtyState: false,
};

export type ResumeListSection = 'skills' | 'experience' | 'projects' | 'education' | 'certifications' | 'languages';

const analysisSlice = createSlice({
  name: 'analysis',
  initialState,
  reducers: {
    setJobDescription(state, action: PayloadAction<string>) {
      state.jobDescription = action.payload;
    },
    setSelectedResumeFileName(state, action: PayloadAction<string | null>) {
      state.selectedResumeFileName = action.payload;
    },
    setSelectedLinkedInFileName(state, action: PayloadAction<string | null>) {
      state.selectedLinkedInFileName = action.payload;
    },
    setCoverLetterTone(state, action: PayloadAction<CoverLetterTone>) {
      state.coverLetterTone = action.payload;
    },
    setSelectedAIProvider(state, action: PayloadAction<AIProviderName>) {
      state.selectedAIProvider = action.payload;
    },
    /** Stores a fresh analysis response and seeds the editable copies. */
    setCurrentAnalysis(state, action: PayloadAction<AnalysisResponse>) {
      // Track the route-facing id (the persisted DB id when available) so the
      // result page can tell whether Redux already holds the requested analysis.
      state.currentAnalysisId = action.payload.persistedAnalysisId ?? action.payload.analysisId;
      state.analysisResult = action.payload;
      state.editableResume = action.payload.optimizedResume;
      state.editableCoverLetter = action.payload.coverLetter;
      state.coverLetterMeta = action.payload.coverLetterMeta;
      state.editorDirtyState = false;
    },
    setEditableResume(state, action: PayloadAction<OptimizedResume | null>) {
      state.editableResume = action.payload;
      state.editorDirtyState = true;
    },
    updateResumeHeader(state, action: PayloadAction<Partial<ResumeHeader>>) {
      if (!state.editableResume) return;
      state.editableResume.header = { ...state.editableResume.header, ...action.payload };
      state.editorDirtyState = true;
    },
    updateResumeSummary(state, action: PayloadAction<string>) {
      if (!state.editableResume) return;
      state.editableResume.summary = action.payload;
      state.editorDirtyState = true;
    },
    /** Replaces an entire section of the editable resume. */
    updateResumeSection(
      state,
      action: PayloadAction<{ section: ResumeListSection; value: OptimizedResume[ResumeListSection] }>,
    ) {
      if (!state.editableResume) return;
      // The payload type ties value to the section key, so this cast is safe.
      (state.editableResume[action.payload.section] as unknown) = action.payload.value;
      state.editorDirtyState = true;
    },
    updateExperienceBullet(
      state,
      action: PayloadAction<{ experienceIndex: number; bulletIndex: number; value: string }>,
    ) {
      const experience = state.editableResume?.experience[action.payload.experienceIndex];
      if (!experience) return;
      experience.bullets[action.payload.bulletIndex] = action.payload.value;
      state.editorDirtyState = true;
    },
    setEditableCoverLetter(state, action: PayloadAction<string>) {
      state.editableCoverLetter = action.payload;
      state.editorDirtyState = true;
    },
    setCoverLetterMeta(state, action: PayloadAction<CoverLetterMeta | null>) {
      state.coverLetterMeta = action.payload;
    },
    markEditorDirty(state) {
      state.editorDirtyState = true;
    },
    markEditorClean(state) {
      state.editorDirtyState = false;
    },
    resetAnalysisState() {
      return initialState;
    },
  },
});

export const {
  setJobDescription,
  setSelectedResumeFileName,
  setSelectedLinkedInFileName,
  setCoverLetterTone,
  setSelectedAIProvider,
  setCurrentAnalysis,
  setEditableResume,
  updateResumeHeader,
  updateResumeSummary,
  updateResumeSection,
  updateExperienceBullet,
  setEditableCoverLetter,
  setCoverLetterMeta,
  markEditorDirty,
  markEditorClean,
  resetAnalysisState,
} = analysisSlice.actions;

export const analysisReducer = analysisSlice.reducer;
