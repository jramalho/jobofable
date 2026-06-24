/**
 * Replaces "travessão" dashes (em dash —, horizontal bar ―, and en dash – when
 * used as a pause) with commas, so generated prose reads like a person wrote it.
 * Regular hyphens in compound words ("real-time", "well-known") and numeric
 * ranges ("2019–2022") are left untouched. Used for both cover letters and the
 * resume's prose (summary + bullets).
 */
export function removeProseDashes(text: string): string {
  let out = text
    // em dash / horizontal bar are never ranges → always a comma pause
    .replace(/\s*[—―]\s*/g, ', ')
    // en dash only when spaced ("foo – bar"); spares ranges like "2019–2022"
    .replace(/\s+–\s+/g, ', ');

  // Tidy punctuation the replacement may have introduced.
  out = out
    .replace(/,\s*,/g, ', ') // ", ," -> ", "
    .replace(/\s+,/g, ',') // " ," -> ","
    .replace(/,(\s*[.!?;:])/g, '$1') // ", ." -> "."
    .replace(/^[ \t]*,[ \t]*/gm, '') // leading comma on a line
    .replace(/[ \t]*,[ \t]*$/gm, ''); // trailing comma on a line

  return out;
}
