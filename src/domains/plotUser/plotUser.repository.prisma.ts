import { PrismaClient } from '@prisma/client';
import { prisma as defaultPrisma } from '@/infrastructure/prisma/client';
import { Prisma } from '@prisma/client';
import type {
  CreatePlotUserRoleInput,
  PlotUserRole,
  PlotUserRoleHistory,
} from './plotUser.types';
import type { IPlotUserRoleRepository, IPlotUserRoleHistoryRepository } from './plotUser.repository.interface';
import { PlotUserRoleNotFoundError, PlotUserRoleDuplicateError, PlotUserRoleInvalidDataError } from './plotUser.errors';

/**
 * @class PlotUserRoleRepositoryPrisma
 * @domain plotUser
 * @description Реализация репозитория связей пользователь-участок на основе Prisma
 *
 * @spec
 * - Использует Prisma Client для доступа к БД
 * - Преобразует Prisma модели в доменные типы
 * - Обрабатывает ошибки уникальности на уровне БД
 * - Поддерживает soft delete через установку status в 'expired'
 * - Автоматически управляет updated_at через Prisma @updatedAt
 * - Создаёт записи в истории транзакционно при create/update/deactivate (BR-7)
 * - Принимает опциональный PrismaClient для тестирования
 *
 * @see BR-7 (историчность)
 */
export class PlotUserRoleRepositoryPrisma implements IPlotUserRoleRepository {
  private readonly prisma: PrismaClient;

  constructor(prisma?: PrismaClient) {
    this.prisma = prisma || defaultPrisma;
  }
  /**
   * Создать новую связь пользователь-участок
   *
   * @param data - Данные для создания связи
   * @param changedBy - ID администратора, создавшего связь (для истории)
   * @returns Созданная запись PlotUserRole
   * @throws {PlotUserRoleDuplicateError} если активная связь уже существует
   * @throws {PlotUserRoleInvalidDataError} если данные не проходят валидацию
   *
   * @spec
   * - Генерирует уникальный id (cuid) автоматически через Prisma
   * - Устанавливает status в 'active' по умолчанию
   * - Устанавливает assignedAt в текущее время (now())
   * - Транзакционно создаёт запись в истории (BR-7)
   *
   * @see BR-7 (историчность)
   */
  async create(
    data: CreatePlotUserRoleInput,
    changedBy: string
  ): Promise<PlotUserRole> {
    try {
      // Создаём связь
      const plotUserRole = await this.prisma.plotUserRole.create({
        data: {
          userId: data.userId,
          plotId: data.plotId,
          role: data.role,
          status: data.status ?? 'active',
          comment: data.comment ?? null,
          expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
          assignedAt: new Date(),
        },
      });

      // Создаём запись в истории
      await this.prisma.plotUserRoleHistory.create({
        data: {
          plotUserId: plotUserRole.id,
          userId: data.userId,
          plotId: data.plotId,
          role: data.role,
          status: data.status ?? 'active',
          comment: data.comment ?? null,
          changedBy,
          changedAt: new Date(),
          changedReason: 'Initial assignment',
          newValues: {
            userId: data.userId,
            plotId: data.plotId,
            role: data.role,
            status: data.status ?? 'active',
          } as Prisma.InputJsonValue,
        },
      });

      return this.mapToPlotUserRole(plotUserRole);
    } catch (error) {
      const prismaError = error as { code: string; message: string };
      if (prismaError.code === 'P2002') {
        throw new PlotUserRoleDuplicateError(
          `У пользователя '${data.userId}' уже существует активная связь с участком '${data.plotId}' с ролью ${data.role}`
        );
      }
      throw new PlotUserRoleInvalidDataError(
        `Ошибка при создании связи: ${prismaError.message}`
      );
    }
  }

  /**
   * Найти связь по уникальному идентификатору
   *
   * @param id - Уникальный идентификатор связи
   * @param required - Бросать ли ошибку если не найдена
   * @returns Полный объект PlotUserRole или null если не найден
   *
   * @spec
   * - Возвращает полный объект без фильтрации полей
   * - Не бросает ошибку если не найден
   */
  async findById(id: string, required = false): Promise<PlotUserRole | null> {
    const record = await this.prisma.plotUserRole.findUnique({
      where: { id },
    });

    if (!record) {
      if (required) {
        throw new PlotUserRoleNotFoundError(`Связь с идентификатором ${id} не найдена`);
      }
      return null;
    }

    return this.mapToPlotUserRole(record);
  }

  /**
   * Найти все связи для пользователя
   *
   * @param userId - Идентификатор пользователя
   * @param includeInactive - включать неактивные связи
   * @returns Массив связей PlotUserRole
   *
   * @spec
   * - Возвращает связи для пользователя
   * - По умолчанию только активные (status = 'active')
   * - Сортирует по assignedAt DESC
   */
  async findByUserId(userId: string, includeInactive = false): Promise<PlotUserRole[]> {
    const records = await this.prisma.plotUserRole.findMany({
      where: includeInactive
        ? { userId }
        : { userId, status: 'active' },
      orderBy: { assignedAt: 'desc' },
    });

    return records.map(this.mapToPlotUserRole.bind(this));
  }

