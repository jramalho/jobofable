import { z } from 'zod';

const stringArray = z.array(z.coerce.string()).catch([]);
const optionalString = z
  .union([z.string(), z.null(), z.undefined()])
  .transform((value) => (value ? value : undefined))
  .catch(undefined);

export const resumeHeaderSchema = z
  .object({
    name: optionalString,
    title: optionalString,
    location: optionalString,
    phone: optionalString,
    email: optionalString,
    linkedin: optionalString,
    github: optionalString,
    website: optionalString,
  })
  .catch({});
export type ResumeHeader = z.infer<typeof resumeHeaderSchema>;

export const optimizedResumeSchema = z.object({
  header: resumeHeaderSchema.default({}),
  summary: z.coerce.string().catch(''),
  skills: z
    .array(
      z.object({
        category: z.coerce.string().catch('Skills'),
        items: stringArray,
      }),
    )
    .catch([]),
  experience: z
    .array(
      z.object({
        company: z.coerce.string().catch(''),
        title: z.coerce.string().catch(''),
        location: optionalString,
        startDate: optionalString,
        endDate: optionalString,
        bullets: stringArray,
      }),
    )
    .catch([]),
  projects: z
    .array(
      z.object({
        name: z.coerce.string().catch(''),
        description: z.coerce.string().catch(''),
        technologies: stringArray,
        bullets: stringArray,
      }),
    )
    .catch([]),
  education: z
    .array(
      z.object({
        institution: z.coerce.string().catch(''),
        degree: optionalString,
        field: optionalString,
        startDate: optionalString,
        endDate: optionalString,
      }),
    )
    .catch([]),
  certifications: z
    .array(
      z.object({
        name: z.coerce.string().catch(''),
        issuer: optionalString,
        date: optionalString,
      }),
    )
    .catch([]),
  languages: z
    .array(
      z.object({
        language: z.coerce.string().catch(''),
        level: optionalString,
      }),
    )
    .catch([]),
});

export type OptimizedResume = z.infer<typeof optimizedResumeSchema>;
