'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { DocumentWithDetails, DocumentFilter, PaginatedResult } from '@/domains/documents';

/**
 * @hook useDocuments
 * @domain documents
 * @description Хук для загрузки списка документов с фильтрацией и пагинацией
 *
 * @spec
 * - Загружает данные при mount и изменении фильтров
 * - Debounce для search (300ms)
 * - Возвращает: documents, loading, error, total, page
 * - Функции: setFilters, setPage, refetch
 *
 * @param initialFilters - Начальные фильтры
 * @returns Состояние и функции управления списком документов
 *
 * @traces US-22-05 AC-1..9
 * @task DOCS-T4.1.1
 */
export function useDocuments(initialFilters?: DocumentFilter) {
  const [documents, setDocuments] = useState<DocumentWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPageState] = useState(1);
  const [filters, setFiltersState] = useState<DocumentFilter>(initialFilters ?? {});
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [debouncedSearch, setDebouncedSearch] = useState<string | undefined>();

  const setPage = useCallback((p: number) => {
    setPageState(p);
  }, []);

  const setFilters = useCallback((newFilters: DocumentFilter) => {
    setFiltersState(newFilters);
    setPageState(1);
  }, []);

  useEffect(() => {
    const fetchDocuments = async () => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        if (filters.categoryId) params.set('categoryId', filters.categoryId);
        if (filters.documentType) params.set('documentType', filters.documentType);
        if (filters.status) params.set('status', filters.status);
        if (debouncedSearch) params.set('search', debouncedSearch);
        params.set('page', String(page));
        if (filters.limit) params.set('limit', String(filters.limit));

        const response = await fetch(`/api/v1/documents?${params.toString()}`);
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error?.message || 'Ошибка загрузки документов');
        }
        const data = await response.json();
        const result = data.data as PaginatedResult<DocumentWithDetails>;
        setDocuments(result.items);
        setTotal(result.total);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Ошибка загрузки документов');
      } finally {
        setLoading(false);
      }
    };

    fetchDocuments();
  }, [page, filters, debouncedSearch]);

  const handleSearch = useCallback((search: string) => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    searchTimeoutRef.current = setTimeout(() => {
      setDebouncedSearch(search || undefined);
      setPageState(1);
    }, 300);
  }, []);

  const refetch = useCallback(() => {
    setPageState(1);
  }, []);

  // Cleanup
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  return {
    documents,
    loading,
    error,
    total,
    page,
    setFilters,
    setPage,
    refetch,
    handleSearch,
  };
}
