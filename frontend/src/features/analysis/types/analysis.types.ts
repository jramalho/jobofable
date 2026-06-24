export type CoverLetterTone = 'professional' | 'direct' | 'confident' | 'human' | 'executive';
export type AIProviderName = 'groq' | 'ollama';

export const COVER_LETTER_TONES: CoverLetterTone[] = [
  'professional',
  'direct',
  'confident',
  'human',
  'executive',
];

export const AI_PROVIDERS: AIProviderName[] = ['groq', 'ollama'];

export interface SkillGroup {
  category: string;
  items: string[];
}

export interface ExperienceEntry {
  company: string;
  title: string;
  location?: string;
  startDate?: string;
  endDate?: string;
  bullets: string[];
}

export interface ProjectEntry {
  name: string;
  description: string;
  technologies: string[];
  bullets: string[];
}

export interface EducationEntry {
  institution: string;
  degree?: string;
  field?: string;
  startDate?: string;
  endDate?: string;
}

export interface CertificationEntry {
  name: string;
  issuer?: string;
  date?: string;
}

export interface LanguageEntry {
  language: string;
  level?: string;
}

export interface ResumeHeader {
  name?: string;
  title?: string;
  location?: string;
  phone?: string;
  email?: string;
  linkedin?: string;
  github?: string;
  website?: string;
}

export interface OptimizedResume {
  header: ResumeHeader;
  summary: string;
  skills: SkillGroup[];
  experience: ExperienceEntry[];
  projects: ProjectEntry[];
  education: EducationEntry[];
  certifications: CertificationEntry[];
  languages: LanguageEntry[];
}

export interface CategoryScores {
  technicalSkills: number;
  experience: number;
  seniority: number;
  industryFit: number;
  atsKeywords: number;
}

export interface CategoryScoreExplanations {
  technicalSkills: string;
  experience: string;
  seniority: string;
  industryFit: string;
  atsKeywords: string;
}

export interface JobSummary {
  title?: string;
  companyName?: string;
  seniority?: string;
  workModel?: string;
  requiredSkills: string[];
  preferredSkills: string[];
  responsibilities: string[];
  keywords: string[];
  industry?: string;
}

export interface CandidateAnalysis {
  strengths: string[];
  gaps: string[];
  keywordsFound: string[];
  missingKeywords: string[];
  requirementsCovered: string[];
  requirementsPartiallyCovered: string[];
  requirementsNotCovered: string[];
  recommendations: string[];
  warnings: string[];
}

export interface CoverageBreakdown {
  score: number;
  matched: string[];
  missing: string[];
}

export interface AtsCoverage extends CoverageBreakdown {
  /** Required-skill coverage (optional for analyses saved before this existed). */
  required?: CoverageBreakdown;
  /** Keywords repeated often enough to read as stuffing. */
  overusedKeywords?: { keyword: string; count: number }[];
  /** Covered keywords that only appear in low-prominence spots. */
  buried?: string[];
  /** Relevant acronyms present in only one form; suggested "Expansion (ACRONYM)". */
  acronymSuggestions?: string[];
}

export interface CoverLetterMeta {
  tone: string;
  language: string;
  companyName?: string;
  jobTitle?: string;
  detectedFocusAreas: string[];
  warnings: string[];
}

/**
 * The analyzed resume + raw text, returned so the client can cache it and skip
 * re-uploading/re-parsing on the next analysis. Treated opaquely on the client
 * (the backend re-validates it), so the structured shape is not duplicated here.
 */
export interface ResumeProfilePayload {
  resume: unknown;
  resumeText: string;
}

export interface AnalysisResponse {
  analysisId: string;
  matchScore: number;
  scores: CategoryScores;
  scoreExplanations: CategoryScoreExplanations;
  job: JobSummary;
  candidate: CandidateAnalysis;
  optimizedResume: OptimizedResume;
  coverLetter: string;
  coverLetterMeta: CoverLetterMeta;
  /** Deterministic ATS keyword coverage; optional for analyses saved before this existed. */
  atsCoverage?: AtsCoverage;
  profile: ResumeProfilePayload;
  /** Database id assigned when the result was persisted; null if persistence failed. */
  persistedAnalysisId?: string | null;
}

/** Row in the persisted analysis history list (GET /api/analysis). */
export interface AnalysisListItem {
  id: string;
  companyName: string | null;
  jobTitle: string | null;
  matchScore: number | null;
  createdAt: string;
  /** Id of the tracked application promoted from this analysis, if any. */
  applicationId: string | null;
}

export interface AnalysesListResponse {
  analyses: AnalysisListItem[];
}

/** Full stored analysis (GET /api/analysis/:id) — metadata plus the original result. */
export interface StoredAnalysis {
  id: string;
  companyName: string | null;
  jobTitle: string | null;
  matchScore: number | null;
  jobDescription: string;
  createdAt: string;
  updatedAt: string;
  /** Id of the tracked application promoted from this analysis, if any. */
  applicationId: string | null;
  result: AnalysisResponse;
  profile: ResumeProfilePayload | null;
}

export type KeywordTarget = 'skills' | 'summary' | 'experience';

export interface KeywordSelection {
  keyword: string;
  target: KeywordTarget;
  experienceIndex?: number;
}

export interface ApplyKeywordsPayload {
  resume: OptimizedResume;
  jobTitle?: string;
  selections: KeywordSelection[];
  aiProvider?: AIProviderName;
}

export interface ApplyKeywordsResponse {
  resume: OptimizedResume;
  appliedKeywords: string[];
  warnings: string[];
}

export interface ApiErrorBody {
  error: {
    code: string;
    message: string;
    details: unknown;
  };
}
