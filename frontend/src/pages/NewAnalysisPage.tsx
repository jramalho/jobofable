import { Link } from 'react-router-dom';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { LoadingState } from '../components/LoadingState';
import { CoverLetterToneSelect } from '../features/analysis/components/CoverLetterToneSelect';
import { JobDescriptionInput } from '../features/analysis/components/JobDescriptionInput';
import { LinkedInUpload } from '../features/analysis/components/LinkedInUpload';
import { ProviderSelect } from '../features/analysis/components/ProviderSelect';
import { ResumeUpload } from '../features/analysis/components/ResumeUpload';
import { useNewAnalysisForm } from '../features/analysis/hooks/useNewAnalysisForm';

export function NewAnalysisPage() {
  const form = useNewAnalysisForm();

  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
          <Link to="/" className="text-lg font-bold text-slate-900">
            JobFit <span className="text-indigo-600">Resume AI</span>
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-6 px-6 py-10">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">New analysis</h1>
          <p className="mt-1 text-sm text-slate-500">
            Paste the job description and upload your documents. Nothing is stored on our servers.
          </p>
        </div>

        {form.isLoading ? (
          <LoadingState
            title="Generating your optimized application…"
            message="Analyzing the job, your resume and generating tailored documents. This usually takes 30-60 seconds."
          />
        ) : (
          <>
            <Card>
              <div className="space-y-6">
                <JobDescriptionInput
                  value={form.jobDescription}
                  error={form.errors.jobDescription}
                  onChange={form.handleJobDescriptionChange}
                />
                <div>
                  <ResumeUpload
                    fileName={form.resumeFileName}
                    error={form.errors.resumeFile}
                    onFileSelected={form.handleResumeFileSelected}
                  />
                  <div className="mt-2 flex items-center justify-between gap-3">
                    <label className="flex items-center gap-2 text-sm text-slate-600">
                      <input
                        type="checkbox"
                        checked={form.saveAsProfile}
                        onChange={(event) => form.handleToggleSaveAsProfile(event.target.checked)}
                        className="h-4 w-4 rounded border-slate-300 text-indigo-600"
                      />
                      Save this resume in this browser so I don't have to re-upload it
                    </label>
                    {form.hasSavedProfile && (
                      <button
                        type="button"
                        onClick={form.handleClearSavedProfile}
                        className="shrink-0 text-sm text-slate-400 hover:text-red-500"
                      >
                        Forget saved resume
                      </button>
                    )}
                  </div>
                  {form.usingSavedProfile ? (
                    <p className="mt-1 text-xs text-emerald-600">
                      Reusing your saved profile
                      {form.savedCandidateName ? ` (${form.savedCandidateName})` : ''} — this run skips
                      re-uploading and re-parsing your resume. Choose a file above to replace it.
                    </p>
                  ) : (
                    form.hasSavedProfile && (
                      <p className="mt-1 text-xs text-slate-400">
                        Loaded your saved resume — stored only in this browser, never on our servers.
                      </p>
                    )
                  )}
                </div>
                <LinkedInUpload
                  fileName={form.linkedInFileName}
                  error={form.errors.linkedInFile}
                  onFileSelected={form.handleLinkedInFileSelected}
                />
                <div className="grid gap-4 sm:grid-cols-2">
                  <CoverLetterToneSelect value={form.coverLetterTone} onChange={form.handleToneChange} />
                  <ProviderSelect value={form.aiProvider} onChange={form.handleProviderChange} />
                </div>
              </div>
            </Card>

            {form.submitErrorMessage && (
              <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700 ring-1 ring-red-200">
                {form.submitErrorMessage}
              </div>
            )}

            <Button onClick={form.handleSubmit} className="w-full py-3 text-base">
              Generate optimized application
            </Button>
          </>
        )}
      </main>
    </div>
  );
}
