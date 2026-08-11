'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { ConversationDetailPage } from '@/components/features/comms/ConversationDetailPage';
import { Breadcrumbs } from '@/components/layouts/Breadcrumbs';
import { useMarkAsRead } from '@/hooks/useMarkAsRead';

/**
 * @page /dashboard/comms/messages/[conversationId]
 * @auth required
 * @description Страница детального просмотра личного диалога
 *
 * @covers AC-5 (US-21-36): Прямой переход по URL подраздела
 * @covers AC-1 (US-39-01): Отметка прочитанных при открытии личного диалога
 * @covers AC-4 (US-39-01): Идемпотентность вызова API
 * @covers AC-5 (US-39-01): Обновление счётчиков непрочитанных
 * @covers AC-6 (US-39-01): Ошибка сети не блокирует интерфейс
 *
 * @spec
 * - Отображает интерфейс диалога с заголовком, списком сообщений и полем ввода
 * - Использует useSession() для проверки авторизации
 * - Редирект на /login при отсутствии сессии
 * - При открытии диалога вызывает useMarkAsRead(conversationId, 'DIRECT')
 *   → PATCH /api/v1/conversations/:id/read (silent fail, не блокирует рендер)
 * - После markAsRead хук обновляет счётчики непрочитанных
 *
 * @task B-026-T6-1
 */
export default function ConversationDetailRoute() {
  const params = useParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  const { markAsRead } = useMarkAsRead();

  const [conversationId, setConversationId] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    if (session?.user?.id) {
      setCurrentUserId(session.user.id);
    }

    if (params?.conversationId) {
      setConversationId(params.conversationId as string);
    }
  }, [session, params]);

  // Обработка аутентификации
  useEffect(() => {
    if (status === 'unauthenticated') {
      setTimeout(() => {
        router.replace('/login');
      }, 100);
    }
  }, [status, router]);

  // Автоматическая отметка прочитанных при открытии личного диалога (AC-1 US-39-01)
  useEffect(() => {
    if (conversationId && status === 'authenticated') {
      markAsRead(conversationId, 'DIRECT');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId, status]);

  // Проверка наличия conversationId и сессии
  if (status === 'loading' || !conversationId || !currentUserId) {
    return (
      <div className="flex items-center justify-center h-full" role="status" aria-live="polite">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--theme-accent)]" aria-hidden="true"></div>
      </div>
    );
  }

  return (
    <div className="h-full w-full flex flex-col">
      <Breadcrumbs />
      <div className="flex-1 overflow-hidden">
        <ConversationDetailPage
          conversationId={conversationId}
          currentUserId={currentUserId}
          onBack={() => router.push('/dashboard/comms/messages')}
        />
      </div>
    </div>
  );
}
