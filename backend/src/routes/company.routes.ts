import { Router } from 'express';
import {
  deleteCompanyHandler,
  getCompanies,
  getCompany,
  patchCompany,
  postCompany,
} from '../controllers/company.controller';
import { asyncHandler } from '../utils/errors';

export const companyRoutes = Router();

companyRoutes.get('/', asyncHandler(getCompanies));
companyRoutes.post('/', asyncHandler(postCompany));
companyRoutes.get('/:id', asyncHandler(getCompany));
companyRoutes.patch('/:id', asyncHandler(patchCompany));
companyRoutes.delete('/:id', asyncHandler(deleteCompanyHandler));
