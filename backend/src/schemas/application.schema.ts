import { z } from 'zod';
import { APPLICATION_STATUSES } from '../lib/enums';

export const applicationStatusSchema = z.enum(
  APPLICATION_STATUSES as unknown as [string, ...string[]],
);

const optionalText = z.string().trim().max(5000).optional();
const optionalShort = z.string().trim().max(300).optional();
const optionalInt = z.number().int().optional();

export const createApplicationBodySchema = z.object({
  jobTitle: z.string().trim().min(1, 'Job title is required.').max(300),
  // The company can be resolved by name (find-or-create) or referenced directly.
  companyName: z.string().trim().min(1).max(200).optional(),
  companyId: z.string().trim().min(1).max(64).optional(),
  analysisId: z.string().trim().min(1).max(64).optional(),
  jobUrl: optionalShort,
  source: optionalShort,
  status: applicationStatusSchema.optional(),
  appliedAt: z.coerce.date().optional(),
  lastContactAt: z.coerce.date().optional(),
  nextFollowUpAt: z.coerce.date().optional(),
  salaryMin: optionalInt,
  salaryMax: optionalInt,
  currency: z.string().trim().max(10).optional(),
  contractType: optionalShort,
  remoteType: optionalShort,
  jobDescription: optionalText,
  matchScore: z.number().int().min(0).max(100).optional(),
  notes: optionalText,
});
export type CreateApplicationBody = z.infer<typeof createApplicationBodySchema>;

export const updateApplicationBodySchema = createApplicationBodySchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: 'Provide at least one field to update.',
  });
export type UpdateApplicationBody = z.infer<typeof updateApplicationBodySchema>;

/** Inputs for deterministic duplicate detection (all optional). */
export const checkDuplicatesBodySchema = z.object({
  companyName: z.string().trim().max(200).optional(),
  jobTitle: z.string().trim().max(300).optional(),
  jobUrl: z.string().trim().max(500).optional(),
  jobDescription: z.string().trim().max(20000).optional(),
});
export type CheckDuplicatesBody = z.infer<typeof checkDuplicatesBodySchema>;
