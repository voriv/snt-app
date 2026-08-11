'use client';

import { useState, useEffect, useCallback } from 'react';
import type { DocumentWithDetails, UpdateDocumentData } from '@/domains/documents';

/**
 * @hook useDocumentDetail
 * @domain documents
 * @description Хук для загрузки одного документа с деталями
 *
 * @spec
 * - GET /api/v1/documents/:id
 * - Обработка 403 → «Нет доступа»
 * - PUT /api/v1/documents/:id (обновление)
 *
 * @param id - ID документа
 * @returns Состояние и функция перезагрузки
 *
 * @traces US-22-06 AC-1..7
 * @task DOCS-T4.1.4
 */
export function useDocumentDetail(id: string) {
  const [document, setDocument] = useState<DocumentWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);

  const fetchDocument = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/v1/documents/${id}`);
      if (!response.ok) {
        if (response.status === 403) {
          setError('У вас нет доступа к этому документу');
          setLoading(false);
          return;
        }
        if (response.status === 404) {
          setError('Документ не найден');
          setLoading(false);
          return;
        }
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || 'Ошибка загрузки документа');
      }
      const data = await response.json();
      setDocument(data.data as DocumentWithDetails);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Ошибка загрузки документа');
      }
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchDocument();
  }, [fetchDocument]);

  const updateDocument = useCallback(
    async (data: UpdateDocumentData): Promise<DocumentWithDetails | null> => {
      if (!id) return null;
      setUpdating(true);
      setError(null);
      try {
        const response = await fetch(`/api/v1/documents/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error?.message || 'Ошибка обновления документа');
        }

        const responseData = await response.json();
        await fetchDocument();
        return responseData.data as DocumentWithDetails;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Ошибка обновления документа');
        return null;
      } finally {
        setUpdating(false);
      }
    },
    [id, fetchDocument],
  );

  const refetch = useCallback(() => {
    fetchDocument();
  }, [fetchDocument]);

  return {
    document,
    loading,
    error,
    updating,
    refetch,
    updateDocument,
  };
}
