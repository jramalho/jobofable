import { z } from 'zod';
import { optimizedResumeSchema } from './resume.schema';

const stringArray = z.array(z.coerce.string()).catch([]);
const optionalString = z
  .union([z.string(), z.null(), z.undefined()])
  .transform((value) => (value ? value : undefined))
  .catch(undefined);

export const coverLetterToneSchema = z.enum([
  'professional',
  'direct',
  'confident',
  'human',
  'executive',
]);
export type CoverLetterTone = z.infer<typeof coverLetterToneSchema>;

export const createAnalysisBodySchema = z.object({
  jobDescription: z
    .string({ required_error: 'Job description is required.' })
    .trim()
    .min(50, 'Job description looks too short. Paste the full job posting (at least 50 characters).'),
  coverLetterTone: coverLetterToneSchema.optional().default('professional'),
  aiProvider: z.enum(['groq', 'ollama']).optional(),
});
export type CreateAnalysisBody = z.infer<typeof createAnalysisBodySchema>;

export const keywordSelectionSchema = z
  .object({
    keyword: z.string().trim().min(1).max(80),
    target: z.enum(['skills', 'summary', 'experience']),
    experienceIndex: z.number().int().min(0).optional(),
  })
  .refine(
    (selection) => selection.target !== 'experience' || selection.experienceIndex !== undefined,
    { message: 'experienceIndex is required when target is "experience".' },
  );
export type KeywordSelection = z.infer<typeof keywordSelectionSchema>;

export const applyKeywordsBodySchema = z.object({
  resume: optimizedResumeSchema,
  jobTitle: z.string().trim().max(160).optional(),
  selections: z
    .array(keywordSelectionSchema)
    .min(1, 'Select at least one keyword to apply.')
    .max(20, 'Apply at most 20 keywords per round.'),
  aiProvider: z.enum(['groq', 'ollama']).optional(),
});
export type ApplyKeywordsBody = z.infer<typeof applyKeywordsBodySchema>;

/** Output of the job description analysis (LLM JSON, parsed defensively). */
export const jobAnalysisSchema = z.object({
  title: optionalString,
  companyName: optionalString,
  seniority: optionalString,
  workModel: optionalString,
  requiredSkills: stringArray,
  preferredSkills: stringArray,
  softSkills: stringArray,
  responsibilities: stringArray,
  keywords: stringArray,
  industry: optionalString,
});
export type JobAnalysis = z.infer<typeof jobAnalysisSchema>;

const experienceEntrySchema = z
  .object({
    company: z.coerce.string().catch(''),
    title: z.coerce.string().catch(''),
    location: optionalString,
    startDate: optionalString,
    endDate: optionalString,
    description: optionalString,
  })
  .catch({ company: '', title: '' });

/** Output of the resume analysis (LLM JSON, parsed defensively). */
export const resumeAnalysisSchema = z.object({
  candidateName: optionalString,
  currentTitle: optionalString,
  location: optionalString,
  email: optionalString,
  phone: optionalString,
  linkedin: optionalString,
  github: optionalString,
  website: optionalString,
  summary: optionalString,
  technicalSkills: stringArray,
  softSkills: stringArray,
  experiences: z.array(experienceEntrySchema).catch([]),
  projects: stringArray,
  education: stringArray,
  certifications: stringArray,
  languages: stringArray,
  strengths: stringArray,
  weaknesses: stringArray,
  vagueSections: stringArray,
  genericSections: stringArray,
  improvementSuggestions: stringArray,
  doNotChange: stringArray,
});
export type ResumeAnalysis = z.infer<typeof resumeAnalysisSchema>;

/**
 * A previously analyzed resume that the client cached locally, sent back to
 * skip re-parsing the file and re-running the resume-extraction LLM call.
 */
export const savedResumeProfileSchema = z.object({
  resume: resumeAnalysisSchema,
  resumeText: z.string().trim().min(50).max(60000),
});
export type SavedResumeProfile = z.infer<typeof savedResumeProfileSchema>;

/** Validates the `:id` route param for the stored-analysis endpoints. */
export const analysisIdParamSchema = z.object({
  id: z.string().trim().min(1, 'Analysis id is required.').max(64),
});
export type AnalysisIdParam = z.infer<typeof analysisIdParamSchema>;

/** Output of the LinkedIn PDF analysis (LLM JSON, parsed defensively). */
export const linkedInAnalysisSchema = z.object({
  headline: optionalString,
  about: optionalString,
  experiences: z.array(experienceEntrySchema).catch([]),
  skills: stringArray,
  certifications: stringArray,
  projects: stringArray,
  languages: stringArray,
  volunteering: stringArray,
  extraInformation: stringArray,
  conflictsWithResume: stringArray,
});
export type LinkedInAnalysis = z.infer<typeof linkedInAnalysisSchema>;

const score = z.coerce.number().min(0).max(100).catch(0);

/** Output of the candidate-vs-job comparison (LLM JSON, parsed defensively). */
export const comparisonSchema = z.object({
  matchScore: score,
  scores: z
    .object({
      technicalSkills: score,
      experience: score,
      seniority: score,
      industryFit: score,
      atsKeywords: score,
    })
    .catch({ technicalSkills: 0, experience: 0, seniority: 0, industryFit: 0, atsKeywords: 0 }),
  scoreExplanations: z
    .object({
      technicalSkills: z.coerce.string().catch(''),
      experience: z.coerce.string().catch(''),
      seniority: z.coerce.string().catch(''),
      industryFit: z.coerce.string().catch(''),
      atsKeywords: z.coerce.string().catch(''),
    })
    .catch({ technicalSkills: '', experience: '', seniority: '', industryFit: '', atsKeywords: '' }),
  requirementsCovered: stringArray,
  requirementsPartiallyCovered: stringArray,
  requirementsNotCovered: stringArray,
  strengths: stringArray,
  gaps: stringArray,
  recommendations: stringArray,
  warnings: stringArray,
});
export type Comparison = z.infer<typeof comparisonSchema>;
