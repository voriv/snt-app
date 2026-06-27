import React from 'react';
import { cn } from '@/lib/utils';

/**
 * Пропсы для компонента Spinner.
 *
 * @public
 */
export interface SpinnerProps {
  /** Размер спиннера: sm | md | lg */
  size?: 'sm' | 'md' | 'lg';
  /** Дополнительные классы Tailwind */
  className?: string;
}

/**
 * Компонент индикатора загрузки.
 *
 * @public
 */
export function Spinner({ size = 'md', className }: SpinnerProps): React.ReactElement {
  const sizeClasses = {
    sm: 'h-4 w-4 border-2',
    md: 'h-8 w-8 border-4',
    lg: 'h-12 w-12 border-4',
  };

  return (
    <div
      className={cn(
        'animate-spin rounded-full border-t-transparent',
        sizeClasses[size],
        'border-[var(--color-accent)]',
        className
      )}
      role="status"
      aria-label="Загрузка"
    />
  );
}
