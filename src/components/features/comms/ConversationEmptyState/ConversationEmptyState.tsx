/**
 * @component ConversationEmptyState
 * @category features/comms
 * @description Компонент пустого состояния для списка диалогов
 *
 * @example
 * ```tsx
 * <ConversationEmptyState />
 * ```
 *
 * @spec
 * - Отображает иконку сообщений
 * - Заголовок: "Нет личных диалогов"
 * - Дополнительный текст: "Начните новый диалог"
 * - Кнопка "Написать сообщение" — переход на /dashboard/messages/new
 */
'use client';

import { useRouter } from 'next/navigation';

export function ConversationEmptyState(): React.JSX.Element {
  const router = useRouter();

  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
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
            d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
          />
        </svg>
      </div>
      <h3 className="mt-4 text-lg font-semibold text-gray-900">
        Нет личных диалогов
      </h3>
      <p className="mt-2 text-sm text-gray-500 max-w-sm">
        Начните новый диалог
      </p>
      <button
        type="button"
        onClick={() => router.push('/dashboard/messages/new')}
        className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors"
      >
        <svg
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 4.5v15m7.5-7.5h-15"
          />
        </svg>
        Написать сообщение
      </button>
    </div>
  );
}