  /**
   * Найти все связи для участка
   *
   * @param plotId - Идентификатор участка
   * @param includeInactive - включать неактивные связи
   * @returns Массив связей PlotUserRole
   *
   * @spec
   * - Возвращает связи для участка
   * - По умолчанию только активные (status = 'active')
   * - Сортирует по role ASC, assignedAt DESC
   */
  async findByPlotId(plotId: string, includeInactive = false): Promise<PlotUserRole[]> {
    const records = await this.prisma.plotUserRole.findMany({
      where: includeInactive
        ? { plotId }
        : { plotId, status: 'active' },
      orderBy: [{ role: 'asc' }, { assignedAt: 'desc' }],
    });

    return records.map(this.mapToPlotUserRole.bind(this));
  }

  /**
   * Проверить наличие активной связи для пары user_id, plot_id
   *
   * @param userId - Идентификатор пользователя
   * @param plotId - Идентификатор участка
   * @returns true если активная связь существует, false иначе
   *
   * @spec
   * - Проверяет только активные связи (status = 'active')
   * - Используется для валидации BR-3
   *
   * @see BR-3 (уникальность активной связи)
   */
  async existsActive(userId: string, plotId: string): Promise<boolean> {
    const count = await this.prisma.plotUserRole.count({
      where: {
        userId,
        plotId,
        status: 'active',
      },
    });

    return count > 0;
  }

  /**
   * Проверить наличие активной связи с конкретной ролью для пары user_id, plot_id
   *
   * @param userId - Идентификатор пользователя
   * @param plotId - Идентификатор участка
   * @param role - Роль пользователя на участке
   * @returns true если активная связь с этой ролью существует, false иначе
   *
   * @spec
   * - Проверяет только активные связи (status = 'active')
   * - Проверяет уникальность по userId + plotId + role
   * - Позволяет пользователю иметь несколько записей на одном участке с разными ролями
   */
  async existsActiveWithRole(
    userId: string,
    plotId: string,
    role: number
  ): Promise<boolean> {
    const count = await this.prisma.plotUserRole.count({
      where: {
        userId,
        plotId,
        role,
        status: 'active',
      },
    });

    return count > 0;
  }

  /**
   * Проверить существование пользователя в системе
   *
   * @param userId - Идентификатор пользователя
   * @returns true если пользователь существует, false иначе
   *
   * @spec
   * - Используется для валидации перед созданием связи
   */
  async userExists(userId: string): Promise<boolean> {
    const count = await this.prisma.user.count({
      where: { id: userId },
    });

    return count > 0;
  }

  /**
   * Проверить существование участка в системе
   *
   * @param plotId - Идентификатор участка
   * @returns true если участок существует, false иначе
   *
   * @spec
   * - Используется для валидации перед созданием связи
   */
  async plotExists(plotId: string): Promise<boolean> {
    const count = await this.prisma.plot.count({
      where: { id: plotId },
    });

    return count > 0;
  }

  /**
   * Обновить существующую связь
   *
   * @param id - Уникальный идентификатор связи
   * @param data - Новые данные для обновления
   * @param changedBy - ID администратора, изменившего связь (для истории)
   * @param changedReason - Причина изменения (для истории)
   * @returns Обновлённый объект PlotUserRole
   * @throws {PlotUserRoleNotFoundError} если связь не найдена
   * @throws {PlotUserRoleDuplicateError} если возникает конфликт уникальности
   *
   * @spec
   * - Обновляет только указанные поля (partial update)
   * - Автоматически устанавливает updatedAt в текущее время
   * - Транзакционно создаёт запись в истории (BR-7)
   *
   * @see BR-7 (историчность)
   */
  async update(
    id: string,
    data: Partial<CreatePlotUserRoleInput> & {
      status?: import('./plotUser.types').PlotUserRoleStatus;
    },
    changedBy: string,
    changedReason: string
  ): Promise<PlotUserRole> {
    try {
      const result = await this.prisma.$transaction(async (tx) => {
        // Проверяем существование связи
        const existing = await tx.plotUserRole.findUnique({ where: { id } });

        if (!existing) {
          throw new PlotUserRoleNotFoundError(`Связь с идентификатором ${id} не найдена`);
        }

        // Формируем объект для обновления
        const updateData: Record<string, unknown> = {};

        if (data.userId !== undefined) updateData.userId = data.userId;
        if (data.plotId !== undefined) updateData.plotId = data.plotId;
        if (data.role !== undefined) updateData.role = data.role;
        if (data.status !== undefined) updateData.status = data.status;
        if (data.comment !== undefined) updateData.comment = data.comment;
        if (data.expiresAt !== undefined) {
          updateData.expiresAt = data.expiresAt ? new Date(data.expiresAt) : null;
        }

        // Сохраняем старые значения для истории
        const oldValues: Record<string, unknown> = {
          role: existing.role,
          status: existing.status,
          comment: existing.comment,
          expiresAt: existing.expiresAt,
        };

        // Обновляем связь
        const updated = await tx.plotUserRole.update({
          where: { id },
          data: updateData,
        });

        // Создаём запись в истории
        await tx.plotUserRoleHistory.create({
          data: {
            plotUserId: id,
            userId: updated.userId,
            plotId: updated.plotId,
            role: updated.role,
            status: updated.status,
            comment: updated.comment,
            changedBy,
            changedAt: new Date(),
            changedReason,
            oldValues: oldValues as Prisma.InputJsonValue,
            newValues: {
              role: updated.role,
              status: updated.status,
              comment: updated.comment,
              expiresAt: updated.expiresAt,
            } as Prisma.InputJsonValue,
          },
        });

        return updated;
      });

      return this.mapToPlotUserRole(result);
    } catch (error) {
      if (error instanceof PlotUserRoleNotFoundError || error instanceof PlotUserRoleDuplicateError) {
        throw error;
      }

      const prismaError = error as { code: string; message: string };
      if (prismaError.code === 'P2002') {
        throw new PlotUserRoleDuplicateError(
          `Активная связь между пользователем и участком уже существует`
        );
      }

      throw new PlotUserRoleInvalidDataError(
        `Ошибка при обновлении связи: ${prismaError.message}`
      );
    }
  }

