import { Request, Response } from 'express';
import { idParamSchema } from '../schemas/common.schema';
import {
  createFollowUpBodySchema,
  listFollowUpsQuerySchema,
  updateFollowUpBodySchema,
} from '../schemas/followUp.schema';
import {
  createFollowUp,
  deleteFollowUp,
  listFollowUps,
  updateFollowUp,
} from '../services/followUp.service';
import { NotFoundError } from '../utils/errors';
import { parseOrThrow } from '../utils/validate';

export async function getFollowUps(req: Request, res: Response): Promise<void> {
  const query = parseOrThrow(listFollowUpsQuerySchema, req.query, 'Invalid follow-up filters.');
  res.status(200).json({ followUps: await listFollowUps(query) });
}

// Nested under /applications/:id/follow-ups — :id is the application id.
export async function postApplicationFollowUp(req: Request, res: Response): Promise<void> {
  const { id } = parseOrThrow(idParamSchema, req.params, 'Invalid application id.');
  const body = parseOrThrow(createFollowUpBodySchema, req.body, 'Invalid follow-up payload.');
  const followUp = await createFollowUp(id, body);
  if (!followUp) throw new NotFoundError(`Application "${id}" was not found.`);
  res.status(201).json(followUp);
}

// Top-level /follow-ups/:id — :id is the follow-up id.
export async function patchFollowUp(req: Request, res: Response): Promise<void> {
  const { id } = parseOrThrow(idParamSchema, req.params, 'Invalid follow-up id.');
  const body = parseOrThrow(updateFollowUpBodySchema, req.body, 'Invalid follow-up payload.');
  const updated = await updateFollowUp(id, body);
  if (!updated) throw new NotFoundError(`Follow-up "${id}" was not found.`);
  res.status(200).json(updated);
}

export async function deleteFollowUpHandler(req: Request, res: Response): Promise<void> {
  const { id } = parseOrThrow(idParamSchema, req.params, 'Invalid follow-up id.');
  if (!(await deleteFollowUp(id))) throw new NotFoundError(`Follow-up "${id}" was not found.`);
  res.status(204).send();
}
