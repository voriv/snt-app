'use client';

import { cn } from '@/shared/utils';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  children: React.ReactNode;
}

export function Select({ label, error, className, children, id, ...props }: SelectProps) {
  const selectId = id || label?.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={selectId}
          className="block text-sm font-medium text-[var(--theme-text-primary)] mb-1"
        >
          {label}
        </label>
      )}
      <select
        id={selectId}
        className={cn(
          'block w-full rounded-md border-[var(--theme-input-border)] bg-[var(--theme-input-bg)] text-[var(--theme-input-text)] shadow-sm focus:border-[var(--theme-accent)] focus:ring-[var(--theme-accent)] sm:text-sm px-3 py-2',
          error && 'border-[var(--theme-danger)] focus:border-[var(--theme-danger)] focus:ring-[var(--theme-danger)]',
          className,
        )}
        {...props}
      >
        {children}
      </select>
      {error && (
        <p className="mt-1 text-sm text-[var(--theme-danger)]">{error}</p>
      )}
    </div>
  );
}
