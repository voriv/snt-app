/**
 * @file users.repository.prisma.ts
 * @domain users
 * @description Prisma-реализация репозитория пользователей
 *
 * @spec
 * - Использует Prisma Client для доступа к БД
 * - JOIN user_profiles (LEFT) для firstName, lastName
 * - JOIN user_roles + roles для списка ролей
 * - Пагинация через skip/take
 * - Сортировка по createdAt DESC
 *
 * @see src/domains/users/users.repository.interface.ts
 */
import { prisma } from '@/infrastructure/prisma/client';
import type { Prisma } from '@prisma/client';
import type { UserDetail, UserFilters, UserListItem, UserListResponse, UserRoleDetail, UserSearchResult } from './users.types';
import type { IUsersRepository } from './users.repository.interface';

/**
 * @class UsersRepositoryPrisma
 * @domain users
 * @description Prisma-реализация IUsersRepository
 *
 * @spec
 * - Поиск по q использует OR с contains + mode: 'insensitive'
 * - Сортировка использует whitelist полей с маппингом на Prisma-поля
 * - Сортировка по firstName/lastName требует nested orderBy через profile
 */
export class UsersRepositoryPrisma implements IUsersRepository {
  /**
   * Whitelist допустимых полей для сортировки
   */
  private static readonly SORT_FIELDS = ['email', 'firstName', 'lastName', 'createdAt'] as const;

  /**
   * Построить where-условие для поиска по тексту
   *
   * @param q - Текст поиска
   * @returns Where-условие для Prisma (undefined если q пуст)
   *
   * @spec
   * - OR по email, profile.first_name, profile.last_name
   * - contains + mode: 'insensitive' для кроссплатформенного поиска
   */
  private buildWhere(q?: string): Prisma.UserWhereInput | undefined {
    if (!q) {
      return undefined;
    }
    return {
      OR: [
        { email: { contains: q, mode: 'insensitive' as const } },
        { name: { not: null, contains: q, mode: 'insensitive' as const } },
        { profile: { first_name: { contains: q, mode: 'insensitive' as const } } },
        { profile: { last_name: { contains: q, mode: 'insensitive' as const } } },
      ],
    };
  }

  /**
   * Получить список пользователей с пагинацией, поиском и сортировкой
   *
   * @param filters - Фильтры (page, limit, q, sort, order)
   * @returns Пагинированный ответ со списком пользователей
   *
   * @spec
   * - Поиск: если q задан, OR по email/firstName/lastName с contains + mode: 'insensitive'
   * - Сортировка: whitelist полей, маппинг на Prisma-поля
   * - Сортировка по firstName/lastName через nested orderBy { profile: { first_name: order } }
   * - Пагинация: skip = (page - 1) * limit, take = limit
   * - COUNT с теми же фильтрами поиска для корректной пагинации
   */
  async findAllUsers(filters: UserFilters): Promise<UserListResponse> {
    const { page, limit, q, sort, order } = filters;
    const skip = (page - 1) * limit;
    const take = limit;

    // --- Поиск ---
    const where = this.buildWhere(q);

    // --- Сортировка ---
    const validSort = UsersRepositoryPrisma.SORT_FIELDS.includes(sort as any) ? sort : 'createdAt';
    const validOrder = ['asc', 'desc'].includes(order as any) ? (order as 'asc' | 'desc') : 'desc';
    const orderBy = this.buildOrderBy(validSort, validOrder);

    // Получаем общее количество с тем же поисковым фильтром
    const total = await prisma.user.count({ where });

    // Получаем пользователей с профилями
    const users = await prisma.user.findMany({
      where,
      skip,
      take,
      orderBy,
      include: {
        profile: true,
        roles: {
          include: {
            role: true,
          },
        },
      },
    }) as Prisma.UserGetPayload<{
      include: { profile: true; roles: { include: { role: true } } };
    }>[];

    const items: UserListItem[] = users.map(user => ({
      id: user.id,
      email: user.email,
      firstName: user.profile?.first_name ?? null,
      lastName: user.profile?.last_name ?? null,
      roles: user.roles.map(ur => ur.role.name),
      createdAt: user.createdAt,
    }));

    return {
      items,
      total,
      page,
      limit,
    };
  }

