import { Card } from '../../../components/Card';

interface KeywordListProps {
  found: string[];
  missing: string[];
}

export function KeywordList({ found, missing }: KeywordListProps) {
  return (
    <Card
      title="ATS keywords"
      subtitle="Matched literally against your real resume/LinkedIn text — not guessed by the AI."
    >
      <div className="space-y-4">
        <KeywordGroup label={`Found (${found.length})`} keywords={found} tone="positive" />
        <KeywordGroup label={`Missing (${missing.length})`} keywords={missing} tone="negative" />
      </div>
    </Card>
  );
}

function KeywordGroup({
  label,
  keywords,
  tone,
}: {
  label: string;
  keywords: string[];
  tone: 'positive' | 'negative';
}) {
  const chipClass =
    tone === 'positive'
      ? 'bg-emerald-50 text-emerald-700 ring-emerald-200'
      : 'bg-red-50 text-red-700 ring-red-200';

  return (
    <div>
      <p className="mb-2 text-sm font-medium text-slate-700">{label}</p>
      {keywords.length === 0 ? (
        <p className="text-sm text-slate-400">None</p>
      ) : (
        <ul className="flex flex-wrap gap-2">
          {keywords.map((keyword) => (
            <li
              key={keyword}
              className={`rounded-full px-3 py-1 text-xs font-medium ring-1 ${chipClass}`}
            >
              {keyword}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
