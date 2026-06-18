import { Router } from 'express';
import {
  exportCoverLetterDocx,
  exportCoverLetterPdf,
  exportResumeDocx,
  exportResumePdf,
} from '../controllers/export.controller';
import { asyncHandler } from '../utils/errors';

export const exportRoutes = Router();

exportRoutes.post('/resume/pdf', asyncHandler(exportResumePdf));
exportRoutes.post('/resume/docx', asyncHandler(exportResumeDocx));
exportRoutes.post('/cover-letter/pdf', asyncHandler(exportCoverLetterPdf));
exportRoutes.post('/cover-letter/docx', asyncHandler(exportCoverLetterDocx));
