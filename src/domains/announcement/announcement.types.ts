/**
 * @type AnnouncementStatus
 * @domain announcement
 * @description Статус объявления
 *
 * @spec
 * - DRAFT: Черновик, не виден в публичном списке
 * - PUBLISHED: Опубликовано, видно всем пользователям
 * - ARCHIVED: Архивировано, доступно только по фильтру
 */
export type AnnouncementStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

/**
 * @type Announcement
 * @domain announcement
 * @description Объявление в СНТ — официальный способ информирования членов сообщества
 *
 * @spec
 * - Бизнес-ключ: нет натурального ключа, идентификация через id
 * - Статус определяет видимость: DRAFT скрыт, PUBLISHED виден, ARCHIVED по фильтру
 * - viewCount увеличивается при каждом просмотре деталей
 * - isImportant выделяет объявление визуально
 *
 * @see docs/model/entities/announcement.md — концептуальная модель
 */
export interface Announcement {
  /** Уникальный идентификатор. Генерируется автоматически cuid */
  id: string;
  /** Заголовок объявления */
  title: string;
  /** Полное содержание объявления */
  content: string;
  /** ID автора (Foreign Key -> users.id) */
  authorId: string;
  /** Дата публикации (NULL = черновик) */
  publishedAt: Date | null;
  /** Дата архивации (NULL = не архивирован) */
  archivedAt: Date | null;
  /** Статус объявления */
  status: AnnouncementStatus;
  /** Важное ли объявление */
  isImportant: boolean;
  /** Количество просмотров */
  viewCount: number;
  /** Дата создания записи */
  createdAt: Date;
  /** Дата последнего обновления */
  updatedAt: Date;
}

/**
 * @type AnnouncementWithAuthor
 * @domain announcement
 * @description Объявление с расширенной информацией об авторе
 *
 * @spec
 * - Используется в API ответах для отображения имени автора
 * - author может быть null если пользователь удален
 */
export interface AnnouncementWithAuthor extends Announcement {
  /** Информация об авторе */
  author: {
    id: string;
    name: string | null;
    email: string;
  } | null;
}

/**
 * @type AnnouncementListQuery
 * @domain announcement
 * @description Параметры запроса для получения списка объявлений
 *
 * @spec
 * - page: номер страницы (начиная с 1)
 * - limit: количество записей на странице (по умолчанию 20)
 * - status: фильтр по статусу
 * - search: текст для поиска по заголовку
 */
export interface AnnouncementListQuery {
  /** Номер страницы (начиная с 1) @default 1 */
  page?: number;
  /** Количество записей на странице @default 20 */
  limit?: number;
  /** Фильтр по статусу */
  status?: AnnouncementStatus;
  /** Текст для поиска по заголовку */
  search?: string;
}

/**
 * @type PaginatedAnnouncements
 * @domain announcement
 * @description Пагинированный ответ списка объявлений
 *
 * @spec
 * - items: массив объявлений на текущей странице
 * - total: общее количество объявлений
 * - page: текущая страница
 * - limit: количество записей на странице
 * - totalPages: общее количество страниц
 */
export interface PaginatedAnnouncements {
  /** Массив объявлений на текущей странице */
  items: AnnouncementWithAuthor[];
  /** Общее количество объявлений */
  total: number;
  /** Текущая страница */
  page: number;
  /** Количество записей на странице */
  limit: number;
  /** Общее количество страниц */
  totalPages: number;
}

/**
 * @type AnnouncementFilter
 * @domain announcement
 * @description Фильтры для поиска объявлений
 *
 * @spec
 * - status: фильтр по статусу
 * - search: текст для поиска по заголовку
 * - isImportant: фильтр по важности
 */
export interface AnnouncementFilter {
  /** Фильтр по статусу */
  status?: AnnouncementStatus;
  /** Текст для поиска по заголовку */
  search?: string;
  /** Фильтр по важности */
  isImportant?: boolean;
}

/**
 * @type AnnouncementCreateInput
 * @domain announcement
 * @description Данные для создания нового объявления
 *
 * @spec
 * - title: обязательный заголовок (1-200 символов)
 * - content: опциональное содержание (0-5000 символов)
 * - Объявление создается со статусом DRAFT
 */
export interface AnnouncementCreateInput {
  /** Заголовок объявления — обязательный, 1-200 символов */
  title: string;
  /** Содержание объявления — опциональное, 0-5000 символов */
  content?: string | null;
}