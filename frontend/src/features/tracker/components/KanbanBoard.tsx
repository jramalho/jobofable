import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUpdateApplicationMutation } from '../api/trackerApi';
import { STATUS_OPTIONS } from '../constants';
import { formatDate } from '../format';
import type { ApplicationListItem, ApplicationStatus } from '../types/tracker.types';

/** A status is overdue when its follow-up date is before today. */
function isOverdue(iso: string | null): boolean {
  if (!iso) return false;
  const due = new Date(iso);
  if (Number.isNaN(due.getTime())) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return due < today;
}

/**
 * Kanban board with one column per application status. Drag-and-drop uses the
 * native HTML5 API (no dependency); dropping a card onto another column PATCHes
 * its status, and the list cache updates optimistically (see trackerApi).
 */
export function KanbanBoard({ applications }: { applications: ApplicationListItem[] }) {
  const navigate = useNavigate();
  const [updateApplication] = useUpdateApplicationMutation();
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [overColumn, setOverColumn] = useState<string | null>(null);

  function handleDrop(status: ApplicationStatus) {
    const id = draggingId;
    setDraggingId(null);
    setOverColumn(null);
    if (!id) return;
    const app = applications.find((item) => item.id === id);
    if (!app || app.status === status) return;
    updateApplication({ id, body: { status } });
  }

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {STATUS_OPTIONS.map((column) => {
        const cards = applications.filter((app) => app.status === column.value);
        const isOver = overColumn === column.value;
        return (
          <section
            key={column.value}
            onDragOver={(event) => {
              event.preventDefault();
              if (!isOver) setOverColumn(column.value);
            }}
            onDragLeave={() => setOverColumn((current) => (current === column.value ? null : current))}
            onDrop={() => handleDrop(column.value as ApplicationStatus)}
            className={`flex w-72 shrink-0 flex-col rounded-xl border p-3 transition-colors ${
              isOver ? 'border-indigo-400 bg-indigo-50' : 'border-slate-200 bg-slate-50'
            }`}
          >
            <div className="mb-2 flex items-center justify-between px-1">
              <span className="text-sm font-semibold text-slate-700">{column.label}</span>
              <span className="rounded-full bg-white px-2 text-xs text-slate-500">{cards.length}</span>
            </div>

            <div className="flex min-h-[2rem] flex-col gap-2">
              {cards.map((app) => {
                const overdue = isOverdue(app.nextFollowUpAt);
                return (
                  <article
                    key={app.id}
                    draggable
                    onDragStart={() => setDraggingId(app.id)}
                    onDragEnd={() => {
                      setDraggingId(null);
                      setOverColumn(null);
                    }}
                    onClick={() => navigate(`/applications/${app.id}`)}
                    className={`cursor-pointer rounded-lg border border-slate-200 bg-white p-3 shadow-sm hover:border-indigo-300 ${
                      draggingId === app.id ? 'opacity-50' : ''
                    }`}
                  >
                    <p className="truncate text-sm font-semibold text-slate-900">
                      {app.company?.name ?? 'Unknown company'}
                    </p>
                    <p className="truncate text-sm text-slate-600">{app.jobTitle}</p>
                    <div className="mt-1.5 flex flex-wrap gap-x-2 gap-y-1 text-xs text-slate-400">
                      {app.matchScore !== null && (
                        <span className="font-medium text-slate-500">Match {app.matchScore}</span>
                      )}
                      {app.source && <span>{app.source}</span>}
                      {app.appliedAt && <span>Applied {formatDate(app.appliedAt)}</span>}
                    </div>
                    {app.nextFollowUpAt && (
                      <span
                        className={`mt-2 inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                          overdue ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                        }`}
                      >
                        {overdue ? 'Overdue' : 'Follow-up'} {formatDate(app.nextFollowUpAt)}
                      </span>
                    )}
                  </article>
                );
              })}
              {cards.length === 0 && <p className="px-1 py-3 text-center text-xs text-slate-300">Drop here</p>}
            </div>
          </section>
        );
      })}
    </div>
  );
}
