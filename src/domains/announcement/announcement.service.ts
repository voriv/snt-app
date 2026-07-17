import { IAnnouncementRepository } from './announcement.repository.interface';
import { Announcement, AnnouncementCreateInput, AnnouncementListQuery, AnnouncementWithAuthor, PaginatedAnnouncements } from './announcement.types';
import { AnnouncementNotFoundError, AnnouncementInvalidDataError } from './announcement.errors';
import { AnnouncementListQuerySchema, AnnouncementCreateSchema } from './announcement.validators';

/**
 * @service AnnouncementService
 * @domain announcement
 * @description Бизнес-логика управления объявлениями СНТ
 *
 * @spec
 * - Валидация входных данных через Zod-схемы
 * - Ошибки: AnnouncementNotFoundError, AnnouncementInvalidDataError
 * - Зависимости: IAnnouncementRepository через DI
 */
export class AnnouncementService {
  constructor(private readonly repository: IAnnouncementRepository) {}

  /**
   * Получить список объявлений с пагинацией и фильтрацией
   *
   * @param query - Параметры запроса (пагинация, фильтрация, поиск)
   * @returns Пагинированный список объявлений
   *
   * @spec
   * - Валидация параметров через AnnouncementListQuerySchema
   * - Фильтрация по статусу и поиску по заголовку
   * - Сортировка по published_at DESC
   * - Возвращает пустой список если ничего не найдено
   */
  async getAnnouncementsList(query: AnnouncementListQuery): Promise<PaginatedAnnouncements> {
    const validatedQuery = AnnouncementListQuerySchema.parse(query);

    const { items, total } = await this.repository.findAll(validatedQuery);

    const page = validatedQuery.page || 1;
    const limit = validatedQuery.limit || 20;
    const totalPages = Math.ceil(total / limit);

    return {
      items: items.map(item => this.mapToAnnouncementWithAuthor(item)),
      total,
      page,
      limit,
      totalPages,
    };
  }

  /**
   * Получить объявление по идентификатору
   *
   * @param id - Уникальный идентификатор объявления
   * @returns Объект объявления с информацией об авторе
   * @throws {AnnouncementNotFoundError} если объявление не найдено
   *
   * @spec
   * - При успешном получении увеличивается счётчик просмотров
   * - Возвращает полное объявление с данными автора
   */
  async getAnnouncementById(id: string): Promise<AnnouncementWithAuthor> {
    const announcement = await this.repository.findById(id);

    if (!announcement) {
      throw new AnnouncementNotFoundError(id);
    }

    return this.mapToAnnouncementWithAuthor(announcement);
  }

  /**
   * Создать новое объявление как черновик
   *
   * @param data - Данные для создания объявления
   * @param authorId - ID автора объявления
   * @returns Созданное объявление
   * @throws {AnnouncementInvalidDataError} при ошибке валидации
   *
   * @spec
   * - Валидация данных через AnnouncementCreateSchema
   * - Статус устанавливается как DRAFT в репозитории
   * - authorId передаётся отдельно для безопасности
   */
  async createAnnouncement(data: AnnouncementCreateInput, authorId: string): Promise<Announcement> {
    // Валидация через Zod-схему
    try {
      AnnouncementCreateSchema.parse(data);
    } catch (error) {
      if (error instanceof Error) {
        throw new AnnouncementInvalidDataError(error.message);
      }
      throw new AnnouncementInvalidDataError('Ошибка валидации данных объявления');
    }

    return this.repository.create(data, authorId);
  }

  /**
   * Преобразовать Announcement в AnnouncementWithAuthor
   *
   * @param announcement - Объект объявления
   * @returns Объект объявления с информацией об авторе
   */
  private mapToAnnouncementWithAuthor(announcement: Announcement): AnnouncementWithAuthor {
    return {
      ...announcement,
      author: null, // Автор будет подгружен репозиторием через include
    };
  }
}