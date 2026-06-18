import { randomUUID } from 'node:crypto';
import { AIProviderFactory } from '../providers/ai/AIProviderFactory';
import {
  ANALYZE_JOB_SCHEMA_HINT,
  ANALYZE_JOB_SYSTEM_PROMPT,
  buildAnalyzeJobPrompt,
} from '../prompts/analyzeJob.prompt';
import {
  ANALYZE_LINKEDIN_SCHEMA_HINT,
  ANALYZE_LINKEDIN_SYSTEM_PROMPT,
  buildAnalyzeLinkedInPrompt,
} from '../prompts/analyzeLinkedIn.prompt';
import {
  ANALYZE_RESUME_SCHEMA_HINT,
  ANALYZE_RESUME_SYSTEM_PROMPT,
  buildAnalyzeResumePrompt,
} from '../prompts/analyzeResume.prompt';
import { AIProvider } from '../providers/ai/AIProvider';
import {
  CreateAnalysisBody,
  JobAnalysis,
  LinkedInAnalysis,
  ResumeAnalysis,
  SavedResumeProfile,
  jobAnalysisSchema,
  linkedInAnalysisSchema,
  resumeAnalysisSchema,
} from '../schemas/analysis.schema';
import { CoverLetterMeta } from '../schemas/coverLetter.schema';
import { OptimizedResume } from '../schemas/resume.schema';
import { sanitizeUserText } from '../utils/textCleaner';
import { assertPdf } from '../utils/fileValidator';
import { evaluateAdherence } from './ats.service';
import { generateCoverLetter } from './coverLetter.service';
import { extractTextFromFile } from './documentParser.service';
import { generateOptimizedResume } from './resume.service';

export interface AnalysisResponse {
  analysisId: string;
  matchScore: number;
  scores: {
    technicalSkills: number;
    experience: number;
    seniority: number;
    industryFit: number;
    atsKeywords: number;
  };
  scoreExplanations: {
    technicalSkills: string;
    experience: string;
    seniority: string;
    industryFit: string;
    atsKeywords: string;
  };
  job: {
    title?: string;
    companyName?: string;
    seniority?: string;
    workModel?: string;
    requiredSkills: string[];
    preferredSkills: string[];
    responsibilities: string[];
    keywords: string[];
    industry?: string;
  };
  candidate: {
    strengths: string[];
    gaps: string[];
    keywordsFound: string[];
    missingKeywords: string[];
    requirementsCovered: string[];
    requirementsPartiallyCovered: string[];
    requirementsNotCovered: string[];
    recommendations: string[];
    warnings: string[];
  };
  optimizedResume: OptimizedResume;
  coverLetter: string;
  coverLetterMeta: CoverLetterMeta;
  /** The analyzed resume + raw text, so the client can cache it and skip re-parsing next time. */
  profile: {
    resume: ResumeAnalysis;
    resumeText: string;
  };
}

export interface RunAnalysisInput {
  body: CreateAnalysisBody;
  /** Uploaded resume file; omitted when `savedProfile` is supplied instead. */
  resumeFile?: Express.Multer.File;
  /** A previously analyzed resume, reused to skip parsing + the extraction LLM call. */
  savedProfile?: SavedResumeProfile;
  linkedInFile?: Express.Multer.File;
}

/**
 * Full analysis pipeline:
 * parse files -> analyze job/resume/linkedin -> compare + score -> generate
 * optimized resume + cover letter -> assemble the API response.
 */
