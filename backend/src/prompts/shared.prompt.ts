/**
 * Grounding rules shared by every generation prompt. The product's core
 * promise is honesty: improve positioning, never invent facts.
 */
export const GROUNDING_RULES = `STRICT TRUTHFULNESS RULES — these override everything else:
- NEVER invent work experience, company names, job titles, education, certifications, metrics, results, projects, languages or years of experience.
- NEVER add a skill that does not appear in the candidate's resume or LinkedIn material.
- NEVER claim remote work experience, locations, availability, visa status or work arrangements that are not explicitly stated in the candidate's material.
- NEVER fabricate numbers. If a bullet has no metric, improve the wording WITHOUT adding a number. You may add a note like "Metric missing: consider adding measurable impact if available".
- You MAY improve wording, clarity, structure and emphasis.
- You MAY reorder and highlight the most relevant real experiences for this job.
- You MAY use keywords from the job description ONLY when the candidate's real experience genuinely supports them.
- When information is missing, say so honestly in a warning instead of guessing.`;

export const JSON_OUTPUT_RULES = `OUTPUT RULES:
- Respond with a single valid JSON object and nothing else.
- No markdown fences, no commentary before or after the JSON.
- Use empty arrays [] or null for information that is not present in the input. Do not guess.`;
