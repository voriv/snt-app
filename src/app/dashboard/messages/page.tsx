/**
 * @page /dashboard/messages (deprecated)
 * @description Редирект на /dashboard/comms/messages
 * @covers AC-1 (US-21-36): Устаревший маршрут перенаправлен в раздел "Общение"
 */
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function MessagesRedirectPage(): null {
  const router = useRouter();

  useEffect(() => {
    router.replace('/dashboard/comms/messages');
  }, [router]);

  return null;
}
