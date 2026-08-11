/**
 * @component ConversationEmptyState
 * @category features/comms
 * @description Компонент пустого состояния для списка диалогов (DS EmptyState + CTA Button)
 *
 * @example
 * ```tsx
 * <ConversationEmptyState />
 * ```
 *
 * @spec
 * - Использует <EmptyState> из дизайн-системы
 * - Заголовок: "Нет личных диалогов"
 * - Дополнительный текст: "Начните новый диалог"
 * - CTA-кнопка "Написать сообщение" — переход на /dashboard/comms/messages/new
 *
 * @covers AC-6 (R-22): ConversationEmptyState использует <EmptyState> DS
 * @covers AC-1 (R-13): CTA-кнопка через <Button>
 */
'use client';

import { useRouter } from 'next/navigation';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';

export function ConversationEmptyState(): React.JSX.Element {
  const router = useRouter();

  return (
    <div>
      <EmptyState
        title="Нет личных диалогов"
        description="Начните новый диалог"
      />
      <div className="mt-4 flex justify-center">
        <Button
          variant="primary"
          type="button"
          onClick={() => router.push('/dashboard/comms/messages/new')}
        >
          Написать сообщение
        </Button>
      </div>
    </div>
  );
}
