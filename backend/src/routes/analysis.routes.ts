import { Router } from 'express';
import multer from 'multer';
import { applyKeywords, createAnalysis } from '../controllers/analysis.controller';
import { ACCEPTED_MIME_TYPES } from '../utils/fileValidator';
import { asyncHandler, ValidationError } from '../utils/errors';

const MAX_FILE_SIZE_MB = Number(process.env.MAX_FILE_SIZE_MB ?? 5);

// Files are kept in memory only — the MVP never persists uploads to disk.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE_MB * 1024 * 1024, files: 2 },
  fileFilter: (_req, file, callback) => {
    const extension = file.originalname.toLowerCase().split('.').pop() ?? '';
    const extensionOk = ['pdf', 'docx'].includes(extension);
    const mimeOk = ACCEPTED_MIME_TYPES.includes(file.mimetype) || file.mimetype === 'application/octet-stream';
    if (extensionOk && mimeOk) {
      callback(null, true);
    } else {
      callback(new ValidationError(`"${file.originalname}" is not supported. Only PDF and DOCX files are accepted.`));
    }
  },
});

export const analysisRoutes = Router();

analysisRoutes.post(
  '/',
  upload.fields([
    { name: 'resumeFile', maxCount: 1 },
    { name: 'linkedInFile', maxCount: 1 },
  ]),
  asyncHandler(createAnalysis),
);

// Second AI round: weave user-selected missing keywords into the chosen
// targets of the current (edited) resume. JSON body, no file upload.
analysisRoutes.post('/keywords', asyncHandler(applyKeywords));
