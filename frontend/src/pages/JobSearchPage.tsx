import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppDispatch } from '../app/hooks';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { EmptyState } from '../components/EmptyState';
import { ErrorState } from '../components/ErrorState';
import { LoadingState } from '../components/LoadingState';
import { extractErrorMessage } from '../lib/apiClient';
import { getProfile } from '../lib/profileStorage';
import { setJobDescription } from '../features/analysis/slices/analysisSlice';
import {
  useCreateApplicationMutation,
  useSearchJobsMutation,
} from '../features/tracker/api/trackerApi';
import type { JobListing } from '../features/tracker/types/tracker.types';

export function JobSearchPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [keywordsText, setKeywordsText] = useState('');
  const [remoteOnly, setRemoteOnly] = useState(true);
  const [jobs, setJobs] = useState<JobListing[] | null>(null);
  const [meta, setMeta] = useState<{ alreadyTracked: number; sources: string[] } | null>(null);

  const [searchJobs, { isLoading, error }] = useSearchJobsMutation();
  const [createApplication, { isLoading: isTracking, originalArgs }] = useCreateApplicationMutation();

  // Prefill keywords from the saved resume profile's technical skills.
  useEffect(() => {
    void getProfile().then((profile) => {
      const skills = (profile?.resumeProfile?.resume as { technicalSkills?: string[] } | undefined)
        ?.technicalSkills;
      if (skills?.length) setKeywordsText(skills.slice(0, 6).join(', '));
    });
  }, []);

  const keywords = keywordsText
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);

  async function handleSearch() {
    if (keywords.length === 0) return;
    const result = await searchJobs({ keywords, remoteOnly, limit: 30 }).unwrap();
    setJobs(result.jobs);
    setMeta({ alreadyTracked: result.alreadyTracked, sources: result.sources });
  }

  async function handleTrack(job: JobListing) {
    await createApplication({
      companyName: job.company,
      jobTitle: job.title,
      jobUrl: job.url,
      source: job.source,
      jobDescription: job.description.slice(0, 5000),
      remoteType: job.remote ? 'remote' : undefined,
    }).unwrap();
    // Remove it from the list — it's in the tracker now.
    setJobs((current) => current?.filter((item) => item.id !== job.id) ?? null);
  }

  function handleAnalyze(job: JobListing) {
    dispatch(setJobDescription(job.description));
    navigate('/new-analysis');
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <Link to="/" className="text-lg font-bold text-slate-900">
            JobFit <span className="text-indigo-600">Resume AI</span>
          </Link>
          <Link to="/applications" className="text-sm font-medium text-indigo-600 hover:text-indigo-700">
            Applications
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-4xl space-y-6 px-6 py-10">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Find jobs</h1>
          <p className="mt-1 text-sm text-slate-500">
            Searches public job boards for your skills and hides anything already in your tracker.
          </p>
        </div>

        <Card>
          <div className="space-y-4">
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-slate-700">
                Keywords (comma-separated)
              </span>
              <input
                value={keywordsText}
                onChange={(event) => setKeywordsText(event.target.value)}
                placeholder="React Native, TypeScript, Node.js"
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </label>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <label className="flex items-center gap-2 text-sm text-slate-600">
                <input
                  type="checkbox"
                  checked={remoteOnly}
                  onChange={(event) => setRemoteOnly(event.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-indigo-600"
                />
                Remote only
              </label>
              <Button onClick={handleSearch} disabled={isLoading || keywords.length === 0}>
                {isLoading ? 'Searching…' : 'Find jobs'}
              </Button>
            </div>
          </div>
        </Card>

        {isLoading ? (
          <LoadingState title="Searching job boards…" message="Querying public sources for your skills." />
        ) : error ? (
          <ErrorState message={extractErrorMessage(error)} onRetry={handleSearch} />
        ) : jobs === null ? null : jobs.length === 0 ? (
          <EmptyState
            title="No new jobs found"
            message="Try different keywords, or everything matching is already in your tracker."
          />
        ) : (
          <>
            {meta && (
              <p className="text-sm text-slate-500">
                Showing {jobs.length} job{jobs.length === 1 ? '' : 's'}
                {meta.alreadyTracked > 0 ? ` · hid ${meta.alreadyTracked} already tracked` : ''} · sources:{' '}
                {meta.sources.join(', ')}
              </p>
            )}
            <ul className="space-y-3">
              {jobs.map((job) => (
                <li key={job.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-900">{job.company}</p>
                      <p className="text-sm text-slate-600">{job.title}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-x-3 text-xs text-slate-400">
                        <span>{job.source}</span>
                        {job.location && <span>{job.location}</span>}
                        {job.salary && <span>{job.salary}</span>}
                        {job.remote && <span>Remote</span>}
                      </div>
                      {job.tags.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {[...new Set(job.tags)].slice(0, 6).map((tag) => (
                            <span
                              key={tag}
                              className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-2">
                      <a
                        href={job.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
                      >
                        Open posting ↗
                      </a>
                      <div className="flex gap-2">
                        <Button variant="secondary" onClick={() => handleAnalyze(job)}>
                          Analyze
                        </Button>
                        <Button
                          onClick={() => handleTrack(job)}
                          disabled={isTracking && originalArgs?.jobUrl === job.url}
                        >
                          Track
                        </Button>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </main>
    </div>
  );
}
