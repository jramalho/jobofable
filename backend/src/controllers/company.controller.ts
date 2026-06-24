import { Request, Response } from 'express';
import { idParamSchema } from '../schemas/common.schema';
import { createCompanyBodySchema, updateCompanyBodySchema } from '../schemas/company.schema';
import {
  createCompany,
  deleteCompany,
  getCompanyById,
  listCompanies,
  updateCompany,
} from '../services/company.service';
import { NotFoundError } from '../utils/errors';
import { parseOrThrow } from '../utils/validate';

export async function getCompanies(_req: Request, res: Response): Promise<void> {
  res.status(200).json({ companies: await listCompanies() });
}

export async function getCompany(req: Request, res: Response): Promise<void> {
  const { id } = parseOrThrow(idParamSchema, req.params, 'Invalid company id.');
  const company = await getCompanyById(id);
  if (!company) throw new NotFoundError(`Company "${id}" was not found.`);
  res.status(200).json(company);
}

export async function postCompany(req: Request, res: Response): Promise<void> {
  const body = parseOrThrow(createCompanyBodySchema, req.body, 'Invalid company payload.');
  res.status(201).json(await createCompany(body));
}

export async function patchCompany(req: Request, res: Response): Promise<void> {
  const { id } = parseOrThrow(idParamSchema, req.params, 'Invalid company id.');
  const body = parseOrThrow(updateCompanyBodySchema, req.body, 'Invalid company payload.');
  const updated = await updateCompany(id, body);
  if (!updated) throw new NotFoundError(`Company "${id}" was not found.`);
  res.status(200).json(updated);
}

export async function deleteCompanyHandler(req: Request, res: Response): Promise<void> {
  const { id } = parseOrThrow(idParamSchema, req.params, 'Invalid company id.');
  if (!(await deleteCompany(id))) throw new NotFoundError(`Company "${id}" was not found.`);
  res.status(204).send();
}
