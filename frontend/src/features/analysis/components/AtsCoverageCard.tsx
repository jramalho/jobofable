import { Card } from '../../../components/Card';
import type { AtsCoverage, CoverageBreakdown } from '../types/analysis.types';

interface Props {
  coverage: AtsCoverage;
}

function tone(score: number) {
  if (score >= 80) return { bar: 'bg-emerald-500', text: 'text-emerald-700' };
  if (score >= 50) return { bar: 'bg-amber-500', text: 'text-amber-700' };
  return { bar: 'bg-red-500', text: 'text-red-700' };
}

function hasKeywords(breakdown: CoverageBreakdown): boolean {
  return breakdown.matched.length + breakdown.missing.length > 0;
}

/**
 * Deterministic ATS keyword coverage of the generated resume. Leads with the
 * REQUIRED-skill coverage (what matters most) and only counts keywords the
 * candidate genuinely has, so a high score never means lying.
 */
export function AtsCoverageCard({ coverage }: Props) {
  // Lead with required coverage when the job actually has required skills.
  const showRequired = Boolean(coverage.required && hasKeywords(coverage.required));
  const headline = showRequired ? coverage.required! : coverage;
  const t = tone(headline.score);
  const total = headline.matched.length + headline.missing.length;

  return (
    <Card
      title="ATS keyword coverage"
      subtitle="How many of the job's keywords you actually have made it into the resume."
    >
      <div className="flex items-center gap-3">
        <span className={`text-2xl font-bold ${t.text}`}>{headline.score}%</span>
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
          <div className={`h-full rounded-full ${t.bar}`} style={{ width: `${headline.score}%` }} />
        </div>
      </div>
      <p className="mt-1 text-xs font-medium uppercase tracking-wide text-slate-400">
        {showRequired ? 'Required keywords' : 'Relevant keywords'}
        {showRequired && (
          <span className="ml-2 normal-case text-slate-400">
            · overall incl. nice-to-have: {coverage.score}%
          </span>
        )}
      </p>

      {total === 0 ? (
        <p className="mt-3 text-sm text-slate-500">No matchable keywords were detected for this job.</p>
      ) : headline.missing.length === 0 ? (
        <p className="mt-3 text-sm text-emerald-700">
          All {total} {showRequired ? 'required' : 'relevant'} keywords you have are in the resume.
        </p>
      ) : (
        <div className="mt-3">
          <p className="text-sm text-slate-600">
            You have these and the job wants them, but they aren't in the resume yet, consider adding
            them where truthful:
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {headline.missing.map((keyword) => (
              <span
                key={keyword}
                className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800"
              >
                {keyword}
              </span>
            ))}
          </div>
        </div>
      )}

      {coverage.buried && coverage.buried.length > 0 && (
        <div className="mt-3 border-t border-slate-100 pt-3">
          <p className="text-xs text-slate-500">
            In your resume but buried deep, surface these in the summary or a first bullet for more
            ATS weight:
          </p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {coverage.buried.map((keyword) => (
              <span
                key={keyword}
                className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600"
              >
                {keyword}
              </span>
            ))}
          </div>
        </div>
      )}

      {coverage.acronymSuggestions && coverage.acronymSuggestions.length > 0 && (
        <p className="mt-3 text-xs text-slate-500">
          Spell out both forms for maximum ATS match: {coverage.acronymSuggestions.join(', ')}.
        </p>
      )}

      {coverage.overusedKeywords && coverage.overusedKeywords.length > 0 && (
        <p className="mt-3 border-t border-slate-100 pt-3 text-xs text-amber-700">
          Possible keyword stuffing:{' '}
          {coverage.overusedKeywords.map((o) => `${o.keyword} (${o.count}×)`).join(', ')} — aim for 2-3
          mentions in different contexts.
        </p>
      )}
    </Card>
  );
}
