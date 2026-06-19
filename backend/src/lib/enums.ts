/**
 * Canonical values for the logical enums persisted as `String` columns.
 *
 * Prisma's SQLite connector does not support native `enum` blocks, so these
 * constants are the single source of truth the application layer should use
 * when reading/writing the `status` and `type` fields. Keep them in sync with
 * the comments in `prisma/schema.prisma`.
 */

export const APPLICATION_STATUSES = [
  'saved',
  'applied',
  'recruiter_screen',
  'technical_interview',
  'assignment',
  'final_interview',
  'offer',
  'rejected',
  'ghosted',
  'withdrawn',
] as const;
export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];

export const GENERATED_DOCUMENT_TYPES = ['resume', 'coverLetter'] as const;
export type GeneratedDocumentType = (typeof GENERATED_DOCUMENT_TYPES)[number];

export const FOLLOW_UP_STATUSES = ['pending', 'completed', 'dismissed'] as const;
export type FollowUpStatus = (typeof FOLLOW_UP_STATUSES)[number];

export function isApplicationStatus(value: string): value is ApplicationStatus {
  return (APPLICATION_STATUSES as readonly string[]).includes(value);
}

export function isGeneratedDocumentType(value: string): value is GeneratedDocumentType {
  return (GENERATED_DOCUMENT_TYPES as readonly string[]).includes(value);
}

export function isFollowUpStatus(value: string): value is FollowUpStatus {
  return (FOLLOW_UP_STATUSES as readonly string[]).includes(value);
}
