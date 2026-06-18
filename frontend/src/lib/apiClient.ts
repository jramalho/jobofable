import type { ApiErrorBody } from '../features/analysis/types/analysis.types';

export const API_BASE_URL: string = import.meta.env.VITE_API_URL ?? 'http://localhost:3001/api';

/** Extracts a friendly message from an RTK Query error object. */
export function extractErrorMessage(error: unknown): string {
  if (typeof error === 'object' && error !== null) {
    const maybeFetchError = error as { data?: unknown; error?: string; status?: unknown };
    const data = maybeFetchError.data as ApiErrorBody | undefined;
    if (data?.error?.message) return data.error.message;
    if (typeof maybeFetchError.error === 'string') return maybeFetchError.error;
    if (maybeFetchError.status === 'FETCH_ERROR') {
      return 'Could not reach the server. Is the backend running?';
    }
  }
  return 'Something went wrong. Please try again.';
}

/**
 * Builds a download filename like "jonathan_oliveira_google.pdf" from name +
 * company parts. Accents are stripped (José -> jose); any non-alphanumeric run
 * becomes a single underscore. Falls back to `fallbackBase` when empty.
 */
// Combining diacritical marks (U+0300–U+036F), split out by NFD normalization.
const DIACRITICS = new RegExp('[\\u0300-\\u036f]', 'g');

export function buildExportFilename(
  parts: Array<string | undefined>,
  extension: string,
  fallbackBase: string,
): string {
  const base = parts
    .map((part) =>
      (part ?? '')
        .normalize('NFD')
        .replace(DIACRITICS, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_+|_+$/g, ''),
    )
    .filter(Boolean)
    .join('_');
  return `${base || fallbackBase}.${extension}`;
}

/** Triggers a browser download for a Blob returned by an export endpoint. */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
