'use client';

import React from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { DocumentDetail } from '@/components/features/documents/DocumentDetail';

/**
 * @page /dashboard/documents/[id]
 * @auth authenticated
 * @description Страница детального просмотра документа
 *
 * @spec
 * - Загрузка документа по ID через DocumentDetail
 * - Обработка 403 → «Нет доступа»
 * - Кнопка «Редактировать» (ADMIN, не archived)
 *
 * @traces US-22-06 AC-1..7
 * @task DOCS-T4.3.4
 */
export default function DocumentDetailPage({ params }: { params: { id: string } }) {
  const { data: session, status } = useSession();
  const router = useRouter();

  if (status === 'loading') {
    return <div role="status">Загрузка...</div>;
  }

  if (status === 'unauthenticated') {
    router.push('/login');
    return null;
  }

  const isAdmin = session?.user?.roles?.includes('ADMIN');

  return (
    <div role="region" aria-label="Детали документа">
      {isAdmin && (
        <Link href={`/dashboard/documents/${params.id}/edit`}>
          <button type="button">Редактировать</button>
        </Link>
      )}
      <DocumentDetail documentId={params.id} />
    </div>
  );
}
