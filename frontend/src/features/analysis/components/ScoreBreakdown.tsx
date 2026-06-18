import { Card } from '../../../components/Card';
import type { CategoryScoreExplanations, CategoryScores } from '../types/analysis.types';

interface ScoreBreakdownProps {
  scores: CategoryScores;
  explanations: CategoryScoreExplanations;
}

const CATEGORY_LABELS: Record<keyof CategoryScores, string> = {
  technicalSkills: 'Technical skills',
  experience: 'Experience',
  seniority: 'Seniority',
  industryFit: 'Industry fit',
  atsKeywords: 'ATS keywords',
};

function barColor(score: number): string {
  if (score >= 75) return 'bg-emerald-500';
  if (score >= 50) return 'bg-amber-500';
  return 'bg-red-500';
}

export function ScoreBreakdown({ scores, explanations }: ScoreBreakdownProps) {
  const categories = Object.keys(CATEGORY_LABELS) as (keyof CategoryScores)[];

  return (
    <Card title="Score breakdown" subtitle="Each score includes a short evidence-based justification.">
      <ul className="space-y-4">
        {categories.map((category) => (
          <li key={category}>
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-slate-700">{CATEGORY_LABELS[category]}</span>
              <span className="font-semibold tabular-nums text-slate-900">{scores[category]}</span>
            </div>
            <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className={`h-full rounded-full ${barColor(scores[category])}`}
                style={{ width: `${scores[category]}%` }}
              />
            </div>
            {explanations[category] && (
              <p className="mt-1 text-xs text-slate-500">{explanations[category]}</p>
            )}
          </li>
        ))}
      </ul>
    </Card>
  );
}
