import { Router } from 'express';
import { searchJobs } from '../controllers/jobSearch.controller';
import { asyncHandler } from '../utils/errors';

export const jobSearchRoutes = Router();

jobSearchRoutes.post('/search', asyncHandler(searchJobs));
