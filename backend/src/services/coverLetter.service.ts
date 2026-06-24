import { AIProvider } from '../providers/ai/AIProvider';
import {
  GENERATE_COVER_LETTER_SCHEMA_HINT,
  GENERATE_COVER_LETTER_SYSTEM_PROMPT,
  buildGenerateCoverLetterPrompt,
} from '../prompts/generateCoverLetter.prompt';
import {
  Comparison,
  CoverLetterTone,
  JobAnalysis,
  LinkedInAnalysis,
  ResumeAnalysis,
} from '../schemas/analysis.schema';
import { CoverLetterMeta, coverLetterGenerationSchema } from '../schemas/coverLetter.schema';
import { removeProseDashes } from '../utils/proseText';
import { AIProviderError } from '../utils/errors';

export interface GenerateCoverLetterInput {
  job: JobAnalysis;
  resume: ResumeAnalysis;
  linkedIn?: LinkedInAnalysis;
  comparison: Comparison;
  tone: CoverLetterTone;
}

export interface GenerateCoverLetterResult {
  coverLetter: string;
  meta: CoverLetterMeta;
}

/**
 * Generates the cover letter following the rules documented in
 * docs/coverletter.md (short, specific, evidence-based, honest).
 */
export async function generateCoverLetter(
  provider: AIProvider,
  input: GenerateCoverLetterInput,
): Promise<GenerateCoverLetterResult> {
  const raw = await provider.generateJson<unknown>({
    systemPrompt: GENERATE_COVER_LETTER_SYSTEM_PROMPT,
    prompt: buildGenerateCoverLetterPrompt(input),
    schemaHint: GENERATE_COVER_LETTER_SCHEMA_HINT,
    temperature: 0.6,
    maxTokens: 3000,
  });

  const generation = coverLetterGenerationSchema.parse(raw);

  // The model still slips in em dashes despite the prompt, so strip them
  // deterministically here — this is the reliable guard.
  const coverLetter = removeProseDashes(generation.coverLetter.trim());
  if (!coverLetter) {
    throw new AIProviderError('The AI provider returned an empty cover letter. Please try again.');
  }

  const warnings = [...generation.warnings];
  if (!input.job.companyName) {
    warnings.push('Company name was not found in the job description; the letter uses a generic opening.');
  }

  return {
    coverLetter,
    meta: {
      tone: input.tone,
      language: generation.language || 'en',
      companyName: input.job.companyName,
      jobTitle: input.job.title,
      detectedFocusAreas: generation.detectedFocusAreas,
      warnings: dedupe(warnings),
    },
  };
}

function dedupe(values: string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}
