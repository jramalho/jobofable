import { z } from 'zod';

export const createApplicationEventBodySchema = z.object({
  type: z.string().trim().min(1, 'Event type is required.').max(120),
  notes: z.string().trim().max(5000).optional(),
  occurredAt: z.coerce.date().optional(),
});
export type CreateApplicationEventBody = z.infer<typeof createApplicationEventBodySchema>;
