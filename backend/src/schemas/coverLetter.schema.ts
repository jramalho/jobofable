import { z } from 'zod';

const stringArray = z.array(z.coerce.string()).catch([]);
const optionalString = z
  .union([z.string(), z.null(), z.undefined()])
  .transform((value) => (value ? value : undefined))
  .catch(undefined);

/** LLM output for cover letter generation. */
export const coverLetterGenerationSchema = z.object({
  coverLetter: z.coerce.string().catch(''),
  language: z.coerce.string().catch('en'),
  detectedFocusAreas: stringArray,
  warnings: stringArray,
});
export type CoverLetterGeneration = z.infer<typeof coverLetterGenerationSchema>;

export const coverLetterMetaSchema = z.object({
  tone: z.string(),
  language: z.string(),
  companyName: optionalString,
  jobTitle: optionalString,
  detectedFocusAreas: stringArray,
  warnings: stringArray,
});
export type CoverLetterMeta = z.infer<typeof coverLetterMetaSchema>;
