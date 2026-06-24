import { useState } from 'react';
import { Button } from '../../../components/Button';
import { Card } from '../../../components/Card';
import { useCreateEventMutation } from '../api/trackerApi';
import { formatDateTime, humanize } from '../format';
import type { ApplicationEvent } from '../types/tracker.types';
import { TextField } from './fields';

interface Props {
  applicationId: string;
  events: ApplicationEvent[];
}

export function ApplicationTimeline({ applicationId, events }: Props) {
  const [type, setType] = useState('');
  const [notes, setNotes] = useState('');
  const [createEvent, { isLoading }] = useCreateEventMutation();

  async function handleAdd() {
    if (!type.trim()) return;
    await createEvent({ applicationId, body: { type: type.trim(), notes: notes.trim() || undefined } });
    setType('');
    setNotes('');
  }

  return (
    <Card title="Timeline" subtitle="Status changes and notes, most recent first.">
      {events.length === 0 ? (
        <p className="text-sm text-slate-500">No events yet.</p>
      ) : (
        <ol className="space-y-3">
          {events.map((event) => (
            <li key={event.id} className="flex gap-3">
              <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-indigo-400" />
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-900">{humanize(event.type)}</p>
                {event.notes && <p className="text-sm text-slate-600">{event.notes}</p>}
                <p className="text-xs text-slate-400">{formatDateTime(event.occurredAt)}</p>
              </div>
            </li>
          ))}
        </ol>
      )}

      <div className="mt-5 grid gap-3 border-t border-slate-100 pt-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
        <TextField label="Event type" value={type} onChange={setType} placeholder="e.g. interview_scheduled" />
        <TextField label="Notes (optional)" value={notes} onChange={setNotes} placeholder="Details" />
        <Button variant="secondary" onClick={handleAdd} disabled={isLoading || !type.trim()}>
          {isLoading ? 'Adding…' : 'Add event'}
        </Button>
      </div>
    </Card>
  );
}
