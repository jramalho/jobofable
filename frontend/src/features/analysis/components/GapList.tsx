import { Card } from '../../../components/Card';

interface GapListProps {
  gaps: string[];
  requirementsNotCovered: string[];
  requirementsPartiallyCovered: string[];
}

export function GapList({ gaps, requirementsNotCovered, requirementsPartiallyCovered }: GapListProps) {
  return (
    <Card title="Gaps" subtitle="Honest differences between your profile and the job requirements.">
      <div className="space-y-4 text-sm">
        <ListBlock label="Gaps" items={gaps} marker="text-red-500" />
        <ListBlock label="Requirements not covered" items={requirementsNotCovered} marker="text-red-500" />
        <ListBlock
          label="Requirements partially covered"
          items={requirementsPartiallyCovered}
          marker="text-amber-500"
        />
      </div>
    </Card>
  );
}

function ListBlock({ label, items, marker }: { label: string; items: string[]; marker: string }) {
  if (items.length === 0) return null;
  return (
    <div>
      <p className="mb-1 font-medium text-slate-700">{label}</p>
      <ul className="space-y-1">
        {items.map((item) => (
          <li key={item} className="flex gap-2 text-slate-600">
            <span className={marker}>•</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
