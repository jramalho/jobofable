interface LoadingStateProps {
  title?: string;
  message?: string;
}

export function LoadingState({
  title = 'Working on it…',
  message = 'This can take up to a minute while the AI analyzes your documents.',
}: LoadingStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white p-10 text-center shadow-sm">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
      <p className="text-base font-medium text-slate-900">{title}</p>
      <p className="max-w-md text-sm text-slate-500">{message}</p>
    </div>
  );
}
