'use client';

import { cn } from '@/shared/utils';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  className?: string;
}

const variants = {
  default: 'bg-[var(--theme-bg-secondary)] text-[var(--theme-text-secondary)]',
  success: 'bg-[var(--theme-success)]/10 text-[var(--theme-success)]',
  warning: 'bg-[var(--theme-warning)]/10 text-[var(--theme-warning)]',
  danger: 'bg-[var(--theme-danger)]/10 text-[var(--theme-danger)]',
  info: 'bg-[var(--theme-info)]/10 text-[var(--theme-info)]',
};

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
        variants[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}
