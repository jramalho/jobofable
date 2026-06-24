import type { ApplicationStatus } from './types/tracker.types';

export const STATUS_OPTIONS: { value: ApplicationStatus; label: string }[] = [
  { value: 'saved', label: 'Saved' },
  { value: 'applied', label: 'Applied' },
  { value: 'recruiter_screen', label: 'Recruiter screen' },
  { value: 'technical_interview', label: 'Technical interview' },
  { value: 'assignment', label: 'Assignment' },
  { value: 'final_interview', label: 'Final interview' },
  { value: 'offer', label: 'Offer' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'ghosted', label: 'Ghosted' },
  { value: 'withdrawn', label: 'Withdrawn' },
];

export const STATUS_LABELS: Record<ApplicationStatus, string> = Object.fromEntries(
  STATUS_OPTIONS.map((option) => [option.value, option.label]),
) as Record<ApplicationStatus, string>;

export const STATUS_BADGE_CLASSES: Record<ApplicationStatus, string> = {
  saved: 'bg-slate-100 text-slate-700',
  applied: 'bg-indigo-100 text-indigo-700',
  recruiter_screen: 'bg-sky-100 text-sky-700',
  technical_interview: 'bg-violet-100 text-violet-700',
  assignment: 'bg-amber-100 text-amber-700',
  final_interview: 'bg-blue-100 text-blue-700',
  offer: 'bg-emerald-100 text-emerald-700',
  rejected: 'bg-red-100 text-red-700',
  ghosted: 'bg-zinc-200 text-zinc-600',
  withdrawn: 'bg-slate-200 text-slate-600',
};

export const REMOTE_TYPE_OPTIONS = ['remote', 'hybrid', 'onsite'];
export const CONTRACT_TYPE_OPTIONS = ['full_time', 'part_time', 'contract', 'internship', 'temporary'];
