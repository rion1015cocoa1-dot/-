'use client';

import { cn } from '@/utils/cn';

interface ToggleProps {
  checked: boolean;
  onChange: (value: boolean) => void;
  label: string;
}

export function Toggle({ checked, onChange, label }: ToggleProps) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm"
    >
      <span className="text-sm font-semibold text-slate-700">{label}</span>
      <span
        className={cn(
          'flex h-6 w-12 items-center rounded-full bg-slate-300 px-1 transition-all',
          checked && 'bg-brand'
        )}
      >
        <span
          className={cn(
            'h-5 w-5 rounded-full bg-white shadow transition-transform',
            checked ? 'translate-x-6' : 'translate-x-0'
          )}
        />
      </span>
    </button>
  );
}
