/**
 * @page /dashboard/chats (deprecated)
 * @description Редирект на /dashboard/comms/chats
 * @covers AC-1 (US-21-36): Устаревший маршрут перенаправлен в раздел "Общение"
 */
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ChatsRedirectPage(): null {
  const router = useRouter();

  useEffect(() => {
    router.replace('/dashboard/comms/chats');
  }, [router]);

  return null;
}
