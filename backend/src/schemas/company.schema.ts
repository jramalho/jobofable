import { z } from 'zod';

const optionalText = z.string().trim().max(2000).optional();

export const createCompanyBodySchema = z.object({
  name: z.string().trim().min(1, 'Company name is required.').max(200),
  website: z.string().trim().max(300).optional(),
  domain: z.string().trim().max(200).optional(),
  country: z.string().trim().max(120).optional(),
  timezone: z.string().trim().max(120).optional(),
  notes: optionalText,
  blacklistedReason: optionalText,
});
export type CreateCompanyBody = z.infer<typeof createCompanyBodySchema>;

// At least one field must be present so PATCH is never a no-op.
export const updateCompanyBodySchema = createCompanyBodySchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: 'Provide at least one field to update.',
  });
export type UpdateCompanyBody = z.infer<typeof updateCompanyBodySchema>;