  /**
   * Деактивировать связь (soft delete)
   *
   * @param id - Уникальный идентификатор связи
   * @param changedBy - ID администратора, деактивировавшего связь
   * @param reason - Причина деактивации (для истории)
   * @returns true если связь была деактивирована, false если не найдена
   *
   * @spec
   * - Устанавливает status в 'expired'
   * - Устанавливает expiresAt в текущее время
   * - Используется вместо физического удаления
   * - Транзакционно создаёт запись в истории (BR-7)
   *
   * @see BR-7 (историчность)
   */
  async deactivate(id: string, changedBy: string, reason: string): Promise<boolean> {
    try {
      const result = await this.prisma.$transaction(async (tx) => {
        // Проверяем существование связи
        const existing = await tx.plotUserRole.findUnique({ where: { id } });

        if (!existing) {
          return null;
        }

        // Сохраняем старые значения для истории
        const oldValues: Record<string, unknown> = {
          status: existing.status,
          expiresAt: existing.expiresAt,
        };

        // Деактивируем связь
        const deactivated = await tx.plotUserRole.update({
          where: { id },
          data: {
            status: 'expired',
            expiresAt: new Date(),
          },
        });

        // Создаём запись в истории
        await tx.plotUserRoleHistory.create({
          data: {
            plotUserId: id,
            userId: deactivated.userId,
            plotId: deactivated.plotId,
            role: deactivated.role,
            status: deactivated.status,
            comment: deactivated.comment,
            changedBy,
            changedAt: new Date(),
            changedReason: reason || 'Deactivation',
            oldValues: oldValues as Prisma.InputJsonValue,
            newValues: {
              status: 'expired',
              expiresAt: deactivated.expiresAt,
            } as Prisma.InputJsonValue,
          },
        });

        return deactivated;
      });

      return result !== null;
    } catch (error) {
      if (error instanceof PlotUserRoleNotFoundError) {
        throw error;
      }
      const prismaError = error as { code: string; message: string };
      throw new PlotUserRoleInvalidDataError(
        `Ошибка при деактивации связи: ${prismaError.message}`
      );
    }
  }

  /**
   * Физически удалить связь
   *
   * @param id - Уникальный идентификатор связи
   * @throws {NotFoundError} если связь не найдена
   */
  async delete(id: string): Promise<void> {
    const existing = await this.prisma.plotUserRole.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new Prisma.PrismaClientKnownRequestError(
        `PlotUserRole with id ${id} not found`,
        {
          code: 'P2025',
          clientVersion: '5.0.0',
        }
      );
    }

