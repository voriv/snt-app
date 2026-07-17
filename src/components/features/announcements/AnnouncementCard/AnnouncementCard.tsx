/**
 * @component AnnouncementCard
 * @category features/announcements
 * @description Карточка объявления в списке
 *
 * @example
 * ```tsx
 * <AnnouncementCard
 *   announcement={item}
 *   onClick={() => router.push(`/dashboard/announcements/${item.id}`)}
 * />
 * ```
 *
 * @spec
 * - Отображает заголовок объявления
 * - Отображает автора и дату публикации
 * - Отображает бейдж статуса (PUBLISHED/ARCHIVED)
 * - Отображает индикатор важного объявления (звезда)
 * - Отображает превью содержания (обрезка до 120 символов)
 * - Отображает количество просмотров
 * - Кликабельная карточка с hover-эффектом
 * - Доступность: role="link", tabIndex, aria-label
 */
'use client';

import { cn } from '@/shared/utils';
import type { AnnouncementWithAuthor } from '@/domains/announcement/announcement.types';
import { Badge } from '@/components/ui/Badge';

export interface AnnouncementCardProps {
  /** Объект объявления для отображения */
  announcement: AnnouncementWithAuthor;
  /** Callback при клике на карточку */
  onClick: () => void;
}

/**
 * Форматирует дату публикации в читаемый формат
 */
function formatDate(date: Date | null): string {
  if (!date) return 'Черновик';
  const d = new Date(date);
  const day = d.getDate().toString().padStart(2, '0');
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const year = d.getFullYear();
  const hours = d.getHours().toString().padStart(2, '0');
  const minutes = d.getMinutes().toString().padStart(2, '0');
  return `${day}.${month}.${year} ${hours}:${minutes}`;
}

/**
 * Обрезает текст до указанной длины, добавляя многоточие
 */
function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength)}…`;
}

/**
 * Возвращает текст статуса для бейджа
 */
function getStatusText(status: string): string {
  switch (status) {
    case 'PUBLISHED':
      return 'Опубликовано';
    case 'ARCHIVED':
      return 'Архив';
    case 'DRAFT':
      return 'Черновик';
    default:
      return status;
  }
}

/**
 * Возвращает класс бейджа в зависимости от статуса
 */
function getStatusVariant(status: string): 'success' | 'default' | 'info' {
  switch (status) {
    case 'PUBLISHED':
      return 'success';
    case 'ARCHIVED':
      return 'default';
    case 'DRAFT':
      return 'info';
    default:
      return 'default';
  }
}

export function AnnouncementCard({ announcement, onClick }: AnnouncementCardProps) {
  const { title, content, author, status, isImportant, viewCount, publishedAt } = announcement;

  return (
    <article
      role="link"
      tabIndex={0}
      aria-label={`Объявление: ${title}`}
      className={cn(
        'group relative flex flex-col gap-3 p-4 rounded-lg border border-border',
        'bg-card hover:bg-accent/50 transition-colors cursor-pointer',
        isImportant && 'border-amber-500/50 bg-amber-50/50 dark:bg-amber-950/10'
      )}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
    >
      {/* Заголовок и статус */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {isImportant && (
            <span
              className="text-amber-500 flex-shrink-0"
              aria-label="Важное объявление"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="w-5 h-5"
              >
                <path
                  fillRule="evenodd"
                  d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z"
                  clipRule="evenodd"
                />
              </svg>
            </span>
          )}
          <h3 className="text-lg font-semibold text-foreground truncate group-hover:text-primary transition-colors">
            {title}
          </h3>
        </div>
        <Badge variant={getStatusVariant(status)}>{getStatusText(status)}</Badge>
      </div>

      {/* Автор и дата */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        {author?.name && (
          <span className="font-medium">
            {author.name}
          </span>
        )}
        {author?.name && <span>·</span>}
        <time dateTime={publishedAt?.toISOString()}>
          {formatDate(publishedAt)}
        </time>
      </div>

      {/* Превью содержания */}
      <p className="text-sm text-muted-foreground line-clamp-2">
        {truncate(content, 120)}
      </p>

      {/* Мета: просмотры */}
      <div className="flex items-center gap-1 text-xs text-muted-foreground pt-1">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-3.5 h-3.5"
        >
          <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
        <span>{viewCount} просмотров</span>
      </div>
    </article>
  );
}
