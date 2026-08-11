'use client';

import { cn } from '@/shared/utils';

export interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export function Card({ children, className }: CardProps) {
  return (
    <div className={cn('bg-[var(--theme-bg-primary)] border border-[var(--theme-border-color)] shadow-sm rounded-lg', className)}>
      {children}
    </div>
  );
}

export function CardHeader({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('px-6 py-4 border-b border-[var(--theme-border-color)]', className)}>
      {children}
    </div>
  );
}

export function CardTitle({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <h3 className={cn('text-lg font-semibold text-[var(--theme-text-primary)]', className)}>
      {children}
    </h3>
  );
}

export function CardBody({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('px-6 py-4', className)}>{children}</div>;
}

export function CardFooter({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        'px-6 py-4 bg-[var(--theme-bg-secondary)] border-t border-[var(--theme-border-color)] rounded-b-lg',
        className,
      )}
    >
      {children}
    </div>
  );
}
