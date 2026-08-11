/**
 * @file comms/messages/new/page.tsx
 * @description Страница создания нового личного диалога с проверкой существующих
 * @page /dashboard/comms/messages/new
 * @auth required
 * @role MEMBER, ADMIN, SUPER_ADMIN
 *
 * @covers AC-5 (US-21-36): Прямой переход по URL подраздела
 * @covers AC-05 (REQ-COMMS-004): Кнопка «Открыть диалог» для существующих диалогов
 * @covers AC-06 (REQ-COMMS-004): Редирект в существующий диалог при клике
 * @covers AC-07 (REQ-COMMS-004): Обработка 409 → редирект без ErrorMessage
 * @covers EC-04 (REQ-COMMS-004): Клик до завершения предзагрузки → кнопка в Loading
 * @covers FR-09 (REQ-COMMS-004): Предзагрузка списка диалогов
 * @covers AC-7 (R-16, T18): Нет инлайн-компонента UserSelectorList — используется импортированный
 *
 * @spec B029-T5-1
 * - Предзагрузка GET /conversations → Map<participantId, conversationId>
 * - Две кнопки: «Открыть диалог» (редирект) / «Написать» (POST)
 * - Обработка 409 → редирект без ErrorMessage (AC-07)
 * - aria-label различается для двух типов кнопок (NFR-04)
 * - Используется компонент UserSelectorList из features (единственный источник, R-16)
 *
 * @spec B031-T1-1 (исправление регрессии B-030)
 * - existingConversations всегда Map (никогда undefined) — разделение состояний
 * - conversationsLoaded — отдельный флаг «предзагрузка завершена»
 * - finally гарантирует setConversationsLoaded(true) даже при сбое → кнопки не застревают в Loading
 * - catch / ветка пустых данных → setExistingConversations(new Map())
 * - кнопки блокируются через conversationsLoaded (EC-04), визуал по layout B-029 (разделы 3-4)
 *
 * @data-flow
 * - useSession() → redirect /login если нет сессии
 * - useEffect (mount) → GET /conversations → build Map (always Map, finally → conversationsLoaded=true)
 * - UserSelectorList → onSelectUser → POST /conversations | redirect
 *
 * @traces AC-05, AC-06, AC-07, FR-06..09, EC-04, NFR-04
 * @task B029-T5-1, B031-T1-1
 */
'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { apiClient } from '@/lib/api-client';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { Breadcrumbs } from '@/components/layouts/Breadcrumbs';
import { UserSelectorList } from '@/components/features/comms/UserSelectorList';

/** Результат POST /conversations */
interface CreateConversationResult {
  conversationId: string;
  isNew: boolean;
}

/** Элемент списка диалогов из GET /conversations (ConversationListItem из comms.types) */
interface ConversationListItem {
  /** ID диалога */
  conversationId: string;
  /** ID собеседника (другой участник личного диалога) */
  participantId: string;
}

/** Ответ GET /conversations */
interface ConversationListResponse {
  items: ConversationListItem[];
  total: number;
}

/** Типизированное представление 409-ответа для извлечения conversationId из catch-блока */
interface ConflictResponse {
  response?: {
    status?: number;
    data?: {
      data?: { conversationId?: string };
    };
  };
}

/**
 * @page /dashboard/comms/messages/new
 * @description Страница создания нового личного диалога
 */
