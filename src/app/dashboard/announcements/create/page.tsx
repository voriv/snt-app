/**
 * @page /dashboard/announcements/create (deprecated)
 * @description Редирект на /dashboard/comms/announcements/create
 * @covers AC-1 (US-21-36): Устаревший маршрут перенаправлен в раздел "Общение"
 */
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function CreateAnnouncementRedirectPage(): null {
  const router = useRouter();

  useEffect(() => {
    router.replace('/dashboard/comms/announcements/create');
  }, [router]);

  return null;
}
