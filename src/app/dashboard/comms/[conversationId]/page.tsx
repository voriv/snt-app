/**
 * @page /dashboard/comms/[conversationId] (legacy)
 * @description Редирект устаревшего маршрута на /dashboard/comms/messages/[conversationId]
 *
 * Ранее разговоры размещались по адресу /dashboard/comms/[conversationId].
 * После реорганизации (T3-3) личные диалоги живут под /dashboard/comms/messages/[conversationId].
 * Этот файл сохраняет обратную совместимость со старыми ссылками.
 *
 * @covers AC-5 (US-21-36): Прямой переход по URL подраздела
 */
'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

export default function LegacyConversationRedirectPage(): null {
  const router = useRouter();
  const params = useParams<{ conversationId: string }>();
  const conversationId = params?.conversationId ?? '';

  useEffect(() => {
    router.replace(`/dashboard/comms/messages/${conversationId}`);
  }, [router, conversationId]);

  return null;
}
