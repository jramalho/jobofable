import { Request, Response } from 'express';
import { idParamSchema } from '../schemas/common.schema';
import {
  checkDuplicatesBodySchema,
  createApplicationBodySchema,
  updateApplicationBodySchema,
} from '../schemas/application.schema';
import { createApplicationEventBodySchema } from '../schemas/applicationEvent.schema';
import {
  checkDuplicates,
  createApplication,
  createApplicationEvent,
  deleteApplication,
  getApplicationById,
  listApplicationEvents,
  listApplications,
  updateApplication,
} from '../services/application.service';
import { NotFoundError } from '../utils/errors';
import { parseOrThrow } from '../utils/validate';

export async function getApplications(_req: Request, res: Response): Promise<void> {
  res.status(200).json({ applications: await listApplications() });
}

export async function postCheckDuplicates(req: Request, res: Response): Promise<void> {
  const body = parseOrThrow(checkDuplicatesBodySchema, req.body, 'Invalid duplicate-check payload.');
  res.status(200).json(await checkDuplicates(body));
}

export async function getApplication(req: Request, res: Response): Promise<void> {
  const { id } = parseOrThrow(idParamSchema, req.params, 'Invalid application id.');
  const application = await getApplicationById(id);
  if (!application) throw new NotFoundError(`Application "${id}" was not found.`);
  res.status(200).json(application);
}

export async function postApplication(req: Request, res: Response): Promise<void> {
  const body = parseOrThrow(createApplicationBodySchema, req.body, 'Invalid application payload.');
  res.status(201).json(await createApplication(body));
}

export async function patchApplication(req: Request, res: Response): Promise<void> {
  const { id } = parseOrThrow(idParamSchema, req.params, 'Invalid application id.');
  const body = parseOrThrow(updateApplicationBodySchema, req.body, 'Invalid application payload.');
  const updated = await updateApplication(id, body);
  if (!updated) throw new NotFoundError(`Application "${id}" was not found.`);
  res.status(200).json(updated);
}

export async function deleteApplicationHandler(req: Request, res: Response): Promise<void> {
  const { id } = parseOrThrow(idParamSchema, req.params, 'Invalid application id.');
  if (!(await deleteApplication(id))) throw new NotFoundError(`Application "${id}" was not found.`);
  res.status(204).send();
}

export async function getApplicationEvents(req: Request, res: Response): Promise<void> {
  const { id } = parseOrThrow(idParamSchema, req.params, 'Invalid application id.');
  const events = await listApplicationEvents(id);
  if (events === null) throw new NotFoundError(`Application "${id}" was not found.`);
  res.status(200).json({ events });
}

export async function postApplicationEvent(req: Request, res: Response): Promise<void> {
  const { id } = parseOrThrow(idParamSchema, req.params, 'Invalid application id.');
  const body = parseOrThrow(createApplicationEventBodySchema, req.body, 'Invalid event payload.');
  const event = await createApplicationEvent(id, body);
  if (!event) throw new NotFoundError(`Application "${id}" was not found.`);
  res.status(201).json(event);
}