export default function NewConversationPage(): React.JSX.Element {
  const router = useRouter();
  const { status } = useSession();

  // [B031] Предзагрузка диалогов — existingConversations всегда Map (никогда undefined)
  // FR-09: строим Map<participantId, conversationId> для определения существующих диалогов
  const [existingConversations, setExistingConversations] = useState<Map<string, string>>(
    new Map()
  );

  /** [B031] Флаг «предзагрузка диалогов завершена» — блокирует кнопки до завершения (EC-04) */
  const [conversationsLoaded, setConversationsLoaded] = useState(false);

  /** @spec true пока выполняется POST /conversations */
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Редирект если нет сессии
  useEffect(() => {
    if (status === 'unauthenticated') {
      setTimeout(() => {
        router.replace('/login');
      }, 100);
    }
  }, [status, router]);

  /**
   * @method loadExistingConversations
   * @spec Загрузка списка диалогов текущего пользователя для построения mapping
   *
   * @traces FR-09, EC-04, AC-05, AC-07
   * @task B031-T1-1
   *
   * @behavior
   * - GET /conversations → извлекает DIRECT-диалоги
   * - Строит Map<participantId, conversationId>
   * - existingConversations всегда Map: при успехе/не-успехе/ошибке/пустых данных → new Map()
   * - conversationsLoaded=true в finally гарантирует выход из Loading-состояния даже при сбое
   */
  useEffect(() => {
    if (status !== 'authenticated') return;

    let aborted = false;
    const load = async () => {
      try {
        const response = await apiClient.get<ConversationListResponse>('/conversations');
        if (!aborted && response.success && response.data?.items) {
          const map = new Map<string, string>();
          for (const item of response.data.items) {
            if (item.participantId) {
              map.set(item.participantId, item.conversationId);
            }
          }
          setExistingConversations(map);
        } else if (!aborted) {
          // Не-успешный ответ или пустые данные — mapping пуст, но загрузка завершена
          setExistingConversations(new Map());
        }
      } catch {
        // B-031: сбой предзагрузки — mapping пуст, но загрузка завершена (кнопка «Написать» доступна)
        if (!aborted) {
          setExistingConversations(new Map());
        }
      } finally {
        if (!aborted) {
          setConversationsLoaded(true);
        }
      }
    };
    load();
    return () => {
      aborted = true;
    };
  }, [status]);

  /**
   * @method handleSelectUser
   * @spec Обработка выбора пользователя для начала/продолжения диалога
   *
   * @traces AC-06, AC-07, FR-07, FR-08
   * @task B029-T5-1
   *
   * @param participantId - ID целевого пользователя
   * @param existingConversationId - ID существующего диалога (если известен из mapping)
   *
   * @behavior
   * - Если existingConversationId → немедленный редирект без API (AC-06)
   * - POST /conversations → 201 → редирект в новый диалог
   * - POST /conversations → 409 → извлечь conversationId → редирект (AC-07, без ошибки!)
   * - POST /conversations → другая ошибка → ErrorMessage
   */
  const handleSelectUser = useCallback(
    async (participantId: string, existingConversationId?: string): Promise<void> => {
      // AC-06: Если conversationId уже известен → немедленный редирект
      if (existingConversationId) {
        router.replace(`/dashboard/comms/messages/${existingConversationId}`);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const response = await apiClient.post<CreateConversationResult>(
          '/conversations',
          { participantId }
        );

        if (response.success && response.data?.conversationId) {
          // 201: Новый диалог создан
          router.replace(`/dashboard/comms/messages/${response.data.conversationId}`);
        } else if (response.data?.conversationId) {
          // AC-07: 409 — существующий диалог → редирект БЕЗ ошибки
          router.replace(`/dashboard/comms/messages/${response.data.conversationId}`);
        } else {
          setError(response.error?.message || 'Не удалось начать диалог');
        }
      } catch (err) {
        // P2-2: Обработка 409, если apiClient бросает ошибку при 4xx
        if (err && typeof err === 'object' && 'response' in err) {
          const resp = err as ConflictResponse;
          const conversationId = resp?.response?.data?.data?.conversationId;
          if (
            resp?.response?.status === 409 &&
            typeof conversationId === 'string' &&
            conversationId
          ) {
            // AC-07: Извлекаем conversationId и редиректим, ошибку не показываем
            router.replace(`/dashboard/comms/messages/${conversationId}`);
            setIsLoading(false);
            return;
          }
        }
        setError(err instanceof Error ? err.message : 'Произошла ошибка');
      } finally {
        setIsLoading(false);
      }
    },
    [router]
  );

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-[var(--theme-text-secondary)]">Загрузка...</div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-[var(--theme-danger)]">Требуется авторизация</div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <Breadcrumbs />
      <h1 className="text-2xl font-bold mb-6 text-[var(--theme-text-primary)]">Новый диалог</h1>

      {/* Ошибка (только не-409) */}
      <div className="mb-4">
        <ErrorMessage message={error} />
      </div>

      <UserSelectorList
        onSelectUser={handleSelectUser}
        isLoading={isLoading}
        existingConversations={existingConversations}
        conversationsLoaded={conversationsLoaded}
      />
    </div>
  );
}
