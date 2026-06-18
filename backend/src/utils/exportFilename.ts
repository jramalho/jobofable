/**
 * Builds a download filename like "jonathan_oliveira_google.pdf" from a
 * candidate name + company name. Accents are stripped (José -> jose) and any
 * non-alphanumeric run becomes a single underscore. Falls back to a default
 * base when no usable parts are given.
 */
export function buildExportFilename(
  parts: Array<string | undefined>,
  extension: string,
  fallbackBase: string,
): string {
  const base = parts.map(slugify).filter(Boolean).join('_');
  return `${base || fallbackBase}.${extension}`;
}

// Combining diacritical marks (U+0300–U+036F), split out by NFD normalization.
const DIACRITICS = new RegExp('[\\u0300-\\u036f]', 'g');

function slugify(value?: string): string {
  return (value ?? '')
    .normalize('NFD')
    .replace(DIACRITICS, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}
