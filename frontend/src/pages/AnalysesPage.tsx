import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../components/Button';
import { EmptyState } from '../components/EmptyState';
import { ErrorState } from '../components/ErrorState';
import { LoadingState } from '../components/LoadingState';
import { extractErrorMessage } from '../lib/apiClient';
import {
  useDeleteAnalysisMutation,
  useGetAnalysesQuery,
} from '../features/analysis/api/analysisApi';
import { useCreateApplicationFromAnalysisMutation } from '../features/tracker/api/trackerApi';
import type { AnalysisListItem } from '../features/analysis/types/analysis.types';

export function AnalysesPage() {
  const { data, isLoading, isError, error, refetch } = useGetAnalysesQuery();
  const [deleteAnalysis, deleteStatus] = useDeleteAnalysisMutation();
  const [trackApplication, trackStatus] = useCreateApplicationFromAnalysisMutation();
  const navigate = useNavigate();

  const analyses = data?.analyses ?? [];

  async function handleDelete(item: AnalysisListItem) {
    const label = item.companyName ?? item.jobTitle ?? 'this analysis';
    if (!window.confirm(`Delete the saved analysis for ${label}? This cannot be undone.`)) return;
    await deleteAnalysis(item.id);
  }

  async function handleTrack(item: AnalysisListItem) {
    if (item.applicationId) {
      navigate(`/applications/${item.applicationId}`);
      return;
    }
    const application = await trackApplication(item.id).unwrap();
    navigate(`/applications/${application.id}`);
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
          <Link to="/" className="text-lg font-bold text-slate-900">
            JobFit <span className="text-indigo-600">Resume AI</span>
          </Link>
          <Link to="/new-analysis" className="text-sm font-medium text-indigo-600 hover:text-indigo-700">
            New analysis
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-6 px-6 py-10">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Saved analyses</h1>
          <p className="mt-1 text-sm text-slate-500">
            Previous analyses saved on this server. Open one to view and export it again.
          </p>
        </div>

        {isLoading ? (
          <LoadingState title="Loading your analyses…" message="Fetching saved analyses from the server." />
        ) : isError ? (
          <ErrorState message={extractErrorMessage(error)} onRetry={refetch} />
        ) : analyses.length === 0 ? (
          <EmptyState
            title="No saved analyses yet"
            message="Run an analysis and it will show up here so you can reopen it later."
            action={
              <Link
                to="/new-analysis"
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
              >
                Start a new analysis
              </Link>
            }
          />
        ) : (
          <ul className="space-y-3">
            {analyses.map((item) => {
              const isDeleting = deleteStatus.isLoading && deleteStatus.originalArgs === item.id;
              return (
                <li
                  key={item.id}
                  className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-900">
                      {item.companyName ?? 'Unknown company'}
                    </p>
                    <p className="truncate text-sm text-slate-600">{item.jobTitle ?? 'Unknown role'}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-x-3 text-xs text-slate-400">
                      {item.matchScore !== null && (
                        <span className="font-medium text-slate-500">Match {item.matchScore}</span>
                      )}
                      <span>{formatDate(item.createdAt)}</span>
                      {item.applicationId && (
                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 font-medium text-emerald-700">
                          Tracked
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <Button variant="secondary" onClick={() => navigate(`/result/${item.id}`)}>
                      Open
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => handleTrack(item)}
                      disabled={trackStatus.isLoading && trackStatus.originalArgs === item.id}
                    >
                      {item.applicationId ? 'Application →' : 'Track'}
                    </Button>
                    <Button
                      variant="ghost"
                      className="text-red-600 hover:bg-red-50"
                      onClick={() => handleDelete(item)}
                      disabled={isDeleting}
                    >
                      {isDeleting ? 'Deleting…' : 'Delete'}
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </main>
    </div>
  );
}

function formatDate(iso: string): string {
  const date = new Date(iso);
  return Number.isNaN(date.getTime())
    ? ''
    : date.toLocaleString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
}
