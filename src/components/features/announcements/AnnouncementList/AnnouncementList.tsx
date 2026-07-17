/**
 * @component AnnouncementList
 * @category features/announcements
 * @description Список объявлений с пагинацией, фильтрацией и поиском
 *
 * @example
 * ```tsx
 * <AnnouncementList
 *   announcements={announcements}
 *   total={total}
 *   page={page}
 *   limit={limit}
 *   onFilterChange={handleFilterChange}
 *   onAnnouncementClick={handleAnnouncementClick}
 * />
 * ```
 *
 * @spec
 * - Отображает список карточек AnnouncementCard
 * - Поддерживает пагинацию (навигация по страницам)
 * - Поддерживает фильтрацию по статусу (select)
 * - Поддерживает поиск по заголовку (input)
 * - Отображает EmptyState при пустом списке
 * - Состояния: loading, error, empty
 * - Все состояния управляются через useState + useCallback
 */
'use client';

import { useState, useCallback } from 'react';
import { AnnouncementCard } from '../AnnouncementCard';
import { EmptyState } from '@/components/ui/EmptyState';
import type { AnnouncementWithAuthor, AnnouncementStatus } from '@/domains/announcement/announcement.types';

export interface AnnouncementListProps {
  /** Массив объявлений для отображения */
  announcements: AnnouncementWithAuthor[];
  /** Общее количество объявлений */
  total: number;
  /** Текущая страница */
  page: number;
  /** Количество записей на странице */
  limit: number;
  /** Callback при изменении фильтров */
  onFilterChange: (filters: AnnouncementFilters) => void;
  /** Callback при клике на объявление */
  onAnnouncementClick: (id: string) => void;
}

export interface AnnouncementFilters {
  status: AnnouncementStatus | undefined;
  search: string | undefined;
  page: number;
  limit: number;
}

const STATUS_OPTIONS: { value: AnnouncementStatus; label: string }[] = [
  { value: 'PUBLISHED', label: 'Опубликованные' },
  { value: 'ARCHIVED', label: 'Архив' },
  { value: 'DRAFT', label: 'Черновики' },
];

export function AnnouncementList({
  announcements,
  total,
  page,
  limit,
  onFilterChange,
  onAnnouncementClick,
}: AnnouncementListProps) {
  const [statusFilter, setStatusFilter] = useState<AnnouncementStatus | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [localPage, setLocalPage] = useState(page);

  // Вычисляем общее количество страниц
  const totalPages = Math.ceil(total / limit);

  // Обработчик изменения статуса
  const handleStatusChange = useCallback((newStatus: AnnouncementStatus | undefined) => {
    setStatusFilter(newStatus);
    setLocalPage(1); // Сбрасываем на первую страницу
    onFilterChange({
      status: newStatus,
      search: searchQuery || undefined,
      page: 1,
      limit,
    });
  }, [onFilterChange, searchQuery, limit]);

  // Обработчик изменения поиска
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  }, []);

  // Обработчик отправки поиска (Enter)
  const handleSearchSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    setLocalPage(1);
    onFilterChange({
      status: statusFilter,
      search: searchQuery || undefined,
      page: 1,
      limit,
    });
  }, [onFilterChange, statusFilter, searchQuery, limit]);

  // Обработчик клика на объявление
  const handleCardClick = useCallback((id: string) => {
    onAnnouncementClick(id);
  }, [onAnnouncementClick]);

  // Обработчик изменения страницы
  const handlePageChange = useCallback((newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return;
    setLocalPage(newPage);
    onFilterChange({
      status: statusFilter,
      search: searchQuery || undefined,
      page: newPage,
      limit,
    });
  }, [onFilterChange, statusFilter, searchQuery, limit, totalPages]);

  // Рендер пустого состояния
  if (announcements.length === 0) {
    return (
      <EmptyState
        title="Нет объявлений"
        description="Объявления не найдены. Попробуйте изменить фильтры."
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Панель фильтров */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Поиск */}
        <form onSubmit={handleSearchSubmit} className="flex-1">
          <input
            type="text"
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder="Поиск по заголовку..."
            className="w-full px-3 py-2 text-sm border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
            aria-label="Поиск по заголовку объявления"
          />
        </form>

        {/* Фильтр по статусу */}
        <select
          value={statusFilter ?? ''}
          onChange={(e) => handleStatusChange(e.target.value as AnnouncementStatus || undefined)}
          className="px-3 py-2 text-sm border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
          aria-label="Фильтр по статусу"
        >
          <option value="">Все статусы</option>
          {STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {/* Список объявлений */}
      <div className="flex flex-col gap-3">
        {announcements.map((item) => (
          <AnnouncementCard
            key={item.id}
            announcement={item}
            onClick={() => handleCardClick(item.id)}
          />
        ))}
      </div>

      {/* Пагинация */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <button
            onClick={() => handlePageChange(localPage - 1)}
            disabled={localPage === 1}
            className="px-3 py-1.5 text-sm border border-border rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-accent transition-colors"
            aria-label="Предыдущая страница"
          >
            ← Назад
          </button>

          <span className="text-sm text-muted-foreground">
            Страница {localPage} из {totalPages}
          </span>

          <button
            onClick={() => handlePageChange(localPage + 1)}
            disabled={localPage === totalPages}
            className="px-3 py-1.5 text-sm border border-border rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-accent transition-colors"
            aria-label="Следующая страница"
          >
            Далее →
          </button>
        </div>
      )}
    </div>
  );
}