  /**
   * Построить orderBy для Prisma на основе поля и направления сортировки
   *
   * @param sort - Поле сортировки (из whitelist)
   * @param order - Направление сортировки
   * @returns Объект orderBy для Prisma
   *
   * @spec
   * - email → { email: order }
   * - firstName → { profile: { first_name: order } }
   * - lastName → { profile: { last_name: order } }
   * - createdAt → { createdAt: order }
   */
  private buildOrderBy(
    sort: 'email' | 'firstName' | 'lastName' | 'createdAt',
    order: 'asc' | 'desc',
  ) {
    switch (sort) {
      case 'email':
        return { email: order };
      case 'firstName':
        return { profile: { first_name: order } };
      case 'lastName':
        return { profile: { last_name: order } };
      case 'createdAt':
        return { createdAt: order };
    }
  }

  /**
   * Найти пользователя по идентификатору с профилем и ролями
   *
   * @param id - Уникальный идентификатор пользователя
   * @returns Объект UserDetail или null если не найден
   *
   * @spec
   * - JOIN user_profiles (LEFT) для профиля
   * - JOIN user_roles + roles для списка ролей
   * - Возвращает null если пользователь не найден (НЕ бросает ошибку)
   */
  async findUserById(id: string): Promise<UserDetail | null> {
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        profile: true,
        roles: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!user) {
      return null;
    }

    const roles: UserRoleDetail[] = user.roles.map(ur => ({
      roleId: ur.role.id,
      roleName: ur.role.name,
      roleDescription: ur.role.description,
    }));

    return {
      id: user.id,
      email: user.email,
      firstName: user.profile?.first_name ?? null,
      lastName: user.profile?.last_name ?? null,
      patronymic: user.profile?.middle_name ?? null,
      phone: user.profile?.phone ?? null,
      createdAt: user.createdAt,
      roles,
    };
  }

  /**
   * Поиск пользователей для выбора собеседника.
   *
   * Выполняет поиск по подстроке `query` (содержит case-insensitive совпадение)
   * по следующим полям:
   * - `email` — `User.email` (`{ contains: query, mode: 'insensitive' }`)
   * - `name` — `User.name` (`{ not: null, contains: query, mode: 'insensitive' }`)
   * - `profile.first_name` — `UserProfile.first_name`
   *   (`{ contains: query, mode: 'insensitive' }`)
   * - `profile.last_name` — `UserProfile.last_name`
   *   (`{ contains: query, mode: 'insensitive' }`)
   *
   * Все ветки объединены через `OR` с `mode: 'insensitive'`. Текущий
   * пользователь (`excludeUserId`) исключается из результатов.
   *
   * @param query - Текст поиска (по email, name, profile.first_name, profile.last_name)
   * @param excludeUserId - ID пользователя для исключения (текущий пользователь)
   * @param limit - Максимальное количество результатов (default: 20, max: 50)
   * @returns Массив результатов поиска (`UserSearchResult[]`)
   *
   * @spec B-030 (симптом 1) — поиск по email подтверждён:
   * email-ветка `{ email: { contains: query, mode: 'insensitive' } }`
   * присутствует в `OR` фильтра `searchUsers`.
   *
   * @see docs/specs/comms/B-030-component-spec.md — раздел T1-1
   * @see docs/plans/REQ-COMMS-004-B030-plan.md — задача T1-1
   */
  async searchUsers(
    query: string,
    excludeUserId: string,
    limit: number = 20
  ): Promise<UserSearchResult[]> {
    const clampedLimit = Math.min(Math.max(limit, 1), 50);

    const users = await prisma.user.findMany({
      where: {
        id: { not: excludeUserId },
        OR: [
          { email: { contains: query, mode: 'insensitive' as const } },
          { name: { not: null, contains: query, mode: 'insensitive' as const } },
          { profile: { first_name: { contains: query, mode: 'insensitive' as const } } },
          { profile: { last_name: { contains: query, mode: 'insensitive' as const } } },
        ],
      },
      skip: 0,
      take: clampedLimit,
      include: {
        profile: {
          select: {
            first_name: true,
            last_name: true,
            avatar: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return users.map(user => {
      const firstName = user.profile?.first_name ?? '';
      const lastName = user.profile?.last_name ?? '';
      const name = [lastName, firstName].filter(Boolean).join(' ');

      return {
        id: user.id,
        email: user.email,
        name: name || user.email,
        avatar: user.profile?.avatar ?? null,
      };
    });
  }
}
