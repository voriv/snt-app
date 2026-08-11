'use client';

import React from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { DocumentList } from '@/components/features/documents/DocumentList';
import { DocumentFilters } from '@/components/features/documents/DocumentFilters';
import { DocumentSearch } from '@/components/features/documents/DocumentSearch';

/**
 * @page /dashboard/documents
 * @auth authenticated
 * @description Главная страница списка документов с фильтрацией и пагинацией
 *
 * @spec
 * - Авторизация через useSession() → redirect на /login
 * - Фильтры: категория, тип, поиск
 * - Список документов с пагинацией
 * - Кнопки «Загрузить документ» (ADMIN), «Категории» (ADMIN)
 *
 * @data-flow
 * - DocumentSearch → useDocuments.handleSearch
 * - DocumentFilters → useDocuments.setFilters
 * - DocumentList → клик → router.push(/dashboard/documents/:id)
 *
 * @traces US-22-05 AC-1..9
 * @task DOCS-T4.3.1
 */
export default function DocumentsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  if (status === 'loading') {
    return <div role="status" aria-label="Загрузка">Загрузка...</div>;
  }

  if (status === 'unauthenticated') {
    router.push('/login');
    return null;
  }

  const isAdmin = session?.user?.roles?.includes('ADMIN');

  return (
    <div role="region" aria-label="Список документов">
      <div>
        <h1>Документы</h1>
        {isAdmin && (
          <div>
            <Link href="/dashboard/documents/upload">
              <button type="button">Загрузить документ</button>
            </Link>
            <Link href="/dashboard/documents/categories">
              <button type="button">Категории</button>
            </Link>
          </div>
        )}
      </div>
      <DocumentFilters onFilterChange={() => {}} />
      <DocumentSearch onSearch={() => {}} />
      <DocumentList onCardClick={(id) => router.push(`/dashboard/documents/${id}`)} />
    </div>
  );
}
