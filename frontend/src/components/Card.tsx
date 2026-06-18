import type { ReactNode } from 'react';

interface CardProps {
  title?: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
}

export function Card({ title, subtitle, children, className = '' }: CardProps) {
  return (
    <section className={`rounded-xl border border-slate-200 bg-white p-6 shadow-sm ${className}`}>
      {title && <h2 className="text-base font-semibold text-slate-900">{title}</h2>}
      {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
      <div className={title || subtitle ? 'mt-4' : ''}>{children}</div>
    </section>
  );
}
