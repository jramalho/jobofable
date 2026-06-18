/**
 * Restores spacing in a person's name that PDF/DOCX text extraction glued
 * together (e.g. "JonathanOliveira" -> "Jonathan Oliveira"). Splits on
 * camelCase and uppercase-run boundaries, accents included.
 *
 * A fully lowercase glued name ("jonathanoliveira") cannot be split reliably
 * without a dictionary, so it is returned unchanged — the prompt is the better
 * guard for that case.
 */
export function normalizePersonName(name?: string): string | undefined {
  if (!name) return name;
  const spaced = name
    // lower/upper boundary: joãoSilva -> joão Silva
    .replace(/([a-zà-ÿ])([A-ZÀ-Þ])/g, '$1 $2')
    // end of an uppercase run before a capitalized word: JOAOSilva -> JOAO Silva
    .replace(/([A-ZÀ-Þ]+)([A-ZÀ-Þ][a-zà-ÿ])/g, '$1 $2')
    .replace(/\s+/g, ' ')
    .trim();
  return spaced || undefined;
}
