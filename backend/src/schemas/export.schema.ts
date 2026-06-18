import { z } from 'zod';
import { optimizedResumeSchema } from './resume.schema';

export const exportResumeBodySchema = z.object({
  resume: optimizedResumeSchema,
  candidateName: z.string().trim().max(120).optional(),
  companyName: z.string().trim().max(120).optional(),
  jobTitle: z.string().trim().max(120).optional(),
});
export type ExportResumeBody = z.infer<typeof exportResumeBodySchema>;

export const exportCoverLetterBodySchema = z.object({
  coverLetter: z
    .string({ required_error: 'Cover letter text is required.' })
    .trim()
    .min(1, 'Cover letter text is required.'),
  candidateName: z.string().trim().max(120).optional(),
  companyName: z.string().trim().max(120).optional(),
  jobTitle: z.string().trim().max(120).optional(),
});
export type ExportCoverLetterBody = z.infer<typeof exportCoverLetterBodySchema>;
