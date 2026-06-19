import { z } from 'zod';

/** Validates a `:id` route param (cuid-length string) for the CRUD endpoints. */
export const idParamSchema = z.object({
  id: z.string().trim().min(1, 'id is required.').max(64),
});
export type IdParam = z.infer<typeof idParamSchema>;
