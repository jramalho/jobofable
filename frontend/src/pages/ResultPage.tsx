import { useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import { Button } from '../components/Button';
import { EmptyState } from '../components/EmptyState';
import { ErrorState } from '../components/ErrorState';
import { LoadingState } from '../components/LoadingState';
import { extractErrorMessage } from '../lib/apiClient';
import { useGetAnalysisByIdQuery } from '../features/analysis/api/analysisApi';
import {
  useCheckDuplicatesQuery,
  useCreateApplicationFromAnalysisMutation,
} from '../features/tracker/api/trackerApi';
import { DuplicateWarning } from '../features/tracker/components/DuplicateWarning';
import { setCurrentAnalysis } from '../features/analysis/slices/analysisSlice';
import { CoverLetterEditor } from '../features/analysis/components/CoverLetterEditor';
import { ExportActions } from '../features/analysis/components/ExportActions';
import { GapList } from '../features/analysis/components/GapList';
import { KeywordList } from '../features/analysis/components/KeywordList';
import { MissingKeywordSelector } from '../features/analysis/components/MissingKeywordSelector';
import { RecommendationList } from '../features/analysis/components/RecommendationList';
import { ResumeEditor } from '../features/analysis/components/ResumeEditor';
import { ScoreBreakdown } from '../features/analysis/components/ScoreBreakdown';
import { ScoreCard } from '../features/analysis/components/ScoreCard';
import { useResultEditor } from '../features/analysis/hooks/useResultEditor';

export function ResultPage() {
  const { analysisId } = useParams<{ analysisId: string }>();
  const dispatch = useAppDispatch();
  const reduxResult = useAppSelector((state) => state.analysis.analysisResult);
  const loadedAnalysisId = useAppSelector((state) => state.analysis.currentAnalysisId);

  // Redux already holds the requested analysis (fresh run, or same id revisited).
  const hasMatchingRedux = Boolean(reduxResult) && loadedAnalysisId === analysisId;
  // Otherwise fetch it from the server so refresh and shared/history links work.
  const needsFetch = Boolean(analysisId) && !hasMatchingRedux;

  const { data, isError, error, refetch } = useGetAnalysisByIdQuery(analysisId ?? '', {
    skip: !needsFetch,
  });

  // Seed Redux from the fetched record (tagging it with the persisted id so the
  // existing editing/export flow works unchanged on the hydrated copy).
  useEffect(() => {
    if (data && loadedAnalysisId !== data.id) {
      dispatch(setCurrentAnalysis({ ...data.result, persistedAnalysisId: data.id }));
    }
  }, [data, loadedAnalysisId, dispatch]);

  // Warn before tracking if this analysis looks like a job already applied to.
  const jobForDuplicates = reduxResult?.job ?? data?.result.job;
  const { data: duplicates } = useCheckDuplicatesQuery(
    { companyName: jobForDuplicates?.companyName, jobTitle: jobForDuplicates?.title },
    { skip: !jobForDuplicates?.companyName && !jobForDuplicates?.title },
  );

  const editor = useResultEditor();
  const navigate = useNavigate();
  const [trackApplication, trackStatus] = useCreateApplicationFromAnalysisMutation();

  // The persisted (DB) analysis id — present for saved analyses; the action
  // needs a real id, so it's only offered when persistence succeeded.
  const persistedAnalysisId = editor.analysisResult?.persistedAnalysisId ?? data?.id ?? null;
  // Known link state (from the hydrated record); fresh runs rely on idempotency.
  const linkedApplicationId = data?.applicationId ?? null;

  async function handleTrackApplication() {
    if (!persistedAnalysisId) return;
    if (linkedApplicationId) {
      navigate(`/applications/${linkedApplicationId}`);
      return;
    }
    try {
      const application = await trackApplication(persistedAnalysisId).unwrap();
      navigate(`/applications/${application.id}`);
    } catch {
      // Surfaced inline below via trackStatus.error.
    }
  }

  if (needsFetch) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-20">
        {isError ? (
          <div className="space-y-4">
            <ErrorState message={extractErrorMessage(error)} onRetry={refetch} />
            <div className="text-center">
              <Link to="/analyses" className="text-sm font-medium text-indigo-600 hover:text-indigo-700">
                Back to saved analyses
              </Link>
            </div>
          </div>
        ) : (
          <LoadingState title="Loading analysis…" message="Fetching this saved analysis from the server." />
        )}
      </div>
    );
  }

  if (!editor.analysisResult || !editor.editableResume) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-20">
        <EmptyState
          title="No analysis loaded"
          message="Start a new analysis, or open one from your saved analyses."
          action={
            <div className="flex gap-2">
              <Link
                to="/new-analysis"
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
              >
                Start a new analysis
              </Link>
              <Link
                to="/analyses"
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Saved analyses
              </Link>
            </div>
          }
        />
      </div>
    );
  }

  const { analysisResult } = editor;

  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link to="/" className="text-lg font-bold text-slate-900">
            JobFit <span className="text-indigo-600">Resume AI</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link to="/analyses" className="text-sm font-medium text-indigo-600 hover:text-indigo-700">
              Saved analyses
            </Link>
            <Link to="/new-analysis" className="text-sm font-medium text-indigo-600 hover:text-indigo-700">
              New analysis
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-6 px-6 py-10">
        {duplicates && (
          <DuplicateWarning result={duplicates} companyName={analysisResult.job.companyName ?? undefined} />
        )}

        {persistedAnalysisId && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-indigo-100 bg-indigo-50 p-4">
            <p className="text-sm text-indigo-900">
              {linkedApplicationId
                ? 'This analysis is being tracked as a job application.'
                : 'Applying to this role? Track it as a job application to manage status, follow-ups and contacts.'}
            </p>
            <div className="flex flex-col items-end gap-1">
              <Button onClick={handleTrackApplication} disabled={trackStatus.isLoading}>
                {trackStatus.isLoading
                  ? 'Opening…'
                  : linkedApplicationId
                    ? 'Open application →'
                    : 'Track as application →'}
              </Button>
              {trackStatus.error && (
                <span className="text-xs text-red-600">{extractErrorMessage(trackStatus.error)}</span>
              )}
            </div>
          </div>
        )}

        <ScoreCard
          score={analysisResult.matchScore}
          jobTitle={analysisResult.job.title}
          companyName={analysisResult.job.companyName}
        />

        <div className="grid gap-6 lg:grid-cols-2">
          <ScoreBreakdown scores={analysisResult.scores} explanations={analysisResult.scoreExplanations} />
          <KeywordList
            found={analysisResult.candidate.keywordsFound}
            missing={analysisResult.candidate.missingKeywords}
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <GapList
            gaps={analysisResult.candidate.gaps}
            requirementsNotCovered={analysisResult.candidate.requirementsNotCovered}
            requirementsPartiallyCovered={analysisResult.candidate.requirementsPartiallyCovered}
          />
          <RecommendationList
            recommendations={analysisResult.candidate.recommendations}
            warnings={analysisResult.candidate.warnings}
          />
        </div>

        <MissingKeywordSelector
          missingKeywords={analysisResult.candidate.missingKeywords}
          experiences={editor.editableResume.experience}
          appliedKeywords={editor.appliedKeywords}
          isApplying={editor.isApplyingKeywords}
          error={editor.applyKeywordsError}
          warnings={editor.applyKeywordsWarnings}
          onApply={editor.handleApplyKeywords}
        />

        <ResumeEditor
          resume={editor.editableResume}
          onHeaderChange={editor.handleHeaderChange}
          onSummaryChange={editor.handleSummaryChange}
          onExperienceBulletChange={editor.handleExperienceBulletChange}
          onSkillsChange={editor.handleSkillsChange}
          onEducationChange={editor.handleEducationChange}
          onLanguagesChange={editor.handleLanguagesChange}
        />

        <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-600">
            Export the resume {editor.editorDirtyState ? '(includes your edits)' : ''}
          </p>
          <ExportActions
            onExportPdf={editor.handleExportResumePdf}
            onExportDocx={editor.handleExportResumeDocx}
            isExporting={editor.isExportingResume}
            error={editor.resumeExportError}
          />
        </div>

        <CoverLetterEditor
          coverLetter={editor.editableCoverLetter}
          meta={editor.coverLetterMeta}
          onChange={editor.handleCoverLetterChange}
          onExportPdf={editor.handleExportCoverLetterPdf}
          onExportDocx={editor.handleExportCoverLetterDocx}
          isExporting={editor.isExportingCoverLetter}
          exportError={editor.coverLetterExportError}
        />
      </main>
    </div>
  );
}
