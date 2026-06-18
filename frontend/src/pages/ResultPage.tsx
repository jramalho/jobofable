import { Link } from 'react-router-dom';
import { EmptyState } from '../components/EmptyState';
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
  const editor = useResultEditor();

  if (!editor.analysisResult || !editor.editableResume) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-20">
        <EmptyState
          title="No analysis loaded"
          message="Results live in memory for the current session. Start a new analysis to see results here."
          action={
            <Link
              to="/new-analysis"
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
            >
              Start a new analysis
            </Link>
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
          <Link to="/new-analysis" className="text-sm font-medium text-indigo-600 hover:text-indigo-700">
            New analysis
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-6 px-6 py-10">
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
