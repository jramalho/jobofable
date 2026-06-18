import { useState } from 'react';
import { Button } from '../../../components/Button';
import { Card } from '../../../components/Card';
import type { CoverLetterMeta } from '../types/analysis.types';
import { ExportActions } from './ExportActions';

interface CoverLetterEditorProps {
  coverLetter: string;
  meta: CoverLetterMeta | null;
  onChange: (value: string) => void;
  onExportPdf: () => void;
  onExportDocx: () => void;
  isExporting: boolean;
  exportError?: string;
}

export function CoverLetterEditor({
  coverLetter,
  meta,
  onChange,
  onExportPdf,
  onExportDocx,
  isExporting,
  exportError,
}: CoverLetterEditorProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(coverLetter);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Card title="Cover Letter" subtitle={meta ? `Tone: ${meta.tone} · Language: ${meta.language}` : undefined}>
      <div className="space-y-4">
        {meta && meta.warnings.length > 0 && (
          <div className="rounded-lg bg-amber-50 p-3 text-sm text-amber-700 ring-1 ring-amber-200">
            <p className="mb-1 font-medium text-amber-800">Heads up</p>
            <ul className="list-disc space-y-1 pl-5">
              {meta.warnings.map((warning) => (
                <li key={warning}>{warning}</li>
              ))}
            </ul>
          </div>
        )}

        <textarea
          rows={16}
          value={coverLetter}
          onChange={(event) => onChange(event.target.value)}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />

        {meta && meta.detectedFocusAreas.length > 0 && (
          <p className="text-xs text-slate-500">Focus areas: {meta.detectedFocusAreas.join(' · ')}</p>
        )}

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="secondary" onClick={handleCopy}>
            {copied ? 'Copied!' : 'Copy text'}
          </Button>
          <ExportActions
            onExportPdf={onExportPdf}
            onExportDocx={onExportDocx}
            isExporting={isExporting}
            error={exportError}
          />
        </div>
      </div>
    </Card>
  );
}
