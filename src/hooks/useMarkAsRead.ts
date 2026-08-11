'use client';

import { useCallback, useRef, useState } from 'react';
import { apiClient } from '@/lib/api-client';
import type { ConversationType } from '@/domains/comms/comms.types';

/**
 * @hook useMarkAsRead
 * @domain comms
 * @description Хук для автоматической отметки сообщений как прочитанных при открытии диалога/чата
 *
 * @returns { markAsRead, isMarking }
 *
 * @spec
 * - markAsRead(conversationId, type) вызывает PATCH /read endpoint
 * - type='DIRECT' → PATCH /api/v1/conversations/:id/read
 * - type='GROUP' → PATCH /api/v1/chats/:id/read
 * - После успеха — refetch GET /api/v1/comms/unread-counts
 * - Silent fail при ошибке сети (AC-6): ошибка не выбрасывается наружу, UI не блокируется
 * - isMarking предотвращает дублирующиеся вызовы (BR-09)
 *
 * @traces US-39-01 AC-1, AC-2, AC-4, AC-5, AC-6
 * @task B-026-T5-1
 *
 * @see docs/user-stories/US-39-01-автоматическая-отметка-прочитанных.md
 */

/**
 * @typedef {Object} UseMarkAsReadResult
 * @property {(conversationId: string, type: ConversationType) => Promise<void>} markAsRead - Функция отметки прочитанных
 * @property {boolean} isMarking - Флаг выполнения запроса (для предотвращения дублей)
 */
export interface UseMarkAsReadResult {
  markAsRead: (conversationId: string, type: ConversationType) => Promise<void>;
  isMarking: boolean;
}

export function useMarkAsRead(): UseMarkAsReadResult {
  /** Флаг выполнения запроса для предотвращения дублирующихся вызовов */
  const [isMarking, setIsMarking] = useState(false);
  /** Ref-флаг для синхронной защиты от дублей внутри асинхронной функции */
  const markingRef = useRef(false);

  const markAsRead = useCallback(
    async (conversationId: string, type: ConversationType): Promise<void> => {
      // Защита от дублирующихся вызовов при быстром переключении (EC-02 US-39-01)
      if (markingRef.current) return;
      markingRef.current = true;
      setIsMarking(true);

      try {
        // type='DIRECT' → /conversations/:id/read
        // type='GROUP' → /chats/:id/read
        const endpoint =
          type === 'GROUP'
            ? `/chats/${conversationId}/read`
            : `/conversations/${conversationId}/read`;

        await apiClient.patch<{ success: boolean }>(endpoint, {});

        // После успеха — refetch счётчиков непрочитанных (AC-5 US-39-01, AC-7 US-21-37)
        apiClient
          .get<{ messages: number; chats: number }>('/comms/unread-counts')
          .catch(() => {
            // Silent fail: счётчики обновятся при следующей загрузке вкладок
          });
      } catch {
        // Silent fail: ошибка сети/API не блокирует UI (BR-09, AC-6)
        // Статус прочтения обновится при следующем обращении к диалогу
      } finally {
        markingRef.current = false;
        setIsMarking(false);
      }
    },
    [],
  );

  return { markAsRead, isMarking };
}

export default useMarkAsRead;
