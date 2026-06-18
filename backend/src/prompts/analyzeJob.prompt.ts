import { JSON_OUTPUT_RULES } from './shared.prompt';

export const ANALYZE_JOB_SYSTEM_PROMPT = `You are an expert technical recruiter and ATS specialist. You extract structured information from job descriptions accurately, without inventing anything that is not in the text.

${JSON_OUTPUT_RULES}`;

export const ANALYZE_JOB_SCHEMA_HINT = `{
  "title": string | null,
  "companyName": string | null,
  "seniority": string | null,            // e.g. "junior", "mid-level", "senior", "staff", "lead"
  "workModel": string | null,            // "remote" | "hybrid" | "onsite" | "global" | null
  "requiredSkills": string[],            // hard requirements
  "preferredSkills": string[],           // nice-to-have requirements
  "softSkills": string[],
  "responsibilities": string[],
  "keywords": string[],                  // 10-25 ATS keywords/phrases an ATS would scan for
  "industry": string | null              // e.g. "fintech", "healthcare", "media", "SaaS", "marketplace", "agency/client work", "edtech", "other"
}`;

export function buildAnalyzeJobPrompt(jobDescription: string): string {
  return `Analyze the following job description and extract structured information.

Rules:
- Only extract what is actually stated or strongly implied by the text.
- "keywords" must be the concrete terms an ATS would match: technologies, tools, methodologies, certifications, domain terms.
- If the company name, title, seniority, work model or industry is not stated, return null for that field.

JOB DESCRIPTION:
"""
${jobDescription}
"""`;
}
