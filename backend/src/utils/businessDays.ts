/**
 * Returns a new Date `days` business days after `from`, skipping Saturdays and
 * Sundays. Used to schedule the default follow-up after an application is sent.
 */
export function addBusinessDays(from: Date, days: number): Date {
  const result = new Date(from);
  let added = 0;
  while (added < days) {
    result.setDate(result.getDate() + 1);
    const weekday = result.getDay();
    if (weekday !== 0 && weekday !== 6) added += 1;
  }
  return result;
}
