import { Textarea } from '../../../components/Textarea';

interface JobDescriptionInputProps {
  value: string;
  error?: string;
  onChange: (value: string) => void;
}

export function JobDescriptionInput({ value, error, onChange }: JobDescriptionInputProps) {
  return (
    <Textarea
      id="job-description"
      label="Job description"
      placeholder="Paste the full job posting here…"
      rows={10}
      value={value}
      error={error}
      onChange={(event) => onChange(event.target.value)}
    />
  );
}
