import { Card } from '../../../components/Card';

interface RecommendationListProps {
  recommendations: string[];
  warnings: string[];
}

export function RecommendationList({ recommendations, warnings }: RecommendationListProps) {
  return (
    <Card title="Recommendations & warnings">
      <div className="space-y-4 text-sm">
        {recommendations.length > 0 && (
          <div>
            <p className="mb-1 font-medium text-slate-700">Practical recommendations</p>
            <ul className="space-y-1">
              {recommendations.map((item) => (
                <li key={item} className="flex gap-2 text-slate-600">
                  <span className="text-indigo-500">→</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        {warnings.length > 0 && (
          <div className="rounded-lg bg-amber-50 p-3 ring-1 ring-amber-200">
            <p className="mb-1 font-medium text-amber-800">Warnings</p>
            <ul className="space-y-1">
              {warnings.map((item) => (
                <li key={item} className="flex gap-2 text-amber-700">
                  <span>⚠</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        {recommendations.length === 0 && warnings.length === 0 && (
          <p className="text-slate-400">No recommendations or warnings for this analysis.</p>
        )}
      </div>
    </Card>
  );
}
