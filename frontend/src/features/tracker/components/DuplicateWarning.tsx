import { Link } from 'react-router-dom';
import { STATUS_LABELS } from '../constants';
import { formatDate } from '../format';
import type { DuplicateCheckResult } from '../types/tracker.types';

interface Props {
  result: DuplicateCheckResult;
  /** Used to personalize the company-only message. */
  companyName?: string;
  onDismiss?: () => void;
}

/**
 * Advisory (never blocking) warning that the user may have already applied to
 * this company or job. Each match explains *why* it was flagged.
 */
export function DuplicateWarning({ result, companyName, onDismiss }: Props) {
  const matches = result.possibleDuplicateApplications;
  if (matches.length === 0 && !result.possibleDuplicateCompany) return null;

  return (
    <div className="rounded-xl border border-amber-300 bg-amber-50 p-4">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-semibold text-amber-900">
          {matches.length > 0
            ? `Possible duplicate${matches.length > 1 ? 's' : ''}`
            : 'You’ve tracked this company before'}
        </p>
        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            className="text-sm font-medium text-amber-700 hover:text-amber-900"
          >
            Dismiss
          </button>
        )}
      </div>

      {matches.length > 0 ? (
        <ul className="mt-2 space-y-2">
          {matches.map((match) => (
            <li
              key={match.id}
              className="flex items-start justify-between gap-3 rounded-lg border border-amber-200 bg-white p-3"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-slate-900">
                  {match.companyName ?? 'Unknown company'} — {match.jobTitle}
                </p>
                <p className="text-xs text-amber-700">{match.matchReason}</p>
                <p className="text-xs text-slate-400">
                  {STATUS_LABELS[match.status] ?? match.status}
                  {match.appliedAt ? ` · applied ${formatDate(match.appliedAt)}` : ''}
                </p>
              </div>
              <Link
                to={`/applications/${match.id}`}
                className="shrink-0 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Open
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-1 text-sm text-amber-800">
          You’ve already tracked applications{companyName ? ` at ${companyName}` : ''}. Double-check
          before adding another.
        </p>
      )}

      <p className="mt-2 text-xs text-amber-700">This is just a heads-up — you can continue anyway.</p>
    </div>
  );
}