export async function runAnalysis(input: RunAnalysisInput): Promise<AnalysisResponse> {
  const provider = AIProviderFactory.create(input.body.aiProvider);
  const jobDescription = sanitizeUserText(input.body.jobDescription);

  if (input.linkedInFile) {
    assertPdf(input.linkedInFile, 'LinkedIn export');
  }

  const reusedProfile = Boolean(input.savedProfile);
  console.log(`[analysis] provider=${provider.name} resume=${reusedProfile ? 'saved-profile' : input.resumeFile?.originalname} linkedin=${input.linkedInFile?.originalname ?? 'none'}`);

  // 1-3. Extract and normalize text — reused verbatim from the cached profile when present.
  const resumeText = input.savedProfile
    ? input.savedProfile.resumeText
    : await extractTextFromFile(input.resumeFile!);
  const linkedInText = input.linkedInFile
    ? await extractTextFromFile(input.linkedInFile)
    : undefined;

  // 4-6. Analyze job, resume and LinkedIn (independent calls, run in parallel).
  // A cached profile skips the resume-extraction LLM call entirely.
  const [job, resume, linkedIn] = await Promise.all([
    analyzeJob(provider, jobDescription),
    input.savedProfile ? Promise.resolve(input.savedProfile.resume) : analyzeResume(provider, resumeText),
    linkedInText ? analyzeLinkedIn(provider, linkedInText, resumeText) : Promise.resolve(undefined),
  ]);
  console.log(`[analysis] job="${job.title ?? 'unknown'}" candidate="${resume.candidateName ?? 'unknown'}"`);

  // 7-8. Compare candidate vs job + ATS keyword matching
  const candidateRawText = [resumeText, linkedInText].filter(Boolean).join('\n\n');
  const { comparison, keywordsFound, keywordsMissing } = await evaluateAdherence(provider, {
    job,
    resume,
    linkedIn,
    candidateRawText,
  });
  console.log(`[analysis] matchScore=${comparison.matchScore}`);

  // 9-10. Generate optimized resume and cover letter (independent, run in parallel)
  const [optimizedResumeResult, coverLetterResult] = await Promise.all([
    generateOptimizedResume(provider, {
      job,
      resume,
      linkedIn,
      comparison,
      missingKeywords: keywordsMissing,
      candidateRawText,
    }),
    generateCoverLetter(provider, {
      job,
      resume,
      linkedIn,
      comparison,
      tone: input.body.coverLetterTone,
    }),
  ]);

  const warnings = dedupe([
    ...comparison.warnings,
    ...(linkedIn?.conflictsWithResume ?? []),
    ...optimizedResumeResult.warnings,
  ]);

  return {
    analysisId: randomUUID(),
    matchScore: comparison.matchScore,
    scores: comparison.scores,
    scoreExplanations: comparison.scoreExplanations,
    job: {
      title: job.title,
      companyName: job.companyName,
      seniority: job.seniority,
      workModel: job.workModel,
      requiredSkills: job.requiredSkills,
      preferredSkills: job.preferredSkills,
      responsibilities: job.responsibilities,
      keywords: job.keywords,
      industry: job.industry,
    },
    candidate: {
      strengths: comparison.strengths,
      gaps: comparison.gaps,
      keywordsFound,
      missingKeywords: keywordsMissing,
      requirementsCovered: comparison.requirementsCovered,
      requirementsPartiallyCovered: comparison.requirementsPartiallyCovered,
      requirementsNotCovered: comparison.requirementsNotCovered,
      recommendations: comparison.recommendations,
      warnings,
    },
    optimizedResume: optimizedResumeResult.resume,
    coverLetter: coverLetterResult.coverLetter,
    coverLetterMeta: coverLetterResult.meta,
    profile: { resume, resumeText },
  };
}

async function analyzeJob(provider: AIProvider, jobDescription: string): Promise<JobAnalysis> {
  const raw = await provider.generateJson<unknown>({
    systemPrompt: ANALYZE_JOB_SYSTEM_PROMPT,
    prompt: buildAnalyzeJobPrompt(jobDescription),
    schemaHint: ANALYZE_JOB_SCHEMA_HINT,
    temperature: 0.2,
  });
  return jobAnalysisSchema.parse(raw);
}

async function analyzeResume(provider: AIProvider, resumeText: string): Promise<ResumeAnalysis> {
  const raw = await provider.generateJson<unknown>({
    systemPrompt: ANALYZE_RESUME_SYSTEM_PROMPT,
    prompt: buildAnalyzeResumePrompt(resumeText),
    schemaHint: ANALYZE_RESUME_SCHEMA_HINT,
    temperature: 0.2,
    maxTokens: 5000,
  });
  return resumeAnalysisSchema.parse(raw);
}

async function analyzeLinkedIn(
  provider: AIProvider,
  linkedInText: string,
  resumeText: string,
): Promise<LinkedInAnalysis> {
  const raw = await provider.generateJson<unknown>({
    systemPrompt: ANALYZE_LINKEDIN_SYSTEM_PROMPT,
    prompt: buildAnalyzeLinkedInPrompt(linkedInText, resumeText),
    schemaHint: ANALYZE_LINKEDIN_SCHEMA_HINT,
    temperature: 0.2,
    maxTokens: 5000,
  });
  return linkedInAnalysisSchema.parse(raw);
}

function dedupe(values: string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}
