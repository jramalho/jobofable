import { Router } from 'express';
import {
  deleteFollowUpHandler,
  getFollowUps,
  patchFollowUp,
} from '../controllers/followUp.controller';
import { asyncHandler } from '../utils/errors';

export const followUpRoutes = Router();

followUpRoutes.get('/', asyncHandler(getFollowUps));
followUpRoutes.patch('/:id', asyncHandler(patchFollowUp));
followUpRoutes.delete('/:id', asyncHandler(deleteFollowUpHandler));
