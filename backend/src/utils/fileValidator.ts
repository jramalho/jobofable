import { ValidationError } from './errors';

export type SupportedFileType = 'pdf' | 'docx';

const PDF_MIME_TYPES = ['application/pdf'];
const DOCX_MIME_TYPES = [
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

export const ACCEPTED_MIME_TYPES = [...PDF_MIME_TYPES, ...DOCX_MIME_TYPES];

export function detectFileType(file: Express.Multer.File): SupportedFileType {
  const extension = file.originalname.toLowerCase().split('.').pop() ?? '';

  if (PDF_MIME_TYPES.includes(file.mimetype) && extension === 'pdf') return 'pdf';
  if (DOCX_MIME_TYPES.includes(file.mimetype) && extension === 'docx') return 'docx';

  // Some browsers send octet-stream; fall back to extension + magic bytes
  if (extension === 'pdf' && file.buffer.subarray(0, 4).toString() === '%PDF') return 'pdf';
  if (extension === 'docx' && file.buffer[0] === 0x50 && file.buffer[1] === 0x4b) return 'docx';

  throw new ValidationError(
    `Unsupported file "${file.originalname}". Only PDF and DOCX files are accepted.`,
  );
}

export function assertPdf(file: Express.Multer.File, fieldLabel: string): void {
  if (detectFileType(file) !== 'pdf') {
    throw new ValidationError(`${fieldLabel} must be a PDF file.`);
  }
}
