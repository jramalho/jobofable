import { z } from 'zod';

export const createContactBodySchema = z.object({
  name: z.string().trim().min(1, 'Contact name is required.').max(200),
  role: z.string().trim().max(200).optional(),
  email: z.string().trim().email('Invalid email address.').max(200).optional(),
  linkedInUrl: z.string().trim().url('Invalid LinkedIn URL.').max(300).optional(),
  notes: z.string().trim().max(5000).optional(),
});
export type CreateContactBody = z.infer<typeof createContactBodySchema>;

export const updateContactBodySchema = createContactBodySchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: 'Provide at least one field to update.',
  });
export type UpdateContactBody = z.infer<typeof updateContactBodySchema>;
