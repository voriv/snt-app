/**
 * @page CommsPage
 * @auth required
 * @redirect /dashboard/comms/messages
 *
 * @covers AC-2 (US-21-36): Редирект /dashboard/comms → /dashboard/comms/messages
 * @see docs/specs/comms/component-spec.md → 3.4.2
 *
 * @spec
 * - Client Component
 * - Мгновенный редирект на /dashboard/comms/messages
 * - Return null (не рендерит контент)
 */
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Страница-редирект: /dashboard/comms → /dashboard/comms/messages.
 *
 * Редирект выполняется в useEffect для безопасности side-эффекта.
 *
 * @returns null
 */
export default function CommsPage(): null {
  const router = useRouter();

  useEffect(() => {
    router.replace('/dashboard/comms/messages');
  }, [router]);

  return null;
}
