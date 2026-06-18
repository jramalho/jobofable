import { useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../../app/hooks';
import { buildExportFilename, downloadBlob, extractErrorMessage } from '../../../lib/apiClient';
import {
  useApplyKeywordsMutation,
  useExportCoverLetterDocxMutation,
  useExportCoverLetterPdfMutation,
  useExportResumeDocxMutation,
  useExportResumePdfMutation,
} from '../api/analysisApi';
import {
  setEditableResume,
  setEditableCoverLetter,
  updateExperienceBullet,
  updateResumeHeader,
  updateResumeSection,
  updateResumeSummary,
} from '../slices/analysisSlice';
import type {
  EducationEntry,
  KeywordSelection,
  LanguageEntry,
  ResumeHeader,
  SkillGroup,
} from '../types/analysis.types';

/**
 * State, editing handlers and export logic for the ResultPage,
 * keeping the page component thin.
 */
export function useResultEditor() {
  const dispatch = useAppDispatch();

  const analysisResult = useAppSelector((state) => state.analysis.analysisResult);
  const selectedAIProvider = useAppSelector((state) => state.analysis.selectedAIProvider);
  const editableResume = useAppSelector((state) => state.analysis.editableResume);
  const editableCoverLetter = useAppSelector((state) => state.analysis.editableCoverLetter);
  const coverLetterMeta = useAppSelector((state) => state.analysis.coverLetterMeta);
  const editorDirtyState = useAppSelector((state) => state.analysis.editorDirtyState);

  const [applyKeywords, applyKeywordsStatus] = useApplyKeywordsMutation();
  const [appliedKeywords, setAppliedKeywords] = useState<string[]>([]);
  const [applyKeywordsWarnings, setApplyKeywordsWarnings] = useState<string[]>([]);

  const [exportResumePdf, resumePdfStatus] = useExportResumePdfMutation();
  const [exportResumeDocx, resumeDocxStatus] = useExportResumeDocxMutation();
  const [exportCoverLetterPdf, coverLetterPdfStatus] = useExportCoverLetterPdfMutation();
  const [exportCoverLetterDocx, coverLetterDocxStatus] = useExportCoverLetterDocxMutation();

  const isExportingResume = resumePdfStatus.isLoading || resumeDocxStatus.isLoading;
  const isExportingCoverLetter = coverLetterPdfStatus.isLoading || coverLetterDocxStatus.isLoading;

  const resumeExportError =
    resumePdfStatus.error ?? resumeDocxStatus.error
      ? extractErrorMessage(resumePdfStatus.error ?? resumeDocxStatus.error)
      : undefined;
  const coverLetterExportError =
    coverLetterPdfStatus.error ?? coverLetterDocxStatus.error
      ? extractErrorMessage(coverLetterPdfStatus.error ?? coverLetterDocxStatus.error)
      : undefined;

  function handleHeaderChange(patch: Partial<ResumeHeader>) {
    dispatch(updateResumeHeader(patch));
  }

  async function handleApplyKeywords(selections: KeywordSelection[]) {
    if (!editableResume) return;
    const result = await applyKeywords({
      resume: editableResume,
      jobTitle: analysisResult?.job.title,
      selections,
      aiProvider: selectedAIProvider,
    });
    if ('data' in result && result.data) {
      dispatch(setEditableResume(result.data.resume));
      setAppliedKeywords((previous) => [...previous, ...result.data.appliedKeywords]);
      setApplyKeywordsWarnings(result.data.warnings);
    }
  }

  function handleSummaryChange(value: string) {
    dispatch(updateResumeSummary(value));
  }

  function handleExperienceBulletChange(experienceIndex: number, bulletIndex: number, value: string) {
    dispatch(updateExperienceBullet({ experienceIndex, bulletIndex, value }));
  }

  function handleSkillsChange(skills: SkillGroup[]) {
    dispatch(updateResumeSection({ section: 'skills', value: skills }));
  }

  function handleEducationChange(education: EducationEntry[]) {
    dispatch(updateResumeSection({ section: 'education', value: education }));
  }

  function handleLanguagesChange(languages: LanguageEntry[]) {
    dispatch(updateResumeSection({ section: 'languages', value: languages }));
  }

  function handleCoverLetterChange(value: string) {
    dispatch(setEditableCoverLetter(value));
  }

  const resumeCompanyName = analysisResult?.job.companyName;

  function resumeExportPayload() {
    return {
      resume: editableResume!,
      candidateName: editableResume?.header.name,
      companyName: resumeCompanyName,
      jobTitle: analysisResult?.job.title,
    };
  }

  function coverLetterExportPayload() {
    return {
      coverLetter: editableCoverLetter,
      candidateName: editableResume?.header.name,
      companyName: coverLetterMeta?.companyName,
      jobTitle: coverLetterMeta?.jobTitle,
    };
  }

  /** e.g. "jonathan_oliveira_google.pdf" — candidate name + company from the JD. */
  function resumeFilename(ext: string) {
    return buildExportFilename(
      [editableResume?.header.name, resumeCompanyName],
      ext,
      'optimized-resume',
    );
  }

  function coverLetterFilename(ext: string) {
    return buildExportFilename(
      [editableResume?.header.name, coverLetterMeta?.companyName, 'cover-letter'],
      ext,
      'cover-letter',
    );
  }

  async function handleExportResumePdf() {
    if (!editableResume) return;
    const result = await exportResumePdf(resumeExportPayload());
    if ('data' in result && result.data) downloadBlob(result.data, resumeFilename('pdf'));
  }

  async function handleExportResumeDocx() {
    if (!editableResume) return;
    const result = await exportResumeDocx(resumeExportPayload());
    if ('data' in result && result.data) downloadBlob(result.data, resumeFilename('docx'));
  }

  async function handleExportCoverLetterPdf() {
    if (!editableCoverLetter) return;
    const result = await exportCoverLetterPdf(coverLetterExportPayload());
    if ('data' in result && result.data) downloadBlob(result.data, coverLetterFilename('pdf'));
  }

  async function handleExportCoverLetterDocx() {
    if (!editableCoverLetter) return;
    const result = await exportCoverLetterDocx(coverLetterExportPayload());
    if ('data' in result && result.data) downloadBlob(result.data, coverLetterFilename('docx'));
  }

  return {
    analysisResult,
    editableResume,
    editableCoverLetter,
    coverLetterMeta,
    editorDirtyState,
    isExportingResume,
    isExportingCoverLetter,
    resumeExportError,
    coverLetterExportError,
    isApplyingKeywords: applyKeywordsStatus.isLoading,
    applyKeywordsError: applyKeywordsStatus.error
      ? extractErrorMessage(applyKeywordsStatus.error)
      : undefined,
    appliedKeywords,
    applyKeywordsWarnings,
    handleApplyKeywords,
    handleHeaderChange,
    handleSummaryChange,
    handleExperienceBulletChange,
    handleSkillsChange,
    handleEducationChange,
    handleLanguagesChange,
    handleCoverLetterChange,
    handleExportResumePdf,
    handleExportResumeDocx,
    handleExportCoverLetterPdf,
    handleExportCoverLetterDocx,
  };
}
