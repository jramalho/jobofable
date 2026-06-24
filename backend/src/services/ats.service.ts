import { AIProvider } from '../providers/ai/AIProvider';
import {
  COMPARE_SCHEMA_HINT,
  COMPARE_SYSTEM_PROMPT,
  buildComparePrompt,
} from '../prompts/compareCandidateToJob.prompt';
import {
  Comparison,
  JobAnalysis,
  LinkedInAnalysis,
  ResumeAnalysis,
  comparisonSchema,
} from '../schemas/analysis.schema';
import { OptimizedResume } from '../schemas/resume.schema';
import { countKeywordOccurrences, keywordPresent, matchKeywords } from '../utils/keywordExtractor';

export interface AtsEvaluation {
  comparison: Comparison;
  keywordsFound: string[];
  keywordsMissing: string[];
}

export interface AtsEvaluationInput {
  job: JobAnalysis;
  resume: ResumeAnalysis;
  linkedIn?: LinkedInAnalysis;
  /** Raw candidate text (resume + LinkedIn) used for deterministic keyword matching. */
  candidateRawText: string;
}

/**
 * ATS adherence evaluation. Scores and qualitative analysis come from the
 * LLM comparison; keyword found/missing lists are computed deterministically
 * against the candidate's real text so they cannot be hallucinated.
 */
export async function evaluateAdherence(
  provider: AIProvider,
  input: AtsEvaluationInput,
): Promise<AtsEvaluation> {
  const rawComparison = await provider.generateJson<unknown>({
    systemPrompt: COMPARE_SYSTEM_PROMPT,
    prompt: buildComparePrompt({ job: input.job, resume: input.resume, linkedIn: input.linkedIn }),
    schemaHint: COMPARE_SCHEMA_HINT,
    temperature: 0.2,
  });

  const comparison = comparisonSchema.parse(rawComparison);

  // Whole requirement sentences are not ATS keywords and can never match
  // literally — keep only short, concrete terms for keyword matching.
  // Sentence-level requirements are covered by requirementsCovered/NotCovered.
  const allJobKeywords = dedupe([
    ...input.job.keywords,
    ...input.job.requiredSkills,
    ...input.job.preferredSkills,
  ]).filter(isMatchableKeyword);
  const { found, missing } = matchKeywords(allJobKeywords, input.candidateRawText);

  return {
    comparison: clampComparisonScores(comparison),
    keywordsFound: found,
    keywordsMissing: missing,
  };
}

export interface CoverageBreakdown {
  /** 0-100: share of relevant, candidate-supported keywords present in the resume. */
  score: number;
  /** Relevant keywords the candidate genuinely has AND that landed in the resume. */
  matched: string[];
  /** Relevant keywords the candidate genuinely has but that are NOT in the resume yet. */
  missing: string[];
}

export interface AtsCoverage extends CoverageBreakdown {
  /** Coverage of the job's REQUIRED skills only — the number that matters most. */
  required: CoverageBreakdown;
  /** Keywords that appear so often they may read as stuffing (ATS can penalize). */
  overusedKeywords: { keyword: string; count: number }[];
  /** Covered keywords that only appear in low-prominence spots (deep in bullets). */
  buried: string[];
  /** Relevant acronyms present in only one form; suggested "Expansion (ACRONYM)". */
  acronymSuggestions: string[];
}

/** Threshold above which a repeated keyword reads as stuffing. */
const OVERUSE_THRESHOLD = 4;
/** A keyword that is the role's core tech (in the job title) repeats naturally. */
const OVERUSE_THRESHOLD_CORE = 7;

// Unambiguous tech acronyms worth spelling out in both forms for ATS.
const ACRONYM_PAIRS: [string, string][] = [
  ['SSO', 'Single Sign-On'],
  ['OIDC', 'OpenID Connect'],
  ['CI/CD', 'Continuous Integration/Continuous Delivery'],
  ['ORM', 'Object-Relational Mapping'],
  ['AWS', 'Amazon Web Services'],
  ['GCP', 'Google Cloud Platform'],
  ['i18n', 'Internationalization'],
  ['a11y', 'Accessibility'],
  ['E2E', 'End-to-End'],
];

/**
 * Deterministic ATS keyword coverage of the GENERATED resume. It measures only
 * keywords the candidate genuinely has (present in their raw material), so the
 * score never rewards lying. Required-skill coverage is reported separately
 * (it matters most), and overly repeated keywords are flagged as stuffing.
 */
export function computeAtsCoverage(
  resume: OptimizedResume,
  job: JobAnalysis,
  candidateRawText: string,
): AtsCoverage {
  const resumeText = resumeToSearchText(resume);
  const overall = coverageFor(
    [...job.keywords, ...job.requiredSkills, ...job.preferredSkills],
    candidateRawText,
    resumeText,
  );
  const required = coverageFor(job.requiredSkills, candidateRawText, resumeText);

  // Prominence: keywords present but only deep in bullets (not in summary,
  // skills or a role's first bullet) get less ATS/recruiter weight.
  const { missing: buried } = matchKeywords(overall.matched, resumeToProminentText(resume));

  return {
    ...overall,
    required,
    overusedKeywords: findResumeStuffing(resume, job),
    buried,
    acronymSuggestions: suggestAcronymForms(resumeText, job),
  };
}

