/**
 * Normalizes a company name into a stable identity key used to de-duplicate
 * companies (find-or-create). It lowercases, trims, collapses repeated
 * whitespace, and drops punctuation that does not affect identity ("Acme, Inc."
 * and "acme  inc" both become "acme inc"). Letters (incl. accented) and digits
 * are kept; everything else becomes a single space.
 */
export function normalizeCompanyName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
