import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { EmptyState } from '../components/EmptyState';
import { ErrorState } from '../components/ErrorState';
import { LoadingState } from '../components/LoadingState';
import { extractErrorMessage } from '../lib/apiClient';
import { useGetApplicationsQuery } from '../features/tracker/api/trackerApi';
import { KanbanBoard } from '../features/tracker/components/KanbanBoard';
import { StatusBadge } from '../features/tracker/components/StatusBadge';
import { SelectField } from '../features/tracker/components/fields';
import { STATUS_OPTIONS } from '../features/tracker/constants';
import { formatDate } from '../features/tracker/format';

type View = 'list' | 'kanban';
const VIEW_STORAGE_KEY = 'applications-view';

export function ApplicationsListPage() {
  const { data, isLoading, isError, error, refetch } = useGetApplicationsQuery();
  const [view, setView] = useState<View>(() =>
    localStorage.getItem(VIEW_STORAGE_KEY) === 'kanban' ? 'kanban' : 'list',
  );
  const [status, setStatus] = useState('');
  const [source, setSource] = useState('');
  const [search, setSearch] = useState('');

  function changeView(next: View) {
    setView(next);
    localStorage.setItem(VIEW_STORAGE_KEY, next);
    // The status filter is hidden in Kanban (columns are statuses), so clear it.
    if (next === 'kanban') setStatus('');
  }

  const applications = data ?? [];

  const sourceOptions = useMemo(() => {
    const sources = [...new Set(applications.map((a) => a.source).filter(Boolean))] as string[];
    return sources.map((value) => ({ value, label: value }));
  }, [applications]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return applications.filter((app) => {
      if (status && app.status !== status) return false;
      if (source && app.source !== source) return false;
      if (term) {
        const haystack = `${app.company?.name ?? ''} ${app.jobTitle}`.toLowerCase();
        if (!haystack.includes(term)) return false;
      }
      return true;
    });
  }, [applications, status, source, search]);

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
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Applications</h1>
            <p className="mt-1 text-sm text-slate-500">Track every role you've applied to.</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="inline-flex rounded-lg border border-slate-300 bg-white p-0.5">
              {(['list', 'kanban'] as View[]).map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => changeView(option)}
                  className={`rounded-md px-3 py-1.5 text-sm font-medium capitalize transition-colors ${
                    view === option ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
            <Link
              to="/applications/new"
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
            >
              New application
            </Link>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          {view === 'list' && (
            <SelectField
              label="Status"
              value={status}
              onChange={setStatus}
              placeholder="All statuses"
              options={STATUS_OPTIONS}
            />
          )}
          <SelectField
            label="Source"
            value={source}
            onChange={setSource}
            placeholder="All sources"
            options={sourceOptions}
          />
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-slate-700">Search</span>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Company or job title"
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </label>
        </div>

        {isLoading ? (
          <LoadingState title="Loading applications…" message="Fetching your tracked applications." />
        ) : isError ? (
          <ErrorState message={extractErrorMessage(error)} onRetry={refetch} />
        ) : applications.length === 0 ? (
          <EmptyState
            title="No applications yet"
            message="Add your first application to start tracking your job search."
            action={
              <Link
                to="/applications/new"
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
              >
                New application
              </Link>
            }
          />
        ) : filtered.length === 0 ? (
          <EmptyState title="No matches" message="No applications match the current filters." />
        ) : view === 'kanban' ? (
          <KanbanBoard applications={filtered} />
        ) : (
          <ul className="space-y-3">
            {filtered.map((app) => (
              <li
                key={app.id}
                className="flex flex-wrap items-center gap-x-6 gap-y-2 rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
              >
                <div className="min-w-[12rem] flex-1">
                  <p className="truncate text-sm font-semibold text-slate-900">
                    {app.company?.name ?? 'Unknown company'}
                  </p>
                  <p className="truncate text-sm text-slate-600">{app.jobTitle}</p>
                </div>
                <StatusBadge status={app.status} />
                <Metric label="Match" value={app.matchScore !== null ? String(app.matchScore) : '—'} />
                <Metric label="Applied" value={formatDate(app.appliedAt)} />
                <Metric label="Next follow-up" value={formatDate(app.nextFollowUpAt)} />
                <Metric label="Source" value={app.source ?? '—'} />
                <Link
                  to={`/applications/${app.id}`}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Open
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-[5rem]">
      <p className="text-[11px] uppercase tracking-wide text-slate-400">{label}</p>
      <p className="truncate text-sm text-slate-700">{value}</p>
    </div>
  );
}
