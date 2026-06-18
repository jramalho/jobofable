import { COVER_LETTER_TONES, type CoverLetterTone } from '../types/analysis.types';

interface CoverLetterToneSelectProps {
  value: CoverLetterTone;
  onChange: (value: CoverLetterTone) => void;
}

const TONE_LABELS: Record<CoverLetterTone, string> = {
  professional: 'Professional — polished and warm',
  direct: 'Direct — short and concrete',
  confident: 'Confident — assertive, no arrogance',
  human: 'Human — conversational and personable',
  executive: 'Executive — strategic and outcome-focused',
};

export function CoverLetterToneSelect({ value, onChange }: CoverLetterToneSelectProps) {
  return (
    <div>
      <label htmlFor="cover-letter-tone" className="mb-1.5 block text-sm font-medium text-slate-700">
        Cover letter tone
      </label>
      <select
        id="cover-letter-tone"
        value={value}
        onChange={(event) => onChange(event.target.value as CoverLetterTone)}
        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
      >
        {COVER_LETTER_TONES.map((tone) => (
          <option key={tone} value={tone}>
            {TONE_LABELS[tone]}
          </option>
        ))}
      </select>
    </div>
  );
}
