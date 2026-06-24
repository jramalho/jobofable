import { z } from 'zod';

export const jobSearchBodySchema = z.object({
  keywords: z
    .array(z.string().trim().min(1).max(60))
    .min(1, 'Provide at least one keyword to search.')
    .max(20),
  remoteOnly: z.boolean().optional().default(true),
  limit: z.number().int().min(1).max(50).optional().default(25),
});
export type JobSearchBody = z.infer<typeof jobSearchBodySchema>;