    await this.prisma.plotUserRole.delete({
      where: { id },
    });
  }

  /**
   * Найти связи с фильтрацией и пагинацией
   *
   * @param options - Параметры пагинации и фильтрации
   * @returns Объект с данными и метаданными пагинации
   *
   * @spec
   * - Поддерживает фильтрацию по userId, plotId, role, status
   * - Поддерживает пагинацию через limit и offset
   * - Возвращает объект с полями: data, total, page, limit
   * - Сортирует по assignedAt DESC по умолчанию
   */
  async findWithPagination(options: {
    limit?: number;
    offset?: number;
    plotId?: string;
    userId?: string;
    role?: number;
    status?: string;
    sortBy?: 'createdAt' | 'updatedAt' | 'assignedAt';
    sortOrder?: 'ASC' | 'DESC';
  }): Promise<{
    data: PlotUserRole[];
    total: number;
    page: number;
    limit: number;
  }> {
    const {
      limit = 20,
      offset = 0,
      plotId,
      userId,
      role,
      status,
      sortBy = 'assignedAt',
      sortOrder = 'desc',
    } = options;

    const where: Record<string, unknown> = {};

    if (userId) where.userId = userId;
    if (plotId) where.plotId = plotId;
    if (role !== undefined) where.role = role;
    if (status) where.status = status;

    const [records, total] = await Promise.all([
      this.prisma.plotUserRole.findMany({
        where,
        skip: offset,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
      }),
      this.prisma.plotUserRole.count({ where }),
    ]);

    return {
      data: records.map(this.mapToPlotUserRole.bind(this)),
      total,
      page: Math.floor(offset / limit) + 1,
      limit,
    };
  }

  /**
   * Преобразует запись Prisma в доменный тип PlotUserRole
   *
   * @param record - Запись из базы данных
   * @returns Доменный объект PlotUserRole
   *
   * @spec
   * - Преобразует все поля в camelCase
   * - Преобразует даты из строки в Date объекты
   * - Обрабатывает null значения
   */
  private mapToPlotUserRole(record: {
    id: string;
    userId: string;
    plotId: string;
    role: number;
    status: string;
    comment: string | null;
    assignedAt: Date;
    expiresAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
  }): PlotUserRole {
    return {
      id: record.id,
      userId: record.userId,
      plotId: record.plotId,
      role: record.role as 1 | 2 | 3,
      status: record.status as 'active' | 'pending' | 'expired',
      comment: record.comment,
      assignedAt: record.assignedAt,
      expiresAt: record.expiresAt,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }

  /**
   * Получить все связи для участка с фильтрацией, поиском и пагинацией
   *
   * @param plotId - Идентификатор участка
   * @param filter - Фильтры: role, status, search, page, limit
   * @returns Массив участников участка с информацией о пользователе
   * @throws {NotFoundError} если участок не найден
   *
   * @spec
   * - JOIN с users и user_profiles (включая phone для tooltip)
   * - Фильтрация по role, status, search (firstName, lastName, email)
   * - Сортировка: active → pending → expired, затем assignedAt DESC (BR-2)
   * - Пагинация: по умолчанию page=1, limit=25 (AC-5.2, BR-6)
   * - search: case-insensitive contains по firstName, lastName, email
   *
   * @see US-19-2 FR-3 (фильтр по роли)
   * @see US-19-2 FR-4 (фильтр по статусу)
   * @see US-19-2 FR-5 (поиск)
   * @see US-19-2 AC-1.3 (сортировка по умолчанию)
   */
  /**
   * Получить все связи для участка с фильтрацией, поиском и пагинацией
   *
   * @param plotId - Идентификатор участка
   * @param filter - Фильтры: role, status, search, page, limit
   * @returns Массив участников участка с информацией о пользователе
   * @throws {NotFoundError} если участок не найден
   *
   * @spec
   * - JOIN с users и user_profiles (включая phone для tooltip)
   * - Фильтрация по role, status, search (firstName, lastName, email)
   * - Сортировка: active → pending → expired, затем assignedAt DESC (BR-2)
   * - Пагинация: по умолчанию page=1, limit=25 (AC-5.2, BR-6)
   * - search: case-insensitive contains по firstName, lastName, email
   *
   * @see US-19-2 FR-3 (фильтр по роли)
   * @see US-19-2 FR-4 (фильтр по статусу)
   * @see US-19-2 FR-5 (поиск)
   * @see US-19-2 AC-1.3 (сортировка по умолчанию)
   */
  async findByPlot(
    plotId: string,
    filter?: import('./plotUser.types').PlotUserRoleParticipantFilter
  ): Promise<import('./plotUser.types').PlotUserRoleParticipant[]> {
    const {
      role,
      status,
      search,
      page = 1,
      limit = 25,
    } = filter || {};

    // Проверяем существование участка
    const plotExists = await this.plotExists(plotId);
    if (!plotExists) {
      throw new PlotUserRoleNotFoundError(`Участок с ID '${plotId}' не найден`);
    }

    // Формируем условия WHERE
    const whereConditions: Record<string, unknown> = { plotId };
    
    // Фильтр по роли
    if (role !== undefined) {
      whereConditions.role = role;
    }
    
    // Фильтр по статусу
    if (status) {
      whereConditions.status = status;
    }
    
    // Поиск по имени/email
    if (search) {
      whereConditions.OR = [
        {
          user: {
            profile: {
              firstName: { contains: search, mode: 'insensitive' },
            },
          },
        },
        {
          user: {
            profile: {
              lastName: { contains: search, mode: 'insensitive' },
            },
          },
        },
        {
          user: {
            email: { contains: search, mode: 'insensitive' },
          },
        },
      ];
    }

    // Сортировка: active → pending → expired, затем assignedAt DESC
    // Используем CASE expression для кастомной сортировки по статусу
    const searchPattern = search ? `%${search}%` : null;

    const records = await this.prisma.$queryRaw<Array<{
      id: string;
      user_id: string;
      plot_id: string;
      role: number;
      status: string;
      comment: string | null;
      assigned_at: string;
      expires_at: string | null;
      created_at: string;
      updated_at: string;
      email?: string;
      first_name?: string | null;
      last_name?: string | null;
    }>>`
      SELECT
        pu."id",
        pu."user_id",
        pu."plot_id",
        pu."role",
        pu."status",
        pu."comment",
        pu."assigned_at",
        pu."expires_at",
        pu."created_at",
        pu."updated_at",
        u."email",
        up."first_name",
        up."last_name"
      FROM "plot_users" pu
      LEFT JOIN "user" u ON pu."user_id" = u."id"
      LEFT JOIN "user_profiles" up ON u."id" = up."user_id"
      WHERE pu."plot_id" = ${plotId}
        ${role !== undefined ? Prisma.sql`AND pu."role" = ${role}` : Prisma.empty}
        ${status ? Prisma.sql`AND pu."status" = ${status}` : Prisma.empty}
        ${
          search
            ? Prisma.sql`
                AND (
                  LOWER(up."first_name") LIKE LOWER(${searchPattern})
                  OR LOWER(up."last_name") LIKE LOWER(${searchPattern})
                  OR LOWER(u."email") LIKE LOWER(${searchPattern})
                )
              `
            : Prisma.empty
        }
      ORDER BY
        CASE pu."status"
          WHEN 'active' THEN 0
          WHEN 'pending' THEN 1
          WHEN 'expired' THEN 2
          ELSE 3
        END,
        pu."assigned_at" DESC
      LIMIT ${limit}
      OFFSET ${((page - 1) * limit)}
    `;

    // Преобразуем результаты в PlotUserRoleParticipant
    return records.map(record => ({
      id: record.id,
      userId: record.user_id,
      plotId: record.plot_id,
      role: record.role as 1 | 2 | 3,
      status: record.status as 'active' | 'pending' | 'expired',
      comment: record.comment,
      assignedAt: new Date(record.assigned_at),
      expiresAt: record.expires_at ? new Date(record.expires_at) : null,
      createdAt: new Date(record.created_at),
      updatedAt: new Date(record.updated_at),
      user: record.email
        ? {
            id: record.user_id,
            email: record.email,
            firstName: record.first_name ?? null,
            lastName: record.last_name ?? null,
            phone: null, // phone не используется в базовом списке - запросится отдельно при необходимости
          }
        : null,
    }));
  }

  /**
   * Поиск участников по имени пользователя
   *
   * @param plotId - Идентификатор участка
   * @param query - Поисковый запрос (firstName, lastName, email)
   * @returns Массив участников, соответствующих запросу
   *
   * @spec
   * - Case-insensitive contains по firstName, lastName, email
   * - Возвращает participants с расширенной информацией о пользователе
   * - Debounce обрабатывается на UI уровне (300ms)
   *
   * @see US-19-2 FR-5 (поиск по участникам)
   */
  async searchByName(
    plotId: string,
    query: string
  ): Promise<import('./plotUser.types').PlotUserRoleParticipant[]> {
    // Проверяем существование участка
    const plotExists = await this.plotExists(plotId);
    if (!plotExists) {
      throw new PlotUserRoleNotFoundError(`Участок с ID '${plotId}' не найден`);
    }

    const searchPattern = `%${query}%`;

    const records = await this.prisma.$queryRaw<Array<{
      id: string;
      user_id: string;
      plot_id: string;
      role: number;
      status: string;
      comment: string | null;
      assigned_at: string;
      expires_at: string | null;
      created_at: string;
      updated_at: string;
      email?: string;
      first_name?: string | null;
      last_name?: string | null;
      phone?: string | null;
    }>>`
      SELECT
        pu."id",
        pu."user_id",
        pu."plot_id",
        pu."role",
        pu."status",
        pu."comment",
        pu."assigned_at",
        pu."expires_at",
        pu."created_at",
        pu."updated_at",
        u."email",
        up."first_name",
        up."last_name",
        up."phone"
      FROM "plot_users" pu
      LEFT JOIN "user" u ON pu."user_id" = u."id"
      LEFT JOIN "user_profiles" up ON u."id" = up."user_id"
      WHERE pu."plot_id" = ${plotId}
        AND (
          LOWER(up."first_name") LIKE LOWER(${searchPattern})
          OR LOWER(up."last_name") LIKE LOWER(${searchPattern})
          OR LOWER(u."email") LIKE LOWER(${searchPattern})
        )
      ORDER BY pu."assigned_at" DESC
    `;

    return records.map(record => ({
      id: record.id,
      userId: record.user_id,
      plotId: record.plot_id,
      role: record.role as 1 | 2 | 3,
      status: record.status as 'active' | 'pending' | 'expired',
      comment: record.comment,
      assignedAt: new Date(record.assigned_at),
      expiresAt: record.expires_at ? new Date(record.expires_at) : null,
      createdAt: new Date(record.created_at),
      updatedAt: new Date(record.updated_at),
      user: record.email
        ? {
            id: record.user_id,
            email: record.email,
            firstName: record.first_name ?? null,
            lastName: record.last_name ?? null,
            phone: record.phone ?? null,
          }
        : null,
    }));
  }

  /**
   * Найти связь участника с информацией о пользователе
   *
   * @param plotId - Идентификатор участка
   * @param id - Идентификатор связи plot_users
   * @returns Участник с информацией о пользователе или null
   *
   * @spec
   * - JOIN с users и user_profiles (включая phone)
   * - Возвращает null если не найдена
   */
  async findWithUser(
    plotId: string,
    id: string
  ): Promise<import('./plotUser.types').PlotUserRoleParticipant | null> {
    const record = await this.prisma.$queryRaw<Array<{
      id: string;
      user_id: string;
      plot_id: string;
      role: number;
      status: string;
      comment: string | null;
      assigned_at: string;
      expires_at: string | null;
      created_at: string;
      updated_at: string;
      email?: string;
      first_name?: string | null;
      last_name?: string | null;
      phone?: string | null;
    }>>`
      SELECT
        pu."id",
        pu."user_id",
        pu."plot_id",
        pu."role",
        pu."status",
        pu."comment",
        pu."assigned_at",
        pu."expires_at",
        pu."created_at",
        pu."updated_at",
        u."email",
        up."first_name",
        up."last_name",
        up."phone"
      FROM "plot_users" pu
      LEFT JOIN "user" u ON pu."user_id" = u."id"
      LEFT JOIN "user_profiles" up ON u."id" = up."user_id"
      WHERE pu."id" = ${id}
        AND pu."plot_id" = ${plotId}
      LIMIT 1
    `;

    if (record.length === 0) {
      return null;
    }

    const r = record[0];
    
    return {
      id: r.id,
      userId: r.user_id,
      plotId: r.plot_id,
      role: r.role as 1 | 2 | 3,
      status: r.status as 'active' | 'pending' | 'expired',
      comment: r.comment,
      assignedAt: new Date(r.assigned_at),
      expiresAt: r.expires_at ? new Date(r.expires_at) : null,
      createdAt: new Date(r.created_at),
      updatedAt: new Date(r.updated_at),
      user: r.email
        ? {
            id: r.user_id,
            email: r.email,
            firstName: r.first_name ?? null,
            lastName: r.last_name ?? null,
            phone: r.phone ?? null,
          }
        : null,
    };
  }

  /**
   * Получить все связи пользователя с информацией об участке
   *
   * @param userId - Идентификатор пользователя
   * @param filter - Фильтры: role, status, search, page, limit
   * @returns Массив связей с информацией об участке
   * @throws {PlotUserRoleNotFoundError} если пользователь не найден
   *
   * @spec
   * - JOIN с plots через $queryRaw (plotNumber, cadastralNumber, area, address)
   * - Фильтрация по role, status, search (plot_number, plot.address)
   * - Сортировка: active → pending → expired (CASE), затем assignedAt DESC
   * - Пагинация: по умолчанию page=1, limit=25
   * - Возвращает plot: null если участок удалён (LEFT JOIN)
   *
   * @see US-19-3 FR-1, FR-3, FR-4, AC-1.3
   */
  async findByUser(
    userId: string,
    filter?: import('./plotUser.types').PlotUserRoleConnectionFilter
  ): Promise<import('./plotUser.types').PlotUserRoleConnection[]> {
    const {
      role,
      status,
      search,
      page = 1,
      limit = 25,
    } = filter || {};

    // Проверяем существование пользователя
    const userExists = await this.userExists(userId);
    if (!userExists) {
      throw new PlotUserRoleNotFoundError(`Пользователь с ID '${userId}' не найден`);
    }

    // Формируем условия WHERE
    const whereConditions: Record<string, unknown> = { userId };

    // Сортировка: active → pending → expired (CASE), затем assignedAt DESC
    const searchPattern = search ? `%${search}%` : null;

    const records = await this.prisma.$queryRaw<Array<{
      id: string;
      user_id: string;
      plot_id: string;
      role: number;
      status: string;
      comment: string | null;
      assigned_at: string;
      expires_at: string | null;
      created_at: string;
      updated_at: string;
      plot_number?: string;
      cadastral_number?: string | null;
      area?: string | null;
      address?: string | null;
    }>>`
      SELECT
        pu."id",
        pu."user_id",
        pu."plot_id",
        pu."role",
        pu."status",
        pu."comment",
        pu."assigned_at",
        pu."expires_at",
        pu."created_at",
        pu."updated_at",
        p."plot_number",
        p."cadastral_number",
        p."area",
        p."address"
      FROM "plot_users" pu
      LEFT JOIN "plots" p ON pu."plot_id" = p."id"
      WHERE pu."user_id" = ${userId}
        ${role !== undefined ? Prisma.sql`AND pu."role" = ${role}` : Prisma.empty}
        ${status ? Prisma.sql`AND pu."status" = ${status}` : Prisma.empty}
        ${
          search
            ? Prisma.sql`
                AND (
                  LOWER(p."plot_number") LIKE LOWER(${searchPattern})
                  OR LOWER(p."address") LIKE LOWER(${searchPattern})
                )
              `
            : Prisma.empty
        }
      ORDER BY
        CASE pu."status"
          WHEN 'active' THEN 0
          WHEN 'pending' THEN 1
          WHEN 'expired' THEN 2
          ELSE 3
        END,
        pu."assigned_at" DESC
      LIMIT ${limit}
      OFFSET ${((page - 1) * limit)}
    `;

    // Преобразуем результаты в PlotUserRoleConnection
    return records.map(record => ({
      id: record.id,
      userId: record.user_id,
      plotId: record.plot_id,
      role: record.role as 1 | 2 | 3,
      status: record.status as 'active' | 'pending' | 'expired',
      comment: record.comment,
      assignedAt: new Date(record.assigned_at),
      expiresAt: record.expires_at ? new Date(record.expires_at) : null,
      createdAt: new Date(record.created_at),
      updatedAt: new Date(record.updated_at),
      plot: record.plot_number
        ? {
            id: record.plot_id,
            plotNumber: record.plot_number,
            cadastralNumber: record.cadastral_number ?? null,
            area: record.area ? parseFloat(record.area) : null,
            address: record.address ?? null,
          }
        : null,
    }));
  }

  /**
   * Поиск связей пользователя по номеру участка или адресу
   *
   * @param userId - Идентификатор пользователя
   * @param query - Поисковый запрос (plot_number, plot.address)
   * @returns Массив связей, соответствующих запросу
   * @throws {PlotUserRoleNotFoundError} если пользователь не найден
   *
   * @spec
   * - Case-insensitive contains по plot_number и plot.address
   * - Сортировка: active → pending → expired, затем assignedAt DESC
   *
   * @see US-19-3 FR-5, AC-5.2, AC-5.3
   */
  async searchByPlot(
    userId: string,
    query: string
  ): Promise<import('./plotUser.types').PlotUserRoleConnection[]> {
    // Проверяем существование пользователя
    const userExists = await this.userExists(userId);
    if (!userExists) {
      throw new PlotUserRoleNotFoundError(`Пользователь с ID '${userId}' не найден`);
    }

    const searchPattern = `%${query}%`;

    const records = await this.prisma.$queryRaw<Array<{
      id: string;
      user_id: string;
      plot_id: string;
      role: number;
      status: string;
      comment: string | null;
      assigned_at: string;
      expires_at: string | null;
      created_at: string;
      updated_at: string;
      plot_number?: string;
      cadastral_number?: string | null;
      area?: string | null;
      address?: string | null;
    }>>`
      SELECT
        pu."id",
        pu."user_id",
        pu."plot_id",
        pu."role",
        pu."status",
        pu."comment",
        pu."assigned_at",
        pu."expires_at",
        pu."created_at",
        pu."updated_at",
        p."plot_number",
        p."cadastral_number",
        p."area",
        p."address"
      FROM "plot_users" pu
      LEFT JOIN "plots" p ON pu."plot_id" = p."id"
      WHERE pu."user_id" = ${userId}
        AND (
          LOWER(p."plot_number") LIKE LOWER(${searchPattern})
          OR LOWER(p."address") LIKE LOWER(${searchPattern})
        )
      ORDER BY
        CASE pu."status"
          WHEN 'active' THEN 0
          WHEN 'pending' THEN 1
          WHEN 'expired' THEN 2
          ELSE 3
        END,
        pu."assigned_at" DESC
    `;

    // Преобразуем результаты в PlotUserRoleConnection
    return records.map(record => ({
      id: record.id,
      userId: record.user_id,
      plotId: record.plot_id,
      role: record.role as 1 | 2 | 3,
      status: record.status as 'active' | 'pending' | 'expired',
      comment: record.comment,
      assignedAt: new Date(record.assigned_at),
      expiresAt: record.expires_at ? new Date(record.expires_at) : null,
      createdAt: new Date(record.created_at),
      updatedAt: new Date(record.updated_at),
      plot: record.plot_number
        ? {
            id: record.plot_id,
            plotNumber: record.plot_number,
            cadastralNumber: record.cadastral_number ?? null,
            area: record.area ? parseFloat(record.area) : null,
            address: record.address ?? null,
          }
        : null,
    }));
  }

  /**
   * Найти связь пользователя с информацией об участке
   *
   * @param userId - Идентификатор пользователя
   * @param id - Идентификатор связи plot_users
   * @returns Связь с информацией об участке или null
   *
   * @spec
   * - JOIN с plots
   * - Возвращает null если не найдена
   *
   * @see US-19-3 AC-2.4
   */
  async findWithPlot(
    userId: string,
    id: string
  ): Promise<import('./plotUser.types').PlotUserRoleConnection | null> {
    const record = await this.prisma.$queryRaw<Array<{
      id: string;
      user_id: string;
      plot_id: string;
      role: number;
      status: string;
      comment: string | null;
      assigned_at: string;
      expires_at: string | null;
      created_at: string;
      updated_at: string;
      plot_number?: string;
      cadastral_number?: string | null;
      area?: string | null;
      address?: string | null;
    }>>`
      SELECT
        pu."id",
        pu."user_id",
        pu."plot_id",
        pu."role",
        pu."status",
        pu."comment",
        pu."assigned_at",
        pu."expires_at",
        pu."created_at",
        pu."updated_at",
        p."plot_number",
        p."cadastral_number",
        p."area",
        p."address"
      FROM "plot_users" pu
      LEFT JOIN "plots" p ON pu."plot_id" = p."id"
      WHERE pu."id" = ${id}
        AND pu."user_id" = ${userId}
      LIMIT 1
    `;

    if (record.length === 0) {
      return null;
    }

    const r = record[0];
    return {
      id: r.id,
      userId: r.user_id,
      plotId: r.plot_id,
      role: r.role as 1 | 2 | 3,
      status: r.status as 'active' | 'pending' | 'expired',
      comment: r.comment,
      assignedAt: new Date(r.assigned_at),
      expiresAt: r.expires_at ? new Date(r.expires_at) : null,
      createdAt: new Date(r.created_at),
      updatedAt: new Date(r.updated_at),
      plot: r.plot_number
        ? {
            id: r.plot_id,
            plotNumber: r.plot_number,
            cadastralNumber: r.cadastral_number ?? null,
            area: r.area ? parseFloat(r.area) : null,
            address: r.address ?? null,
          }
        : null,
    };
  }

}

