import { useState } from 'react';
import { Button } from '../../../components/Button';
import { Card } from '../../../components/Card';
import { useCreateContactMutation, useDeleteContactMutation } from '../api/trackerApi';
import type { Contact } from '../types/tracker.types';
import { TextField } from './fields';

interface Props {
  applicationId: string;
  contacts: Contact[];
}

export function ContactsSection({ applicationId, contacts }: Props) {
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [email, setEmail] = useState('');
  const [createContact, { isLoading }] = useCreateContactMutation();
  const [deleteContact] = useDeleteContactMutation();

  async function handleAdd() {
    if (!name.trim()) return;
    await createContact({
      applicationId,
      body: { name: name.trim(), role: role.trim() || undefined, email: email.trim() || undefined },
    });
    setName('');
    setRole('');
    setEmail('');
  }

  return (
    <Card title="Contacts" subtitle="People you've spoken to about this role.">
      {contacts.length === 0 ? (
        <p className="text-sm text-slate-500">No contacts yet.</p>
      ) : (
        <ul className="space-y-2">
          {contacts.map((contact) => (
            <li
              key={contact.id}
              className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 px-3 py-2"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-slate-900">
                  {contact.name}
                  {contact.role ? <span className="font-normal text-slate-500"> · {contact.role}</span> : ''}
                </p>
                <div className="flex flex-wrap gap-x-3 text-xs text-slate-500">
                  {contact.email && <a href={`mailto:${contact.email}`} className="hover:text-indigo-600">{contact.email}</a>}
                  {contact.linkedInUrl && (
                    <a href={contact.linkedInUrl} target="_blank" rel="noreferrer" className="hover:text-indigo-600">
                      LinkedIn
                    </a>
                  )}
                </div>
              </div>
              <Button
                variant="ghost"
                className="shrink-0 text-red-600 hover:bg-red-50"
                onClick={() => deleteContact({ id: contact.id, applicationId })}
              >
                Delete
              </Button>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-5 grid gap-3 border-t border-slate-100 pt-4 sm:grid-cols-3 sm:items-end">
        <TextField label="Name" value={name} onChange={setName} placeholder="Jane Recruiter" />
        <TextField label="Role (optional)" value={role} onChange={setRole} placeholder="Recruiter" />
        <TextField label="Email (optional)" value={email} onChange={setEmail} type="email" placeholder="jane@co.com" />
      </div>
      <div className="mt-3">
        <Button variant="secondary" onClick={handleAdd} disabled={isLoading || !name.trim()}>
          {isLoading ? 'Adding…' : 'Add contact'}
        </Button>
      </div>
    </Card>
  );
}
