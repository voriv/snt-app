'use client';

import React from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
// import { DocumentEditForm } from '@/components/features/documents/DocumentEditForm';

/**
 * @page /dashboard/documents/[id]/edit
 * @auth admin
 * @description Страница редактирования метаданных документа
 *
 * @spec
 * - DocumentEditForm
 * - Проверка ADMIN
 * - Блокировка для archived документов
 *
 * @traces US-22-07 AC-1..8
 * @task DOCS-T4.3.5
 */
export default function EditDocumentPage({ params }: { params: { id: string } }) {
  const { data: session, status } = useSession();
  const router = useRouter();

  if (status === 'loading') {
    return <div role="status">Загрузка...</div>;
  }

  if (status === 'unauthenticated' || !session?.user?.roles?.includes('ADMIN')) {
    router.push('/login');
    return null;
  }

  return (
    <div role="region" aria-label="Редактирование документа">
      <h1>Редактирование документа</h1>
      {/* [TODO] DocumentEditForm — DOCS-T4.3.5 */}
      <p>Форма редактирования документа {params.id}</p>
    </div>
  );
}
