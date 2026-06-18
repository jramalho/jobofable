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
import { matchKeywords } from '../utils/keywordExtractor';

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
