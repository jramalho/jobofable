import { Router } from 'express';
import {
  deleteApplicationHandler,
  getApplication,
  getApplicationEvents,
  getApplications,
  patchApplication,
  postApplication,
  postApplicationEvent,
  postCheckDuplicates,
} from '../controllers/application.controller';
import {
  getApplicationContacts,
  postApplicationContact,
} from '../controllers/contact.controller';
import { postApplicationFollowUp } from '../controllers/followUp.controller';
import { asyncHandler } from '../utils/errors';

export const applicationRoutes = Router();

// Deterministic duplicate detection — declared before '/:id' routes (literal
// single-segment path, so it is never captured by a param route).
applicationRoutes.post('/check-duplicates', asyncHandler(postCheckDuplicates));

applicationRoutes.get('/', asyncHandler(getApplications));
applicationRoutes.post('/', asyncHandler(postApplication));
applicationRoutes.get('/:id', asyncHandler(getApplication));
applicationRoutes.patch('/:id', asyncHandler(patchApplication));
applicationRoutes.delete('/:id', asyncHandler(deleteApplicationHandler));

// Application-scoped sub-resources.
applicationRoutes.get('/:id/events', asyncHandler(getApplicationEvents));
applicationRoutes.post('/:id/events', asyncHandler(postApplicationEvent));
applicationRoutes.get('/:id/contacts', asyncHandler(getApplicationContacts));
applicationRoutes.post('/:id/contacts', asyncHandler(postApplicationContact));
applicationRoutes.post('/:id/follow-ups', asyncHandler(postApplicationFollowUp));
