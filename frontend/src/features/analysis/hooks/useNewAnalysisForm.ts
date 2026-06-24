import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../../app/hooks';
import { extractErrorMessage } from '../../../lib/apiClient';
import { clearProfile, getProfile, patchProfile } from '../../../lib/profileStorage';
import { useCreateAnalysisMutation } from '../api/analysisApi';
import {
  setCoverLetterTone,
  setCurrentAnalysis,
  setJobDescription,
  setSelectedAIProvider,
  setSelectedLinkedInFileName,
  setSelectedResumeFileName,
} from '../slices/analysisSlice';
import type {
  AIProviderName,
  CoverLetterTone,
  ResumeProfilePayload,
} from '../types/analysis.types';

interface FormErrors {
  jobDescription?: string;
  resumeFile?: string;
  linkedInFile?: string;
}

const RESUME_EXTENSIONS = ['pdf', 'docx'];
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;

function fileExtension(file: File): string {
  return file.name.toLowerCase().split('.').pop() ?? '';
}

/**
 * All state, validation and submit logic for the NewAnalysisPage,
 * keeping the page component thin.
 */
export function useNewAnalysisForm() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const jobDescription = useAppSelector((state) => state.analysis.jobDescription);
  const coverLetterTone = useAppSelector((state) => state.analysis.coverLetterTone);
  const aiProvider = useAppSelector((state) => state.analysis.selectedAIProvider);
  const resumeFileName = useAppSelector((state) => state.analysis.selectedResumeFileName);
  const linkedInFileName = useAppSelector((state) => state.analysis.selectedLinkedInFileName);

  // File objects are not serializable, so they live in local state;
  // only the file names are mirrored into Redux.
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [linkedInFile, setLinkedInFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});

  // "Save my resume so I don't re-upload it" — persisted locally in IndexedDB.
  const [saveAsProfile, setSaveAsProfile] = useState(false);
  const [hasSavedProfile, setHasSavedProfile] = useState(false);
  // The already-analyzed resume from a previous run: lets us skip re-uploading
  // and re-parsing entirely, unless the user picks a fresh file to replace it.
  const [savedResumeProfile, setSavedResumeProfile] = useState<ResumeProfilePayload | null>(null);
  const [savedCandidateName, setSavedCandidateName] = useState<string | null>(null);
  const [userPickedNewFile, setUserPickedNewFile] = useState(false);

  const [createAnalysis, { isLoading, error: submitError }] = useCreateAnalysisMutation();

  // On first mount, pre-fill from a previously saved profile.
  useEffect(() => {
    let cancelled = false;
    void getProfile().then((profile) => {
      if (cancelled || !profile) return;
      setHasSavedProfile(true);
      setSaveAsProfile(true);
      if (profile.file) {
        setResumeFile((current) => current ?? profile.file ?? null);
        dispatch(setSelectedResumeFileName(profile.file.name));
      }
      if (profile.resumeProfile) setSavedResumeProfile(profile.resumeProfile);
      if (profile.candidateName) setSavedCandidateName(profile.candidateName);
    });
    return () => {
      cancelled = true;
    };
  }, [dispatch]);

  // Fast path available when we have a cached analysis and the user has not
  // chosen a new file to replace it.
  const usingSavedProfile = Boolean(savedResumeProfile) && !userPickedNewFile;

  function handleJobDescriptionChange(value: string) {
    dispatch(setJobDescription(value));
    if (errors.jobDescription) setErrors((previous) => ({ ...previous, jobDescription: undefined }));
  }

  function handleResumeFileSelected(file: File | null) {
    if (file && !RESUME_EXTENSIONS.includes(fileExtension(file))) {
      setErrors((previous) => ({ ...previous, resumeFile: 'Only PDF and DOCX files are accepted.' }));
      return;
    }
    if (file && file.size > MAX_FILE_SIZE_BYTES) {
      setErrors((previous) => ({ ...previous, resumeFile: 'File is too large (max 5 MB).' }));
      return;
    }
    setResumeFile(file);
    // A user-picked file replaces the cached profile, forcing a fresh re-parse.
    setUserPickedNewFile(Boolean(file));
    dispatch(setSelectedResumeFileName(file?.name ?? null));
    setErrors((previous) => ({ ...previous, resumeFile: undefined }));
  }

  function handleLinkedInFileSelected(file: File | null) {
    if (file && fileExtension(file) !== 'pdf') {
      setErrors((previous) => ({ ...previous, linkedInFile: 'The LinkedIn export must be a PDF.' }));
      return;
    }
    if (file && file.size > MAX_FILE_SIZE_BYTES) {
      setErrors((previous) => ({ ...previous, linkedInFile: 'File is too large (max 5 MB).' }));
      return;
    }
    setLinkedInFile(file);
    dispatch(setSelectedLinkedInFileName(file?.name ?? null));
    setErrors((previous) => ({ ...previous, linkedInFile: undefined }));
  }

  function handleToggleSaveAsProfile(value: boolean) {
    setSaveAsProfile(value);
  }

  async function handleClearSavedProfile() {
    await clearProfile();
    setHasSavedProfile(false);
    setSaveAsProfile(false);
    setSavedResumeProfile(null);
    setSavedCandidateName(null);
    setUserPickedNewFile(false);
    setResumeFile(null);
    dispatch(setSelectedResumeFileName(null));
  }

  function handleToneChange(tone: CoverLetterTone) {
    dispatch(setCoverLetterTone(tone));
  }

  function handleProviderChange(provider: AIProviderName) {
    dispatch(setSelectedAIProvider(provider));
  }

  function validate(): boolean {
    const nextErrors: FormErrors = {};
    if (jobDescription.trim().length < 50) {
      nextErrors.jobDescription = 'Paste the full job description (at least 50 characters).';
    }
    // A resume can come from an upload OR a cached profile; require one of them.
    if (!resumeFile && !usingSavedProfile) {
      nextErrors.resumeFile = 'Upload your current resume (PDF or DOCX).';
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function handleSubmit() {
    if (!validate()) return;
    if (!resumeFile && !usingSavedProfile) return;

    const formData = new FormData();
    formData.append('jobDescription', jobDescription.trim());
    if (usingSavedProfile && savedResumeProfile) {
      // Fast path: reuse the cached analysis, no file upload or re-parsing.
      formData.append('savedProfile', JSON.stringify(savedResumeProfile));
    } else if (resumeFile) {
      formData.append('resumeFile', resumeFile);
    }
    if (linkedInFile) formData.append('linkedInFile', linkedInFile);
    formData.append('coverLetterTone', coverLetterTone);
    formData.append('aiProvider', aiProvider);

    const result = await createAnalysis(formData);
    if ('data' in result && result.data) {
      await persistProfile(result.data.profile, result.data.optimizedResume.header.name);
      dispatch(setCurrentAnalysis(result.data));
      // Prefer the persisted DB id so the result route survives a refresh; fall
      // back to the in-memory pipeline id if persistence failed server-side.
      const routeId = result.data.persistedAnalysisId ?? result.data.analysisId;
      navigate(`/result/${routeId}`);
    }
  }

  /** After a successful run, cache (or forget) the analyzed resume for next time. */
  async function persistProfile(profile: ResumeProfilePayload, candidateName?: string) {
    if (saveAsProfile) {
      await patchProfile({
        resumeProfile: profile,
        candidateName,
        // Keep the original file only when the user uploaded one this round.
        ...(userPickedNewFile && resumeFile ? { file: resumeFile } : {}),
      });
      setHasSavedProfile(true);
      setSavedResumeProfile(profile);
      if (candidateName) setSavedCandidateName(candidateName);
    } else if (hasSavedProfile) {
      await clearProfile();
      setHasSavedProfile(false);
      setSavedResumeProfile(null);
    }
  }

  return {
    jobDescription,
    coverLetterTone,
    aiProvider,
    resumeFileName,
    linkedInFileName,
    errors,
    isLoading,
    saveAsProfile,
    hasSavedProfile,
    usingSavedProfile,
    savedCandidateName,
    submitErrorMessage: submitError ? extractErrorMessage(submitError) : undefined,
    handleJobDescriptionChange,
    handleResumeFileSelected,
    handleLinkedInFileSelected,
    handleToggleSaveAsProfile,
    handleClearSavedProfile,
    handleToneChange,
    handleProviderChange,
    handleSubmit,
  };
}
