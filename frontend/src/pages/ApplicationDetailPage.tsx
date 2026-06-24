import { useEffect, useState, type ReactNode } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { ErrorState } from '../components/ErrorState';
import { LoadingState } from '../components/LoadingState';
import { Textarea } from '../components/Textarea';
import { extractErrorMessage } from '../lib/apiClient';
import {
  useGetApplicationQuery,
  useUpdateApplicationMutation,
} from '../features/tracker/api/trackerApi';
import { ApplicationTimeline } from '../features/tracker/components/ApplicationTimeline';
import { ContactsSection } from '../features/tracker/components/ContactsSection';
import { FollowUpSection } from '../features/tracker/components/FollowUpSection';
import { SelectField, TextField } from '../features/tracker/components/fields';
import {
  CONTRACT_TYPE_OPTIONS,
  REMOTE_TYPE_OPTIONS,
  STATUS_OPTIONS,
} from '../features/tracker/constants';
import { formatDate, humanize } from '../features/tracker/format';
import type {
  ApplicationDetail,
  ApplicationInput,
  ApplicationStatus,
} from '../features/tracker/types/tracker.types';

const toOptions = (values: string[]) => values.map((value) => ({ value, label: humanize(value) }));

type DetailsForm = {
  companyName: string;
  jobTitle: string;
  jobUrl: string;
  source: string;
  salaryMin: string;
  salaryMax: string;
  currency: string;
  contractType: string;
  remoteType: string;
  jobDescription: string;
  notes: string;
};

function toForm(app: ApplicationDetail): DetailsForm {
  return {
    companyName: app.company?.name ?? '',
    jobTitle: app.jobTitle,
    jobUrl: app.jobUrl ?? '',
    source: app.source ?? '',
    salaryMin: app.salaryMin?.toString() ?? '',
    salaryMax: app.salaryMax?.toString() ?? '',
    currency: app.currency ?? '',
    contractType: app.contractType ?? '',
    remoteType: app.remoteType ?? '',
    jobDescription: app.jobDescription ?? '',
    notes: app.notes ?? '',
  };
}

