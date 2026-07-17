'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { ConversationDetailPage } from '@/components/features/comms/ConversationDetailPage';

/**
 * @page /dashboard/comms/[conversationId]
 * @auth required
 * @description Страница детального просмотра диалога
 *
 * @spec
 * - Отображает интерфейс диалога с заголовком, списком сообщений и полем ввода
 * - Использует useSession() для проверки авторизации
 * - Редирект на /login при отсутствии сессии
 * - Данные загружаются через apiClient
 */
export default function ConversationDetailRoute() {
  const params = useParams();
  const router = useRouter();
  const { data: session, status } = useSession();

  const [conversationId, setConversationId] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    // Устанавливаем ID текущего пользователя из сессии
    if (session?.user?.id) {
      setCurrentUserId(session.user.id);
    }

    // Устанавливаем conversationId из URL параметров
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

  // Проверка наличия conversationId и сессии
  if (status === 'loading' || !conversationId || !currentUserId) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="h-screen w-full">
      <ConversationDetailPage
        conversationId={conversationId}
        currentUserId={currentUserId}
        onBack={() => router.push('/dashboard/comms')}
      />
    </div>
  );
}
