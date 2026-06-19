import { ZodTypeAny, z } from 'zod';
import { ValidationError } from './errors';

/**
 * Parses `data` with a Zod schema, throwing a `ValidationError` (400) carrying
 * the flattened issues on failure. Keeps controllers free of repeated
 * safeParse/throw boilerplate.
 */
export function parseOrThrow<T extends ZodTypeAny>(
  schema: T,
  data: unknown,
  message: string,
): z.infer<T> {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw new ValidationError(message, result.error.flatten());
  }
  return result.data;
}
