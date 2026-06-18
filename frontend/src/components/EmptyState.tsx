import type { ReactNode } from 'react';

interface EmptyStateProps {
  title: string;
  message?: string;
  action?: ReactNode;
}

export function EmptyState({ title, message, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center">
      <p className="text-base font-medium text-slate-900">{title}</p>
      {message && <p className="max-w-md text-sm text-slate-500">{message}</p>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}
