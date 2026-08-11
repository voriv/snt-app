'use client';

import { useEffect, useRef, useState } from 'react';
import { apiClient } from '@/lib/api-client';

/**
 * @type UnreadCounts
 * @domain comms
 * @description Счётчики непрочитанных сообщений из GET /api/v1/comms/unread-counts
 *
 * @spec
 * - messages — сумма непрочитанных во всех личных диалогах (DIRECT)
 * - chats — сумма непрочитанных во всех групповых чатах (GROUP)
 */
export interface UnreadCounts {
  messages: number;
  chats: number;
}

/**
 * @typedef {Object} UseUnreadCountsResult
 * @property {UnreadCounts | null} counts - Счётчики из API; null до загрузки или при ошибке
 * @property {boolean} loading - true во время выполнения запроса
 * @property {string | null} error - Сообщение об ошибке ('Не удалось загрузить счётчики' / 'Ошибка сети')
 */
export interface UseUnreadCountsResult {
  counts: UnreadCounts | null;
  loading: boolean;
  error: string | null;
}

/**
 * @hook useUnreadCounts
 * @domain comms
 * @description Единый хук для загрузки счётчиков непрочитанных сообщений
 *
 * Вызывает GET /api/v1/comms/unread-counts при mount и при изменении refetchTrigger.
 * Используется в Navbar (с pathname как триггер) и CommsTabs (с существующим refetchTrigger),
 * чтобы глобальный бейдж и бейджи на вкладках всегда оставались синхронизированными.
 *
 * @param refetchTrigger - Триггер повторной загрузки (для Navbar — pathname, для CommsTabs — refetchTrigger)
 * @returns { counts, loading, error }
 *
 * @example
 * ```tsx
 * const pathname = usePathname();
 * const { counts, loading, error } = useUnreadCounts(pathname);
 * ```
 *
 * @spec
 * - Загружает GET /api/v1/comms/unread-counts при mount и при изменении refetchTrigger
 * - Возвращает { counts, loading, error }
 * - counts = { messages: number, chats: number } | null
 * - Abort-механизм: при демонтаже / смене триггера отменяет устаревший запрос (защита от гонок)
 * - Silent fail: при ошибке сети/API — error заполняется, исключение не выбрасывается; навигация не блокируется
 * - Бейджи скрываются при loading === true или error !== null (BR-10)
 *
 * @traces US-21-37 AC-3, AC-5, AC-7, AC-8, AC-9
 * @task B-027-T4-1
 *
 * @see docs/user-stories/US-21-37-счетчики-непрочитанных-на-вкладках.md
 * @see docs/design/layouts/comms/B-027-unread-count-sync-layout.md §2
 */
export function useUnreadCounts(refetchTrigger?: unknown): UseUnreadCountsResult {
  /** Счётчики; null до загрузки или при ошибке. При refetch сохраняет прежнее значение (S-6). */
  const [counts, setCounts] = useState<UnreadCounts | null>(null);
  /** Флаг загрузки */
  const [loading, setLoading] = useState(true);
  /** Сообщение об ошибке (silent fail — не выбрасывается) */
  const [error, setError] = useState<string | null>(null);
  /** Ref для сброса loading при мгновенной смене триггера (защита от гонок) */
  const mountedRef = useRef(true);

  useEffect(() => {
    let aborted = false;
    mountedRef.current = true;

    const loadCounts = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await apiClient.get<UnreadCounts>('/comms/unread-counts');
        if (aborted) return;
        if (response.success && response.data) {
          setCounts(response.data);
        } else {
          setError('Не удалось загрузить счётчики');
        }
      } catch {
        // Silent fail: ошибка сети/API не блокирует навигацию (AC-12, BR-10)
        if (aborted) return;
        setError('Не удалось загрузить счётчики');
      } finally {
        if (!aborted) {
          setLoading(false);
        }
      }
    };

    loadCounts();

    return () => {
      aborted = true;
      mountedRef.current = false;
    };
  }, [refetchTrigger]);

  return { counts, loading, error };
}

export default useUnreadCounts;
