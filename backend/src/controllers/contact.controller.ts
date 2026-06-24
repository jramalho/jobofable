import { Request, Response } from 'express';
import { idParamSchema } from '../schemas/common.schema';
import { createContactBodySchema, updateContactBodySchema } from '../schemas/contact.schema';
import {
  createContact,
  deleteContact,
  listContacts,
  updateContact,
} from '../services/contact.service';
import { NotFoundError } from '../utils/errors';
import { parseOrThrow } from '../utils/validate';

// Nested under /applications/:id/contacts — :id is the application id.
export async function getApplicationContacts(req: Request, res: Response): Promise<void> {
  const { id } = parseOrThrow(idParamSchema, req.params, 'Invalid application id.');
  const contacts = await listContacts(id);
  if (contacts === null) throw new NotFoundError(`Application "${id}" was not found.`);
  res.status(200).json({ contacts });
}

export async function postApplicationContact(req: Request, res: Response): Promise<void> {
  const { id } = parseOrThrow(idParamSchema, req.params, 'Invalid application id.');
  const body = parseOrThrow(createContactBodySchema, req.body, 'Invalid contact payload.');
  const contact = await createContact(id, body);
  if (!contact) throw new NotFoundError(`Application "${id}" was not found.`);
  res.status(201).json(contact);
}

// Top-level /contacts/:id — :id is the contact id.
export async function patchContact(req: Request, res: Response): Promise<void> {
  const { id } = parseOrThrow(idParamSchema, req.params, 'Invalid contact id.');
  const body = parseOrThrow(updateContactBodySchema, req.body, 'Invalid contact payload.');
  const updated = await updateContact(id, body);
  if (!updated) throw new NotFoundError(`Contact "${id}" was not found.`);
  res.status(200).json(updated);
}

export async function deleteContactHandler(req: Request, res: Response): Promise<void> {
  const { id } = parseOrThrow(idParamSchema, req.params, 'Invalid contact id.');
  if (!(await deleteContact(id))) throw new NotFoundError(`Contact "${id}" was not found.`);
  res.status(204).send();
}
