import { useState } from 'react';
import { Button } from '../../../components/Button';
import { Card } from '../../../components/Card';
import {
  useCreateFollowUpMutation,
  useDeleteFollowUpMutation,
  useUpdateFollowUpMutation,
} from '../api/trackerApi';
import { formatDate } from '../format';
import type { FollowUpTask } from '../types/tracker.types';
import { TextField } from './fields';

interface Props {
  applicationId: string;
  followUps: FollowUpTask[];
}

export function FollowUpSection({ applicationId, followUps }: Props) {
  const [title, setTitle] = useState('');
  const [dueAt, setDueAt] = useState('');
  const [createFollowUp, { isLoading: isCreating }] = useCreateFollowUpMutation();
  const [updateFollowUp] = useUpdateFollowUpMutation();
  const [deleteFollowUp] = useDeleteFollowUpMutation();

  async function handleAdd() {
    if (!title.trim() || !dueAt) return;
    await createFollowUp({
      applicationId,
      body: { title: title.trim(), dueAt: new Date(dueAt).toISOString() },
    });
    setTitle('');
    setDueAt('');
  }

  return (
    <Card title="Follow-ups" subtitle="Reminders to chase this application.">
      {followUps.length === 0 ? (
        <p className="text-sm text-slate-500">No follow-ups yet.</p>
      ) : (
        <ul className="space-y-2">
          {followUps.map((task) => {
            const done = task.status === 'completed';
            return (
              <li
                key={task.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 px-3 py-2"
              >
                <div className="min-w-0">
                  <p className={`truncate text-sm ${done ? 'text-slate-400 line-through' : 'text-slate-900'}`}>
                    {task.title}
                  </p>
                  <p className="text-xs text-slate-400">
                    Due {formatDate(task.dueAt)}
                    {done ? ` · completed ${formatDate(task.completedAt)}` : ''}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {!done && (
                    <Button
                      variant="secondary"
                      onClick={() =>
                        updateFollowUp({ id: task.id, applicationId, body: { status: 'completed' } })
                      }
                    >
                      Done
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    className="text-red-600 hover:bg-red-50"
                    onClick={() => deleteFollowUp({ id: task.id, applicationId })}
                  >
                    Delete
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <div className="mt-5 grid gap-3 border-t border-slate-100 pt-4 sm:grid-cols-[1fr_auto_auto] sm:items-end">
        <TextField label="New follow-up" value={title} onChange={setTitle} placeholder="e.g. Email recruiter" />
        <TextField label="Due date" type="date" value={dueAt} onChange={setDueAt} />
        <Button variant="secondary" onClick={handleAdd} disabled={isCreating || !title.trim() || !dueAt}>
          {isCreating ? 'Adding…' : 'Add'}
        </Button>
      </div>
    </Card>
  );
}
