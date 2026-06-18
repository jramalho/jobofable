import { useState } from 'react';
import { Button } from '../../../components/Button';
import { Card } from '../../../components/Card';
import type { ExperienceEntry, KeywordSelection } from '../types/analysis.types';

interface MissingKeywordSelectorProps {
  missingKeywords: string[];
  experiences: ExperienceEntry[];
  appliedKeywords: string[];
  isApplying: boolean;
  error?: string;
  warnings: string[];
  onApply: (selections: KeywordSelection[]) => void;
}

interface TargetOption {
  value: string;
  label: string;
}

/**
 * Lets the user pick which missing ATS keywords to add to the generated
 * resume — and where. Each keyword can target multiple places at once
 * (skills, summary and/or specific experiences). Applying triggers a new
 * AI round on the backend.
 */
export function MissingKeywordSelector({
  missingKeywords,
  experiences,
  appliedKeywords,
  isApplying,
  error,
  warnings,
  onApply,
}: MissingKeywordSelectorProps) {
  const [targets, setTargets] = useState<Record<string, string[]>>({});

  if (missingKeywords.length === 0) return null;

  const targetOptions: TargetOption[] = [
    { value: 'skills', label: 'Skills' },
    { value: 'summary', label: 'Summary' },
    ...experiences.map((role, index) => ({ value: `exp:${index}`, label: role.company })),
  ];

  const selectedCount = Object.values(targets).reduce((total, values) => total + values.length, 0);

  function toggleTarget(keyword: string, value: string) {
    setTargets((previous) => {
      const current = previous[keyword] ?? [];
      const next = current.includes(value)
        ? current.filter((entry) => entry !== value)
        : [...current, value];
      return { ...previous, [keyword]: next };
    });
  }

  function handleApply() {
    const selections: KeywordSelection[] = [];
    for (const [keyword, values] of Object.entries(targets)) {
      for (const value of values) {
        if (value === 'skills' || value === 'summary') {
          selections.push({ keyword, target: value });
        } else if (value.startsWith('exp:')) {
          selections.push({ keyword, target: 'experience', experienceIndex: Number(value.slice(4)) });
        }
      }
    }
    if (selections.length > 0) onApply(selections);
  }

  return (
    <Card
      title="Add missing keywords"
      subtitle="Pick the keywords you genuinely have experience with and every place they belong — you can target several experiences and sections at once. A new AI round weaves them in; only add what you can back up in an interview."
    >
      <ul className="divide-y divide-slate-100">
        {missingKeywords.map((keyword) => {
          const isApplied = appliedKeywords.includes(keyword);
          const selected = targets[keyword] ?? [];
          return (
            <li key={keyword} className="flex flex-wrap items-center justify-between gap-3 py-2.5">
              <span
                className={`rounded-full px-3 py-1 text-xs font-medium ring-1 ${
                  isApplied
                    ? 'bg-emerald-50 text-emerald-700 ring-emerald-200'
                    : 'bg-red-50 text-red-700 ring-red-200'
                }`}
              >
                {keyword}
              </span>
              {isApplied ? (
                <span className="text-xs font-medium text-emerald-600">Added ✓</span>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {targetOptions.map((option) => {
                    const isOn = selected.includes(option.value);
                    return (
                      <button
                        key={option.value}
                        type="button"
                        disabled={isApplying}
                        onClick={() => toggleTarget(keyword, option.value)}
                        aria-pressed={isOn}
                        className={`rounded-full px-2.5 py-1 text-xs font-medium ring-1 transition-colors disabled:opacity-50 ${
                          isOn
                            ? 'bg-indigo-600 text-white ring-indigo-600'
                            : 'bg-white text-slate-600 ring-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        {option.label}
                      </button>
                    );
                  })}
                </div>
              )}
            </li>
          );
        })}
      </ul>

      {warnings.length > 0 && (
        <div className="mt-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-700 ring-1 ring-amber-200">
          <ul className="list-disc space-y-1 pl-5">
            {warnings.map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
          </ul>
        </div>
      )}
      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      <div className="mt-4 flex items-center justify-between">
        <p className="text-sm text-slate-500">
          {selectedCount === 0
            ? 'No placements selected'
            : `${selectedCount} placement${selectedCount > 1 ? 's' : ''} selected`}
        </p>
        <Button onClick={handleApply} disabled={isApplying || selectedCount === 0}>
          {isApplying ? 'Weaving keywords…' : 'Apply to resume'}
        </Button>
      </div>
    </Card>
  );
}
