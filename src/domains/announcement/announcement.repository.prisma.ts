import { prisma } from '@/infrastructure/prisma/client';
import { Announcement, AnnouncementListQuery, AnnouncementCreateInput } from './announcement.types';
import { IAnnouncementRepository } from './announcement.repository.interface';

/**
 * @class AnnouncementRepositoryPrisma
 * @domain announcement
 * @description Реализация репозитория объявлений на основе Prisma
 *
 * @spec
 * - Использует Prisma Client для доступа к данным
 * - Преобразует данные из Prisma в доменные типы
 */
export class AnnouncementRepositoryPrisma implements IAnnouncementRepository {
  /**
   * Найти объявление по идентификатору
   *
   * @param id - Уникальный идентификатор объявления
   * @returns Объект Announcement или null если не найден
   */
  async findById(id: string): Promise<Announcement | null> {
    const announcement = await prisma.announcement.findUnique({
      where: { id },
      include: {
        author: true,
      },
    });

    if (!announcement) return null;

    return this.mapToDomain(announcement);
  }

  /**
   * Найти все объявления с пагинацией и фильтрацией
   *
   * @param query - Параметры запроса (пагинация, фильтрация, поиск)
   * @returns Объект с массивом объявлений и метаданными пагинации
   */
  async findAll(query: AnnouncementListQuery): Promise<{
    items: Announcement[];
    total: number;
  }> {
    const { page = 1, limit = 20, status, search } = query;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (search) {
      where.title = {
        contains: search,
        mode: 'insensitive',
      };
    }

    const [items, total] = await Promise.all([
      prisma.announcement.findMany({
        where,
        skip,
        take: limit,
        orderBy: { publishedAt: 'desc' },
        include: {
          author: true,
        },
      }),
      prisma.announcement.count({ where }),
    ]);

    return {
      items: items.map(item => this.mapToDomain(item)),
      total,
    };
  }

  /**
   * Создать новое объявление
   *
   * @param data - Данные для создания объявления
   * @param authorId - ID автора объявления
   * @returns Созданное объявление
   */
  async create(data: AnnouncementCreateInput, authorId: string): Promise<Announcement> {
    const announcement = await prisma.announcement.create({
      data: {
        title: data.title,
        content: data.content ?? '',
        authorId,
        status: 'DRAFT',
      },
    });

    return this.mapToDomain(announcement);
  }

  /**
   * Преобразовать данные из Prisma в доменный тип Announcement
   *
   * @param data - Данные из Prisma
   * @returns Объект Announcement
   */
  private mapToDomain(data: any): Announcement {
    return {
      id: data.id,
      title: data.title,
      content: data.content,
      authorId: data.authorId,
      publishedAt: data.publishedAt,
      archivedAt: data.archivedAt,
      status: data.status,
      isImportant: data.isImportant,
      viewCount: data.viewCount,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };
  }
}