/** Summary, title, skills and each role's FIRST bullet — the high-weight zones. */
function resumeToProminentText(resume: OptimizedResume): string {
  return [
    resume.summary,
    resume.header.title ?? '',
    ...resume.skills.flatMap((group) => [group.category, ...group.items]),
    ...resume.experience.map((role) => role.bullets[0] ?? ''),
    ...resume.projects.map((project) => project.name),
  ].join('\n');
}

/**
 * Suggests spelling out both forms of a relevant acronym when the resume uses
 * only one (e.g. has "SSO" but not "Single Sign-On"). Some ATS match exact
 * strings, so both forms maximize the hit rate.
 */
function suggestAcronymForms(resumeText: string, job: JobAnalysis): string[] {
  const jobBlob = [...job.requiredSkills, ...job.preferredSkills, ...job.keywords]
    .join(' ')
    .toLowerCase();

  const suggestions: string[] = [];
  for (const [acronym, expansion] of ACRONYM_PAIRS) {
    const relevant = jobBlob.includes(acronym.toLowerCase()) || jobBlob.includes(expansion.toLowerCase());
    if (!relevant) continue;

    const hasAcronym = keywordPresent(acronym, resumeText);
    const hasExpansion = keywordPresent(expansion, resumeText);
    if (hasAcronym !== hasExpansion) suggestions.push(`${expansion} (${acronym})`);
  }
  return suggestions;
}

function coverageFor(
  rawKeywords: string[],
  candidateRawText: string,
  resumeText: string,
): CoverageBreakdown {
  const jobKeywords = dedupe(rawKeywords).filter(isMatchableKeyword);
  // Only keywords the candidate actually has are eligible to be covered.
  const supported = matchKeywords(jobKeywords, candidateRawText).found;
  const { found: matched, missing } = matchKeywords(supported, resumeText);
  const score = supported.length === 0 ? 100 : Math.round((matched.length / supported.length) * 100);
  return { score, matched, missing };
}

export interface OverusedKeyword {
  keyword: string;
  count: number;
}

/**
 * Job keywords that appear in the resume more than the stuffing threshold. The
 * role's core tech (in the job title) is allowed to repeat more, since that is
 * natural rather than stuffing. Reused by the de-stuff round in resume.service.
 */
export function findResumeStuffing(resume: OptimizedResume, job: JobAnalysis): OverusedKeyword[] {
  const jobKeywords = dedupe([
    ...job.keywords,
    ...job.requiredSkills,
    ...job.preferredSkills,
  ]).filter(isMatchableKeyword);
  const resumeText = resumeToSearchText(resume);
  const title = (job.title ?? '').toLowerCase();

  return jobKeywords
    .map((keyword) => ({ keyword, count: countKeywordOccurrences(keyword, resumeText) }))
    .filter((entry) => {
      const threshold = title.includes(entry.keyword.toLowerCase())
        ? OVERUSE_THRESHOLD_CORE
        : OVERUSE_THRESHOLD;
      return entry.count > threshold;
    })
    .sort((a, b) => b.count - a.count);
}

function resumeToSearchText(resume: OptimizedResume): string {
  return [
    resume.summary,
    resume.header.title ?? '',
    ...resume.skills.flatMap((group) => [group.category, ...group.items]),
    ...resume.experience.flatMap((role) => [role.title, ...role.bullets]),
    ...resume.projects.flatMap((project) => [
      project.name,
      project.description,
      ...project.technologies,
      ...project.bullets,
    ]),
    ...resume.certifications.map((cert) => cert.name),
    ...resume.languages.map((entry) => entry.language),
  ].join('\n');
}

function clampComparisonScores(comparison: Comparison): Comparison {
  const clamp = (value: number) => Math.max(0, Math.min(100, Math.round(value)));
  return {
    ...comparison,
    matchScore: clamp(comparison.matchScore),
    scores: {
      technicalSkills: clamp(comparison.scores.technicalSkills),
      experience: clamp(comparison.scores.experience),
      seniority: clamp(comparison.scores.seniority),
      industryFit: clamp(comparison.scores.industryFit),
      atsKeywords: clamp(comparison.scores.atsKeywords),
    },
  };
}

function isMatchableKeyword(keyword: string): boolean {
  const trimmed = keyword.trim();
  return trimmed.length > 0 && trimmed.length <= 40 && trimmed.split(/\s+/).length <= 4;
}

function dedupe(values: string[]): string[] {
  const seen = new Set<string>();
  return values.filter((value) => {
    const key = value.trim().toLowerCase();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