/**
 * @class PlotUserRoleHistoryRepositoryPrisma
 * @domain plotUser
 * @description Реализация репозитория истории изменений связей пользователь-участок на основе Prisma
 *
 * @spec
 * - Использует singleton паттерн через prisma клиент
 * - Преобразует Prisma модели в доменные типы
 * - Автоматически управляет changedAt через Prisma @updatedAt
 */
export class PlotUserRoleHistoryRepositoryPrisma implements IPlotUserRoleHistoryRepository {
  private readonly prisma: PrismaClient;
  
  constructor(prisma?: PrismaClient) {
    this.prisma = prisma || defaultPrisma;
  }

  /**
    * Создать запись в истории изменений
   *
   * @param data - Данные для записи в историю
   * @returns Созданная запись истории
   *
   * @spec
   * - Автоматически генерирует id и changedAt
   * - Сохраняет oldValues и newValues для аудита
   */
  async create(
    data: Omit<PlotUserRoleHistory, 'id' | 'changedAt'> & { changedAt?: Date }
  ): Promise<PlotUserRoleHistory> {
    const record = await this.prisma.plotUserRoleHistory.create({
      data: {
        plotUserId: data.plotUserId,
        userId: data.userId,
        plotId: data.plotId,
        role: data.role,
        status: data.status,
        comment: data.comment,
        changedBy: data.changedBy,
        changedAt: data.changedAt ?? new Date(),
        changedReason: data.changedReason,
        oldValues: data.oldValues as Prisma.InputJsonValue,
        newValues: data.newValues as Prisma.InputJsonValue,
      },
    });

    return this.mapToHistory(record);
  }

