import { AIProvider } from '../providers/ai/AIProvider';
import {
  APPLY_KEYWORDS_SYSTEM_PROMPT,
  ResolvedKeywordInstruction,
  buildApplyKeywordsPrompt,
} from '../prompts/applyKeywords.prompt';
import {
  GENERATE_RESUME_SCHEMA_HINT,
  GENERATE_RESUME_SYSTEM_PROMPT,
  buildGenerateResumePrompt,
} from '../prompts/generateResume.prompt';
import {
  Comparison,
  JobAnalysis,
  KeywordSelection,
  LinkedInAnalysis,
  ResumeAnalysis,
} from '../schemas/analysis.schema';
import { OptimizedResume, optimizedResumeSchema } from '../schemas/resume.schema';
import { ValidationError } from '../utils/errors';
import { normalizePersonName } from '../utils/personName';

export interface GenerateOptimizedResumeInput {
  job: JobAnalysis;
  resume: ResumeAnalysis;
  linkedIn?: LinkedInAnalysis;
  comparison: Comparison;
  /** Job keywords missing from the candidate's text; woven in only when truthful. */
  missingKeywords: string[];
  /** Raw resume + LinkedIn text, used to verify activity claims deterministically. */
  candidateRawText: string;
}

export interface GenerateOptimizedResumeResult {
  resume: OptimizedResume;
  warnings: string[];
}

/**
 * Generates the ATS-optimized resume as structured JSON,
 * grounded in the candidate's real experience.
 */
export async function generateOptimizedResume(
  provider: AIProvider,
  input: GenerateOptimizedResumeInput,
): Promise<GenerateOptimizedResumeResult> {
  const raw = await provider.generateJson<unknown>({
    systemPrompt: GENERATE_RESUME_SYSTEM_PROMPT,
    prompt: buildGenerateResumePrompt(input),
    schemaHint: GENERATE_RESUME_SCHEMA_HINT,
    temperature: 0.4,
    maxTokens: 6000,
  });

  const generated = optimizedResumeSchema.parse(raw);

  // Contact details are hard facts: the extraction pass wins over anything
  // the generation model produced, so they can never be invented or altered.
  const resume: OptimizedResume = {
    ...generated,
    header: {
      name: normalizePersonName(input.resume.candidateName ?? generated.header.name),
      title: generated.header.title ?? input.resume.currentTitle,
      location: input.resume.location ?? generated.header.location,
      phone: input.resume.phone ?? generated.header.phone,
      email: input.resume.email ?? generated.header.email,
      linkedin: input.resume.linkedin ?? generated.header.linkedin,
      github: input.resume.github ?? generated.header.github,
      website: input.resume.website ?? generated.header.website,
    },
  };

  return enforceActivityClaims(resume, input.candidateRawText);
}

export interface ApplyKeywordsInput {
  resume: OptimizedResume;
  jobTitle?: string;
  selections: KeywordSelection[];
}

export interface ApplyKeywordsResult {
  resume: OptimizedResume;
  appliedKeywords: string[];
  warnings: string[];
}

/**
 * Second AI round: applies user-confirmed keywords to the targets the user
 * chose (a specific experience, the skills section or the summary). The user
 * vouches for these keywords, so the usual "never add" rule is lifted for
 * them — and only for them.
 */
export async function applyKeywordsToResume(
  provider: AIProvider,
  input: ApplyKeywordsInput,
): Promise<ApplyKeywordsResult> {
  const instructions = resolveInstructions(input);

  const raw = await provider.generateJson<unknown>({
    systemPrompt: APPLY_KEYWORDS_SYSTEM_PROMPT,
    prompt: buildApplyKeywordsPrompt({
      resume: input.resume,
      jobTitle: input.jobTitle,
      instructions,
    }),
    schemaHint: GENERATE_RESUME_SCHEMA_HINT,
    temperature: 0.3,
    maxTokens: 6000,
  });

  const updated = optimizedResumeSchema.parse(raw);

  // Only the summary, skills and experience bullets are legitimate edit
  // targets. Everything else is force-copied from the input so the editing
  // round can never drop or alter it. The header holds contact facts the
  // user may have edited; experience bullets get a dropped-content guard.
  const resume: OptimizedResume = {
    header: input.resume.header,
    summary: updated.summary || input.resume.summary,
    skills: updated.skills.length > 0 ? updated.skills : input.resume.skills,
    experience: restoreDroppedBullets(input.resume, updated),
    projects: input.resume.projects,
    education: input.resume.education,
    certifications: input.resume.certifications,
    languages: input.resume.languages,
  };

  // Deterministic check, per target: confirm each requested keyword actually
  // landed where the user asked for it. A keyword only counts as applied when
  // ALL of its targets landed, so partially-applied keywords stay selectable
  // in the UI for a retry on the failed target.
  const landedSomewhere = new Set<string>();
  const failedSomewhere = new Set<string>();
  const warnings: string[] = [];
  for (const selection of input.selections) {
    const targetText = selectionTargetText(resume, selection).toLowerCase();
    if (keywordLanded(selection.keyword, targetText)) {
      landedSomewhere.add(selection.keyword);
    } else {
      failedSomewhere.add(selection.keyword);
      warnings.push(
        `Could not weave "${selection.keyword}" into ${describeTarget(resume, selection)} — try again or add it manually in the editor.`,
      );
    }
  }
  const appliedKeywords = [...landedSomewhere].filter((keyword) => !failedSomewhere.has(keyword));
  if (landedSomewhere.size > 0) {
    warnings.push(
      'Keywords were added because you confirmed this experience is real. Make sure you can back each one up in an interview.',
    );
  }

  return { resume, appliedKeywords, warnings };
}