export function ApplicationDetailPage() {
  const { id = '' } = useParams<{ id: string }>();
  const { data, isLoading, isError, error, refetch } = useGetApplicationQuery(id, { skip: !id });
  const [updateApplication, { isLoading: isSaving }] = useUpdateApplicationMutation();

  const [form, setForm] = useState<DetailsForm | null>(null);

  // Seed the edit form once per application (not on every refetch) so unsaved
  // edits survive background invalidations (e.g. after a status change).
  useEffect(() => {
    if (data) setForm((current) => current ?? toForm(data));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?.id]);

  if (isLoading || (!data && !isError)) {
    return (
      <CenteredState>
        <LoadingState title="Loading application…" />
      </CenteredState>
    );
  }
  if (isError || !data) {
    return (
      <CenteredState>
        <div className="space-y-4">
          <ErrorState message={data ? 'Application not found.' : extractErrorMessage(error)} onRetry={refetch} />
          <div className="text-center">
            <Link to="/applications" className="text-sm font-medium text-indigo-600 hover:text-indigo-700">
              Back to applications
            </Link>
          </div>
        </div>
      </CenteredState>
    );
  }

  function set<K extends keyof DetailsForm>(key: K, value: string) {
    setForm((previous) => (previous ? { ...previous, [key]: value } : previous));
  }

  async function handleStatusChange(status: ApplicationStatus) {
    await updateApplication({ id, body: { status } });
  }

  async function handleSaveDetails() {
    if (!form) return;
    const text = (value: string) => (value.trim() ? value.trim() : undefined);
    const num = (value: string) => (value.trim() ? Number(value) : undefined);
    const body: ApplicationInput = {
      jobTitle: form.jobTitle.trim() || data!.jobTitle,
      companyName: text(form.companyName),
      jobUrl: text(form.jobUrl),
      source: text(form.source),
      salaryMin: num(form.salaryMin),
      salaryMax: num(form.salaryMax),
      currency: text(form.currency),
      contractType: text(form.contractType),
      remoteType: text(form.remoteType),
      jobDescription: text(form.jobDescription),
      notes: text(form.notes),
    };
    await updateApplication({ id, body });
  }

  const app = data;

  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <Link to="/" className="text-lg font-bold text-slate-900">
            JobFit <span className="text-indigo-600">Resume AI</span>
          </Link>
          <Link to="/applications" className="text-sm font-medium text-indigo-600 hover:text-indigo-700">
            All applications
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-4xl space-y-6 px-6 py-10">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{app.company?.name ?? 'Unknown company'}</h1>
          <p className="mt-1 text-slate-600">{app.jobTitle}</p>
          <div className="mt-3 flex flex-wrap items-end gap-4">
            <div className="w-56">
              <SelectField
                label="Status"
                value={app.status}
                onChange={(value) => handleStatusChange(value as ApplicationStatus)}
                options={STATUS_OPTIONS}
              />
            </div>
            <Meta label="Match score" value={app.matchScore !== null ? String(app.matchScore) : '—'} />
            <Meta label="Applied" value={formatDate(app.appliedAt)} />
            <Meta label="Next follow-up" value={formatDate(app.nextFollowUpAt)} />
          </div>
        </div>

        {(app.analysis || app.documents.length > 0) && (
          <Card title="Linked documents">
            <div className="space-y-2 text-sm">
              {app.analysis && (
                <div className="flex items-center justify-between gap-3">
                  <span className="text-slate-600">
                    Analysis · match {app.analysis.matchScore ?? '—'}
                  </span>
                  <Link
                    to={`/result/${app.analysis.id}`}
                    className="font-medium text-indigo-600 hover:text-indigo-700"
                  >
                    Open analysis
                  </Link>
                </div>
              )}
              {app.documents.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between gap-3">
                  <span className="text-slate-600">
                    {doc.type === 'coverLetter' ? 'Cover letter' : 'Resume'}
                    {doc.title ? ` · ${doc.title}` : ''}
                  </span>
                  <span className="text-xs text-slate-400">{formatDate(doc.createdAt)}</span>
                </div>
              ))}
            </div>
          </Card>
        )}

        {form && (
          <Card title="Details" subtitle="Company, role, compensation and notes.">
            <div className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <TextField label="Company name" value={form.companyName} onChange={(v) => set('companyName', v)} />
                <TextField label="Job title" value={form.jobTitle} onChange={(v) => set('jobTitle', v)} />
                <TextField label="Job URL" value={form.jobUrl} onChange={(v) => set('jobUrl', v)} />
                <TextField label="Source" value={form.source} onChange={(v) => set('source', v)} />
                <SelectField label="Remote type" value={form.remoteType} onChange={(v) => set('remoteType', v)} placeholder="—" options={toOptions(REMOTE_TYPE_OPTIONS)} />
                <SelectField label="Contract type" value={form.contractType} onChange={(v) => set('contractType', v)} placeholder="—" options={toOptions(CONTRACT_TYPE_OPTIONS)} />
                <TextField label="Currency" value={form.currency} onChange={(v) => set('currency', v)} />
                <div className="grid grid-cols-2 gap-3">
                  <TextField label="Salary min" type="number" value={form.salaryMin} onChange={(v) => set('salaryMin', v)} />
                  <TextField label="Salary max" type="number" value={form.salaryMax} onChange={(v) => set('salaryMax', v)} />
                </div>
              </div>
              <Textarea label="Job description" rows={5} value={form.jobDescription} onChange={(e) => set('jobDescription', e.target.value)} />
              <Textarea label="Notes" rows={3} value={form.notes} onChange={(e) => set('notes', e.target.value)} />
              <Button onClick={handleSaveDetails} disabled={isSaving}>
                {isSaving ? 'Saving…' : 'Save details'}
              </Button>
            </div>
          </Card>
        )}

        <ApplicationTimeline applicationId={id} events={app.events} />
        <FollowUpSection applicationId={id} followUps={app.followUpTasks} />
        <ContactsSection applicationId={id} contacts={app.contacts} />
      </main>
    </div>
  );
}

function CenteredState({ children }: { children: ReactNode }) {
  return <div className="mx-auto max-w-3xl px-6 py-20">{children}</div>;
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-wide text-slate-400">{label}</p>
      <p className="text-sm text-slate-700">{value}</p>
    </div>
  );
}
