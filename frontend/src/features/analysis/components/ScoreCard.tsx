interface ScoreCardProps {
  score: number;
  jobTitle?: string;
  companyName?: string;
}

function scoreColor(score: number): string {
  if (score >= 75) return 'text-emerald-600';
  if (score >= 50) return 'text-amber-600';
  return 'text-red-600';
}

function scoreLabel(score: number): string {
  if (score >= 75) return 'Strong match';
  if (score >= 50) return 'Partial match — worth improving';
  return 'Weak match for this role';
}

export function ScoreCard({ score, jobTitle, companyName }: ScoreCardProps) {
  const target = [jobTitle, companyName].filter(Boolean).join(' @ ');
  return (
    <div className="flex items-center gap-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className={`text-5xl font-bold tabular-nums ${scoreColor(score)}`}>{score}</div>
      <div>
        <p className="text-sm font-medium uppercase tracking-wide text-slate-500">Match score</p>
        <p className="text-base font-semibold text-slate-900">{scoreLabel(score)}</p>
        {target && <p className="mt-1 text-sm text-slate-500">{target}</p>}
      </div>
    </div>
  );
}
