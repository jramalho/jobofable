import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Textarea } from '../components/Textarea';
import { extractErrorMessage } from '../lib/apiClient';
import {
  useCheckDuplicatesQuery,
  useCreateApplicationMutation,
} from '../features/tracker/api/trackerApi';
import { DuplicateWarning } from '../features/tracker/components/DuplicateWarning';
import { SelectField, TextField } from '../features/tracker/components/fields';
import type { DuplicateCheckArgs } from '../features/tracker/types/tracker.types';
import {
  CONTRACT_TYPE_OPTIONS,
  REMOTE_TYPE_OPTIONS,
  STATUS_OPTIONS,
} from '../features/tracker/constants';
import type { ApplicationInput, ApplicationStatus } from '../features/tracker/types/tracker.types';
import { humanize } from '../features/tracker/format';

const toOptions = (values: string[]) => values.map((value) => ({ value, label: humanize(value) }));

export function NewApplicationPage() {
  const navigate = useNavigate();
  const [createApplication, { isLoading, error }] = useCreateApplicationMutation();

  const [form, setForm] = useState({
    companyName: '',
    jobTitle: '',
    jobUrl: '',
    source: '',
    status: 'saved' as ApplicationStatus,
    salaryMin: '',
    salaryMax: '',
    currency: '',
    contractType: '',
    remoteType: '',
    jobDescription: '',
    notes: '',
  });
  const [jobTitleError, setJobTitleError] = useState<string | undefined>();

  // Debounced duplicate check on the identifying fields (company / title / URL).
  const [dupArgs, setDupArgs] = useState<DuplicateCheckArgs | null>(null);
  const [dupDismissed, setDupDismissed] = useState(false);
  useEffect(() => {
    const company = form.companyName.trim();
    const url = form.jobUrl.trim();
    if (!company && !url) {
      setDupArgs(null);
      return;
    }
    const handle = setTimeout(() => {
      setDupDismissed(false);
      setDupArgs({
        companyName: company || undefined,
        jobTitle: form.jobTitle.trim() || undefined,
        jobUrl: url || undefined,
      });
    }, 500);
    return () => clearTimeout(handle);
  }, [form.companyName, form.jobUrl, form.jobTitle]);

  const { data: duplicates } = useCheckDuplicatesQuery(dupArgs ?? {}, { skip: !dupArgs });

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((previous) => ({ ...previous, [key]: value }));
  }

  function buildPayload(): ApplicationInput {
    const text = (value: string) => (value.trim() ? value.trim() : undefined);
    const num = (value: string) => (value.trim() ? Number(value) : undefined);
    return {
      jobTitle: form.jobTitle.trim(),
      companyName: text(form.companyName),
      jobUrl: text(form.jobUrl),
      source: text(form.source),
      status: form.status,
      salaryMin: num(form.salaryMin),
      salaryMax: num(form.salaryMax),
      currency: text(form.currency),
      contractType: text(form.contractType),
      remoteType: text(form.remoteType),
      jobDescription: text(form.jobDescription),
      notes: text(form.notes),
    };
  }

  async function handleSubmit() {
    if (!form.jobTitle.trim()) {
      setJobTitleError('Job title is required.');
      return;
    }
    try {
      const created = await createApplication(buildPayload()).unwrap();
      navigate(`/applications/${created.id}`);
    } catch {
      // Error surfaced via the `error` state below.
    }
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
          <Link to="/" className="text-lg font-bold text-slate-900">
            JobFit <span className="text-indigo-600">Resume AI</span>
          </Link>
          <Link to="/applications" className="text-sm font-medium text-indigo-600 hover:text-indigo-700">
            All applications
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-6 px-6 py-10">
        <h1 className="text-2xl font-bold text-slate-900">New application</h1>

        <Card>
          <div className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField label="Company name" value={form.companyName} onChange={(v) => set('companyName', v)} placeholder="Acme Inc." />
              <div>
                <TextField label="Job title" value={form.jobTitle} onChange={(v) => { set('jobTitle', v); setJobTitleError(undefined); }} placeholder="Senior Frontend Engineer" required />
                {jobTitleError && <p className="mt-1 text-sm text-red-600">{jobTitleError}</p>}
              </div>
              <TextField label="Job URL" value={form.jobUrl} onChange={(v) => set('jobUrl', v)} placeholder="https://…" />
              <TextField label="Source" value={form.source} onChange={(v) => set('source', v)} placeholder="LinkedIn, referral…" />
              <SelectField label="Status" value={form.status} onChange={(v) => set('status', v as ApplicationStatus)} options={STATUS_OPTIONS} />
              <SelectField label="Remote type" value={form.remoteType} onChange={(v) => set('remoteType', v)} placeholder="—" options={toOptions(REMOTE_TYPE_OPTIONS)} />
              <SelectField label="Contract type" value={form.contractType} onChange={(v) => set('contractType', v)} placeholder="—" options={toOptions(CONTRACT_TYPE_OPTIONS)} />
              <TextField label="Currency" value={form.currency} onChange={(v) => set('currency', v)} placeholder="USD" />
              <TextField label="Salary min" type="number" value={form.salaryMin} onChange={(v) => set('salaryMin', v)} placeholder="80000" />
              <TextField label="Salary max" type="number" value={form.salaryMax} onChange={(v) => set('salaryMax', v)} placeholder="120000" />
            </div>

            <Textarea label="Job description" rows={5} value={form.jobDescription} onChange={(e) => set('jobDescription', e.target.value)} placeholder="Paste the job description (optional)" />
            <Textarea label="Notes" rows={3} value={form.notes} onChange={(e) => set('notes', e.target.value)} placeholder="Anything to remember about this role" />
          </div>
        </Card>

        {duplicates && !dupDismissed && (
          <DuplicateWarning
            result={duplicates}
            companyName={form.companyName.trim() || undefined}
            onDismiss={() => setDupDismissed(true)}
          />
        )}

        {error && (
          <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700 ring-1 ring-red-200">
            {extractErrorMessage(error)}
          </div>
        )}

        <div className="flex gap-3">
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? 'Creating…' : 'Create application'}
          </Button>
          <Link
            to="/applications"
            className="inline-flex items-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </Link>
        </div>
      </main>
    </div>
  );
}
