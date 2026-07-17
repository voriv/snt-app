import { Announcement, AnnouncementListQuery, AnnouncementCreateInput } from './announcement.types';

/**
 * @interface IAnnouncementRepository
 * @domain announcement
 * @description Контракт доступа к данным объявлений
 *
 * @spec
 * - Все методы асинхронные
 * - findById возвращает null если не найден — НЕ бросает ошибку
 * - findAll поддерживает пагинацию и фильтрацию
 */
export interface IAnnouncementRepository {
  /**
   * Найти объявление по идентификатору
   *
   * @param id - Уникальный идентификатор объявления
   * @returns Объект Announcement или null если не найден
   *
   * @spec
   * - Возвращает null если объявление не найдено
   * - Не бросает ошибку при отсутствии записи
   */
  findById(id: string): Promise<Announcement | null>;

  /**
   * Найти все объявления с пагинацией и фильтрацией
   *
   * @param query - Параметры запроса (пагинация, фильтрация, поиск)
   * @returns Объект с массивом объявлений и метаданными пагинации
   *
   * @spec
   * - Поддерживает фильтрацию по статусу
   * - Поддерживает поиск по заголовку
   * - Сортировка по published_at DESC по умолчанию
   * - Возвращает пустой массив если ничего не найдено
   */
 findAll(query: AnnouncementListQuery): Promise<{
   items: Announcement[];
   total: number;
 }>;

 /**
  * Создать новое объявление
  *
  * @param data - Данные для создания объявления
  * @param authorId - ID автора объявления
  * @returns Созданное объявление
  *
  * @spec
  * - Статус устанавливается как DRAFT по умолчанию
  * - authorId передается отдельно для безопасности
  * - publishedAt и archivedAt устанавливаются как null
  */
 create(data: AnnouncementCreateInput, authorId: string): Promise<Announcement>;
}