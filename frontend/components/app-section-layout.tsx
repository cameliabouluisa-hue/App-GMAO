import type { ReactNode } from 'react';

export function AppSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="min-w-0">
      <div className="mb-3 flex items-center gap-3">
        <span className="h-2.5 w-2.5 rounded-full bg-[#06475a]" />

        <h2 className="text-sm font-black uppercase tracking-[0.16em] text-slate-500">
          {title}
        </h2>
      </div>

      <div className="min-w-0 rounded-2xl border border-slate-200 bg-slate-50/70 px-5 py-4">
        {children}
      </div>
    </section>
  );
}
export function AppBadge({
  children,
  tone = 'neutral',
}: {
  children: React.ReactNode;
  tone?: 'neutral' | 'success' | 'danger' | 'warning' | 'info';
}) {
  const tones = {
    neutral: 'bg-white/15 text-white',
    success: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100',
    danger: 'bg-red-50 text-red-700 ring-1 ring-red-100',
    warning: 'bg-orange-50 text-orange-700 ring-1 ring-orange-100',
    info: 'bg-blue-50 text-blue-700 ring-1 ring-blue-100',
  };

  return (
    <span
      className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-black ${tones[tone]}`}
    >
      {children}
    </span>
  );
}
export function AppFieldGrid({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-w-0 gap-x-8 md:grid-cols-2">
      {children}
    </div>
  );
}

export function AppReadField({
  label,
  value,
}: {
  label: string;
  value: ReactNode;
}) {
  return (
    <div className="grid min-w-0 grid-cols-[minmax(130px,0.75fr)_minmax(0,1fr)] items-start gap-4 border-b border-slate-200/70 py-4 last:border-b-0">
      <p className="min-w-0 text-sm font-black text-slate-500">
        {label}
      </p>

      <div className="min-w-0 break-words whitespace-normal text-sm font-black leading-6 text-slate-950">
        {value || '—'}
      </div>
    </div>
  );
}

export function AppFormField({
  label,
  required,
  help,
  children,
}: {
  label: string;
  required?: boolean;
  help?: string;
  children: ReactNode;
}) {
  return (
    <div className="min-w-0 border-b border-slate-200/70 py-4 last:border-b-0">
      <label className="mb-2 block text-sm font-black text-slate-500">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </label>

      {children}

      {help && (
        <p className="mt-2 text-xs font-semibold text-slate-400">
          {help}
        </p>
      )}
    </div>
  );
}

export const appInputClassName =
  'h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-[#06475a] focus:ring-4 focus:ring-[#06475a]/10';

export const appSelectClassName =
  'h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-950 outline-none transition focus:border-[#06475a] focus:ring-4 focus:ring-[#06475a]/10';

export const appTextareaClassName =
  'min-h-28 w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-[#06475a] focus:ring-4 focus:ring-[#06475a]/10';

export const appPrimaryButtonClassName =
  'inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#06475a] px-5 text-sm font-black text-white shadow-sm transition hover:bg-[#043747] disabled:cursor-not-allowed disabled:opacity-60';

export const appSecondaryButtonClassName =
  'inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 text-sm font-black text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60';