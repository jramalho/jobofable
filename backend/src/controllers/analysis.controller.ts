import { Request, Response } from 'express';
import { AIProviderFactory } from '../providers/ai/AIProviderFactory';
import {
  applyKeywordsBodySchema,
  createAnalysisBodySchema,
  SavedResumeProfile,
  savedResumeProfileSchema,
} from '../schemas/analysis.schema';
import { runAnalysis } from '../services/analysis.service';
import { applyKeywordsToResume } from '../services/resume.service';
import { ValidationError } from '../utils/errors';

export async function createAnalysis(req: Request, res: Response): Promise<void> {
  const files = req.files as Record<string, Express.Multer.File[]> | undefined;
  const resumeFile = files?.resumeFile?.[0];
  const linkedInFile = files?.linkedInFile?.[0];

  const parsedBody = createAnalysisBodySchema.safeParse(req.body);
  if (!parsedBody.success) {
    throw new ValidationError(
      parsedBody.error.issues[0]?.message ?? 'Invalid request.',
      parsedBody.error.flatten(),
    );
  }

  const savedProfile = parseSavedProfile(req.body.savedProfile);

  // The resume can come either as an uploaded file or as a cached, already
  // analyzed profile — but at least one of the two is required.
  if (!resumeFile && !savedProfile) {
    throw new ValidationError(
      'Resume is required. Upload your current resume (PDF or DOCX) or use a saved profile.',
    );
  }

  const result = await runAnalysis({
    body: parsedBody.data,
    resumeFile,
    savedProfile,
    linkedInFile,
  });

  res.status(201).json(result);
}

function parseSavedProfile(raw: unknown): SavedResumeProfile | undefined {
  if (typeof raw !== 'string' || raw.trim() === '') return undefined;

  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    throw new ValidationError('Saved profile is not valid JSON. Upload your resume file instead.');
  }

  const parsed = savedResumeProfileSchema.safeParse(json);
  if (!parsed.success) {
    throw new ValidationError(
      'Saved profile is invalid or outdated. Upload your resume file to refresh it.',
      parsed.error.flatten(),
    );
  }
  return parsed.data;
}

export async function applyKeywords(req: Request, res: Response): Promise<void> {
  const parsed = applyKeywordsBodySchema.safeParse(req.body);
  if (!parsed.success) {
    throw new ValidationError(
      parsed.error.issues[0]?.message ?? 'Invalid request.',
      parsed.error.flatten(),
    );
  }

  const provider = AIProviderFactory.create(parsed.data.aiProvider);
  console.log(
    `[apply-keywords] provider=${provider.name} keywords=${parsed.data.selections.map((s) => s.keyword).join(', ')}`,
  );

  const result = await applyKeywordsToResume(provider, {
    resume: parsed.data.resume,
    jobTitle: parsed.data.jobTitle,
    selections: parsed.data.selections,
  });

  res.status(200).json(result);
}
