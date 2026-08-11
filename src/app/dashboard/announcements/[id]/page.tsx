/**
 * @page /dashboard/announcements/[id] (deprecated)
 * @description Редирект на /dashboard/comms/announcements/[id]
 * @covers AC-1 (US-21-36): Устаревший маршрут перенаправлен в раздел "Общение"
 */
'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

export default function AnnouncementRedirectPage(): null {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params?.id ?? '';

  useEffect(() => {
    router.replace(`/dashboard/comms/announcements/${id}`);
  }, [router, id]);

  return null;
}
