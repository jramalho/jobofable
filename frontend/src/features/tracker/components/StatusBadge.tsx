import { STATUS_BADGE_CLASSES, STATUS_LABELS } from '../constants';
import type { ApplicationStatus } from '../types/tracker.types';

export function StatusBadge({ status }: { status: ApplicationStatus }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_BADGE_CLASSES[status]}`}
    >
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}