  /**
   * Найти всю историю для конкретной связи
   *
   * @param plotUserId - Идентификатор связи plot_users
   * @returns Массив записей истории, отсортированных по changedAt (по убыванию)
   *
   * @spec
   * - Возвращает все изменения от создания до текущих пор
   * - Сортирует по дате изменения (новые primero)
   * - Возвращает пустой массив если история пуста
   */
  async findAllByPlotUserId(plotUserId: string): Promise<PlotUserRoleHistory[]> {
    const records = await this.prisma.plotUserRoleHistory.findMany({
      where: { plotUserId },
      orderBy: { changedAt: 'desc' },
    });

    return records.map(this.mapToHistory.bind(this));
  }

  /**
   * Найти историю пользователя на участке
   *
   * @param userId - Идентификатор пользователя
   * @param plotId - Идентификатор участка
   * @returns Массив записей истории, отсортированных по changedAt (по убыванию)
   *
   * @spec
   * - Возвращает все изменения для пары user-plot
   * - Сортирует по дате изменения (новые primero)
   */
  async findByUserIdAndPlotId(
    userId: string,
    plotId: string
  ): Promise<PlotUserRoleHistory[]> {
    const records = await this.prisma.plotUserRoleHistory.findMany({
      where: { userId, plotId },
      orderBy: { changedAt: 'desc' },
    });

    return records.map(this.mapToHistory.bind(this));
  }

