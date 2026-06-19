import { Router } from 'express';
import { deleteContactHandler, patchContact } from '../controllers/contact.controller';
import { asyncHandler } from '../utils/errors';

export const contactRoutes = Router();

contactRoutes.patch('/:id', asyncHandler(patchContact));
contactRoutes.delete('/:id', asyncHandler(deleteContactHandler));
