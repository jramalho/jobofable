import { Request, Response } from 'express';
import { exportCoverLetterBodySchema, exportResumeBodySchema } from '../schemas/export.schema';
import {
  buildCoverLetterDocx,
  buildCoverLetterPdf,
  buildResumeDocx,
  buildResumePdf,
} from '../services/export.service';
import { ValidationError } from '../utils/errors';
import { buildExportFilename } from '../utils/exportFilename';

const PDF_MIME = 'application/pdf';
const DOCX_MIME = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

export async function exportResumePdf(req: Request, res: Response): Promise<void> {
  const body = parseResumeBody(req);
  const buffer = await buildResumePdf(body);
  sendFile(res, buffer, resumeFilename(body, 'pdf'), PDF_MIME);
}

export async function exportResumeDocx(req: Request, res: Response): Promise<void> {
  const body = parseResumeBody(req);
  const buffer = await buildResumeDocx(body);
  sendFile(res, buffer, resumeFilename(body, 'docx'), DOCX_MIME);
}

export async function exportCoverLetterPdf(req: Request, res: Response): Promise<void> {
  const body = parseCoverLetterBody(req);
  const buffer = await buildCoverLetterPdf(body);
  sendFile(res, buffer, coverLetterFilename(body, 'pdf'), PDF_MIME);
}

export async function exportCoverLetterDocx(req: Request, res: Response): Promise<void> {
  const body = parseCoverLetterBody(req);
  const buffer = await buildCoverLetterDocx(body);
  sendFile(res, buffer, coverLetterFilename(body, 'docx'), DOCX_MIME);
}

function resumeFilename(body: { resume: { header: { name?: string } }; candidateName?: string; companyName?: string }, ext: string): string {
  const name = body.resume.header.name ?? body.candidateName;
  return buildExportFilename([name, body.companyName], ext, 'optimized-resume');
}

function coverLetterFilename(body: { candidateName?: string; companyName?: string }, ext: string): string {
  return buildExportFilename([body.candidateName, body.companyName, 'cover-letter'], ext, 'cover-letter');
}

function parseResumeBody(req: Request) {
  const parsed = exportResumeBodySchema.safeParse(req.body);
  if (!parsed.success) {
    throw new ValidationError('Invalid resume payload for export.', parsed.error.flatten());
  }
  return parsed.data;
}

function parseCoverLetterBody(req: Request) {
  const parsed = exportCoverLetterBodySchema.safeParse(req.body);
  if (!parsed.success) {
    throw new ValidationError('Invalid cover letter payload for export.', parsed.error.flatten());
  }
  return parsed.data;
}

function sendFile(res: Response, buffer: Buffer, filename: string, mimeType: string): void {
  res.setHeader('Content-Type', mimeType);
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.setHeader('Content-Length', buffer.length);
  res.status(200).send(buffer);
}
