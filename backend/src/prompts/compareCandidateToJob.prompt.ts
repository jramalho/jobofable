import { JobAnalysis, LinkedInAnalysis, ResumeAnalysis } from '../schemas/analysis.schema';
import { GROUNDING_RULES, JSON_OUTPUT_RULES } from './shared.prompt';

export const COMPARE_SYSTEM_PROMPT = `You are an expert technical recruiter and ATS evaluator. You compare candidates against job requirements honestly: every score must be justified by evidence from the candidate's material. You never inflate scores and never invent evidence.

${GROUNDING_RULES}

${JSON_OUTPUT_RULES}`;

export const COMPARE_SCHEMA_HINT = `{
  "matchScore": number,                       // 0-100 overall adherence
  "scores": {
    "technicalSkills": number,                // 0-100
    "experience": number,                     // 0-100
    "seniority": number,                      // 0-100
    "industryFit": number,                    // 0-100
    "atsKeywords": number                     // 0-100
  },
  "scoreExplanations": {
    "technicalSkills": string,                // one short sentence of evidence-based justification
    "experience": string,
    "seniority": string,
    "industryFit": string,
    "atsKeywords": string
  },
  "requirementsCovered": string[],
  "requirementsPartiallyCovered": string[],
  "requirementsNotCovered": string[],
  "strengths": string[],                      // candidate strengths relevant to THIS job
  "gaps": string[],                           // honest gaps vs the job requirements
  "recommendations": string[],                // practical actions the candidate can take
  "warnings": string[]                        // honesty warnings, missing data, conflicts
}`;

export interface ComparePromptInput {
  job: JobAnalysis;
  resume: ResumeAnalysis;
  linkedIn?: LinkedInAnalysis;
}

export function buildComparePrompt(input: ComparePromptInput): string {
  return `Compare this candidate against this job and produce an honest adherence evaluation.

Scoring rules:
- Scores are 0-100. Be calibrated: 90+ means near-perfect fit, 50 means significant gaps, below 30 means poor fit.
- Every score MUST have a short justification based on real evidence from the candidate's material.
- Do not award points for skills or experience the candidate does not actually have.
- "recommendations" must be practical and honest (e.g. "add measurable impact to the X bullet if you have the data"), never "claim experience with Y".

JOB ANALYSIS:
${JSON.stringify(input.job, null, 2)}

CANDIDATE RESUME ANALYSIS:
${JSON.stringify(input.resume, null, 2)}

${
  input.linkedIn
    ? `CANDIDATE LINKEDIN ANALYSIS (auxiliary source):\n${JSON.stringify(input.linkedIn, null, 2)}`
    : 'No LinkedIn profile was provided.'
}`;
}
