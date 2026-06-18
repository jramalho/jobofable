import { useRef, type ChangeEvent } from 'react';

interface FileUploadProps {
  label: string;
  hint?: string;
  accept: string;
  required?: boolean;
  fileName: string | null;
  error?: string;
  onFileSelected: (file: File | null) => void;
}

export function FileUpload({
  label,
  hint,
  accept,
  required = false,
  fileName,
  error,
  onFileSelected,
}: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    onFileSelected(event.target.files?.[0] ?? null);
  }

  function handleClear() {
    if (inputRef.current) inputRef.current.value = '';
    onFileSelected(null);
  }

  return (
    <div>
      <span className="mb-1.5 block text-sm font-medium text-slate-700">
        {label}
        {!required && <span className="ml-1 font-normal text-slate-400">(optional)</span>}
      </span>
      <div
        className={`flex items-center gap-3 rounded-lg border border-dashed px-4 py-3 ${
          error ? 'border-red-400 bg-red-50' : 'border-slate-300 bg-slate-50'
        }`}
      >
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="rounded-md bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm ring-1 ring-slate-300 hover:bg-slate-50"
        >
          Choose file
        </button>
        {fileName ? (
          <div className="flex min-w-0 items-center gap-2">
            <span className="truncate text-sm text-slate-700">{fileName}</span>
            <button
              type="button"
              onClick={handleClear}
              className="text-sm text-slate-400 hover:text-red-500"
              aria-label={`Remove ${fileName}`}
            >
              ✕
            </button>
          </div>
        ) : (
          <span className="text-sm text-slate-400">{hint ?? 'PDF or DOCX, up to 5 MB'}</span>
        )}
        <input ref={inputRef} type="file" accept={accept} onChange={handleChange} className="hidden" />
      </div>
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
}