function selectionTargetText(resume: OptimizedResume, selection: KeywordSelection): string {
  if (selection.target === 'summary') return resume.summary;
  if (selection.target === 'skills') return JSON.stringify(resume.skills);
  const role = resume.experience[selection.experienceIndex ?? -1];
  return role ? role.bullets.join('\n') : '';
}

function describeTarget(resume: OptimizedResume, selection: KeywordSelection): string {
  if (selection.target === 'summary') return 'the summary';
  if (selection.target === 'skills') return 'the skills section';
  const role = resume.experience[selection.experienceIndex ?? -1];
  return role ? `"${role.company}"` : 'the selected experience';
}

/** Matches a keyword allowing simple morphological variants ("mentoring" -> "Mentored"). */
function keywordLanded(keyword: string, lowerCaseText: string): boolean {
  const base = keyword.trim().toLowerCase();
  const variants = new Set([base]);
  for (const suffix of ['ing', 'ed', 'es', 's']) {
    if (base.endsWith(suffix) && base.length > suffix.length + 3) {
      variants.add(base.slice(0, -suffix.length));
    }
  }
  return [...variants].some((variant) => lowerCaseText.includes(variant));
}

/**
 * The apply round may reword existing bullets (to weave a keyword) or append
 * new ones — but it must never drop original content. Any original bullet
 * with no reworded counterpart in the updated role is restored.
 */
function restoreDroppedBullets(
  original: OptimizedResume,
  updated: OptimizedResume,
): OptimizedResume['experience'] {
  return original.experience.map((originalRole, index) => {
    const updatedRole = updated.experience[index];
    // Role missing or replaced by a different company: keep the original.
    if (!updatedRole || updatedRole.company !== originalRole.company) {
      return originalRole;
    }

    const restored = [...updatedRole.bullets];
    for (const bullet of originalRole.bullets) {
      const hasCounterpart = updatedRole.bullets.some(
        (candidate) => tokenOverlap(bullet, candidate) >= 0.6,
      );
      if (!hasCounterpart) restored.push(bullet);
    }

    // Facts (company, title, location, dates) always come from the original.
    return { ...originalRole, bullets: restored };
  });
}

function tokenOverlap(a: string, b: string): number {
  const tokensA = new Set(a.toLowerCase().match(/[a-z0-9+#.]+/g) ?? []);
  const tokensB = new Set(b.toLowerCase().match(/[a-z0-9+#.]+/g) ?? []);
  if (tokensA.size === 0 || tokensB.size === 0) return 0;
  let shared = 0;
  for (const token of tokensA) {
    if (tokensB.has(token)) shared += 1;
  }
  return shared / Math.min(tokensA.size, tokensB.size);
}

function resolveInstructions(input: ApplyKeywordsInput): ResolvedKeywordInstruction[] {
  return input.selections.map((selection) => {
    if (selection.target === 'skills') {
      return { keyword: selection.keyword, targetLabel: 'the SKILLS section' };
    }
    if (selection.target === 'summary') {
      return { keyword: selection.keyword, targetLabel: 'the SUMMARY' };
    }
    const role = input.resume.experience[selection.experienceIndex ?? -1];
    if (!role) {
      throw new ValidationError(
        `Invalid experience index ${selection.experienceIndex} for keyword "${selection.keyword}".`,
      );
    }
    return {
      keyword: selection.keyword,
      targetLabel: `the EXPERIENCE "${role.company} — ${role.title}"`,
    };
  });
}

/**
 * Activity claims ("code reviews", "mentoring", team leadership...) are facts.
 * Models occasionally sneak them in because the job asks for them, so this
 * deterministic guard removes unsupported claims from the skills list and
 * warns about any left in the summary or bullets.
 */
const ACTIVITY_CLAIMS = [
  'code review',
  'mentor',
  'team lead',
  'leading a team',
  'leading teams',
  'leading engineering',
  'on-call',
  'managed a team',
  'managing a team',
];

function enforceActivityClaims(resume: OptimizedResume, candidateRawText: string): GenerateOptimizedResumeResult {
  const haystack = candidateRawText.toLowerCase();
  const unsupported = (text: string) =>
    ACTIVITY_CLAIMS.find((claim) => text.toLowerCase().includes(claim) && !haystack.includes(claim));

  const warnings: string[] = [];

  const skills = resume.skills
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => {
        const claim = unsupported(item);
        if (claim) {
          warnings.push(
            `Removed "${item}" from the generated skills: your resume/LinkedIn does not mention it. Add it back manually only if it is true.`,
          );
          return false;
        }
        return true;
      }),
    }))
    .filter((group) => group.items.length > 0);

  const proseBlobs = [
    resume.summary,
    ...resume.experience.flatMap((role) => role.bullets),
    ...resume.projects.flatMap((project) => project.bullets),
  ];
  const flaggedClaims = new Set<string>();
  for (const blob of proseBlobs) {
    const claim = unsupported(blob);
    if (claim) flaggedClaims.add(claim);
  }
  for (const claim of flaggedClaims) {
    warnings.push(
      `The generated resume mentions "${claim}" but your original material does not — double-check that line before sending.`,
    );
  }

  return { resume: { ...resume, skills }, warnings };
}
