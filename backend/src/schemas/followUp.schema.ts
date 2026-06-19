import { z } from 'zod';
import { FOLLOW_UP_STATUSES } from '../lib/enums';

export const followUpStatusSchema = z.enum(
  FOLLOW_UP_STATUSES as unknown as [string, ...string[]],
);

export const createFollowUpBodySchema = z.object({
  title: z.string().trim().min(1, 'Follow-up title is required.').max(300),
  dueAt: z.coerce.date(),
  status: followUpStatusSchema.optional(),
});
export type CreateFollowUpBody = z.infer<typeof createFollowUpBodySchema>;

export const updateFollowUpBodySchema = z
  .object({
    title: z.string().trim().min(1).max(300).optional(),
    dueAt: z.coerce.date().optional(),
    status: followUpStatusSchema.optional(),
    completedAt: z.coerce.date().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: 'Provide at least one field to update.',
  });
export type UpdateFollowUpBody = z.infer<typeof updateFollowUpBodySchema>;

// Optional filters for GET /api/follow-ups.
export const listFollowUpsQuerySchema = z.object({
  status: followUpStatusSchema.optional(),
  applicationId: z.string().trim().min(1).max(64).optional(),
});
export type ListFollowUpsQuery = z.infer<typeof listFollowUpsQuerySchema>;
