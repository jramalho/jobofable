import { AI_PROVIDERS, type AIProviderName } from '../types/analysis.types';

interface ProviderSelectProps {
  value: AIProviderName;
  onChange: (value: AIProviderName) => void;
}

const PROVIDER_LABELS: Record<AIProviderName, string> = {
  groq: 'Groq (cloud, fast)',
  ollama: 'Ollama (local, private)',
};

export function ProviderSelect({ value, onChange }: ProviderSelectProps) {
  return (
    <div>
      <label htmlFor="ai-provider" className="mb-1.5 block text-sm font-medium text-slate-700">
        AI provider
      </label>
      <select
        id="ai-provider"
        value={value}
        onChange={(event) => onChange(event.target.value as AIProviderName)}
        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
      >
        {AI_PROVIDERS.map((provider) => (
          <option key={provider} value={provider}>
            {PROVIDER_LABELS[provider]}
          </option>
        ))}
      </select>
    </div>
  );
}
