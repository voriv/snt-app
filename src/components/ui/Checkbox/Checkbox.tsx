'use client';

import { cn } from '@/shared/utils';

export interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function Checkbox({ label, error, className, id, ...props }: CheckboxProps) {
  const checkboxId = id || label?.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className="flex items-center">
      <input
        id={checkboxId}
        type="checkbox"
        className={cn(
          'h-4 w-4 rounded border-[var(--theme-input-border)] text-[var(--theme-accent)] focus:ring-[var(--theme-accent)]',
          className,
        )}
        {...props}
      />
      {label && (
        <label
          htmlFor={checkboxId}
          className="ml-2 block text-sm text-[var(--theme-text-primary)]"
        >
          {label}
        </label>
      )}
    </div>
  );
}
