/**
 * @component EmptyState
 * @category ui
 * @description Переиспользуемый компонент для отображения состояния пустого списка
 *
 * @example
 * ```tsx
 * <EmptyState
 *   title="Ничего не найдено"
 *   description="Попробуйте изменить параметры поиска"
 * />
 * ```
 *
 * @spec
 * - Отображает иконку, заголовок и описание
 * - Адаптивный дизайн с центрированным содержимым
 * - Подходит для всех пустых состояний списков и форм
 */
'use client';

export interface EmptyStateProps {
  /** Заголовок пустого состояния */
  title: string;
  /** Описание пустого состояния */
  description: string;
}

export function EmptyState({ title, description }: EmptyStateProps): React.JSX.Element {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
        <svg
          className="h-8 w-8 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
          />
        </svg>
      </div>
      <h3 className="mt-4 text-lg font-semibold text-gray-900">{title}</h3>
      <p className="mt-2 text-sm text-gray-500 max-w-sm">{description}</p>
    </div>
  );
}