  /**
   * Преобразует запись Prisma в доменный тип PlotUserRoleHistory
   *
   * @param record - Запись из базы данных
   * @returns Доменный объект PlotUserRoleHistory
   *
   * @spec
   * - Преобразует все поля в camelCase
   * - Преобразует даты из строки в Date объекты
   * - Обрабатывает JSON поля (oldValues, newValues)
   */
  private mapToHistory(record: {
    id: string;
    plotUserId: string;
    userId: string;
    plotId: string;
    role: number;
    status: string;
    comment: string | null;
    changedBy: string;
    changedAt: Date;
    changedReason: string;
    oldValues: Prisma.InputJsonValue | null;
    newValues: Prisma.InputJsonValue | null;
  }): PlotUserRoleHistory {
    return {
      id: record.id,
      plotUserId: record.plotUserId,
      userId: record.userId,
      plotId: record.plotId,
      role: record.role as 1 | 2 | 3,
      status: record.status as 'active' | 'pending' | 'expired',
      comment: record.comment,
      changedBy: record.changedBy,
      changedAt: record.changedAt,
      changedReason: record.changedReason,
      oldValues: typeof record.oldValues === 'object' && record.oldValues !== null ? (record.oldValues as Record<string, unknown>) : null,
      newValues: typeof record.newValues === 'object' && record.newValues !== null ? (record.newValues as Record<string, unknown>) : null,
    };
  }
}
