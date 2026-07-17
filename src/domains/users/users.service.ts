/**
 * @file users.service.ts
 * @domain users
 * @description Бизнес-логика управления списком пользователей
 *
 * @spec
 * - Валидация входных данных через Zod-схемы
 * - Вызов репозитория через DI
 *
 * @see docs/user-stories/US-20-01-просмотр-списка-пользователей.md
 * @see docs/user-stories/US-20-04-просмотр-связей-с-участками.md
 */
import type { IUsersRepository } from './users.repository.interface';
import type { UserDetail, UserFilters, UserListResponse, UserPlotConnection, UserSearchResult } from './users.types';
import type { PlotUserRoleService } from '@/domains/plotUser/plotUser.service';
import { PlotUserRoleRoleLabel } from '@/domains/plotUser/plotUser.types';
import { listUsersQuerySchema, userIdParamSchema } from './users.validators';
import { UserNotFoundError } from './users.errors';

/**
 * @service UsersService
 * @domain users
 * @description Бизнес-логика получения списка пользователей
 *
 * @spec
 * - Валидация: через Zod-схемы из users.validators.ts
 * - Зависимости: IUsersRepository через DI
 * - Зависимости: PlotUserRoleService через DI (для получения связей с участками)
 */
export class UsersService {
  constructor(
    private readonly repository: IUsersRepository,
    private readonly plotUserRoleService: PlotUserRoleService
  ) {}

  /**
   * Получить список пользователей с пагинацией, поиском и сортировкой
   *
   * @param query - Raw query параметры из запроса (строки)
   * @returns Пагинированный ответ со списком пользователей
   *
   * @spec
   * - Валидирует query параметры через listUsersQuerySchema
   * - Поддерживает: page, limit, q (поиск), sort (поле), order (направление)
   * - Вызывает repository.findAllUsers с валидированными фильтрами
   */
  async findAllUsers(query: Record<string, string | string[] | undefined>): Promise<UserListResponse> {
    const parsed = listUsersQuerySchema.parse(query);
    const filters: UserFilters = {
      page: parsed.page,
      limit: parsed.limit,
      q: parsed.q,
      sort: parsed.sort,
      order: parsed.order,
    };

    return this.repository.findAllUsers(filters);
  }

  /**
   * Найти пользователя по идентификатору с профилем и ролями
   *
   * @param id - Уникальный идентификатор пользователя
   * @returns Полный объект UserDetail
   * @throws {UserNotFoundError} если пользователь не найден
   *
   * @spec
   * - Валидирует id через userIdParamSchema
   * - Вызывает repository.findUserById
   * - Бросает UserNotFoundError если repository вернул null
   */
  async findUserById(id: string): Promise<UserDetail> {
    userIdParamSchema.parse({ id });
    const user = await this.repository.findUserById(id);
    if (!user) {
      throw new UserNotFoundError(id);
    }
    return user;
  }

  /**
   * Получить список связей пользователя с участками
   *
   * @param userId - Уникальный идентификатор пользователя
   * @returns Массив связей UserPlotConnection
   * @throws {UserNotFoundError} если пользователь не найден
   *
   * @spec
   * - Валидирует id через userIdParamSchema
   * - Проверяет существование пользователя через repository.findUserById
   * - Делегирует запрос PlotUserRoleService.findByUser()
   * - Трансформирует PlotUserRoleConnection → UserPlotConnection (упрощённый вид)
   * - Использует PlotUserRoleRoleLabel для получения названий ролей
   */
  async findUserPlotConnections(userId: string): Promise<UserPlotConnection[]> {
    userIdParamSchema.parse({ id: userId });

    // Проверяем существование пользователя
    const user = await this.repository.findUserById(userId);
    if (!user) {
      throw new UserNotFoundError(userId);
    }

    // Получаем связи через PlotUserRoleService
    const connections = await this.plotUserRoleService.findByUser(userId);

    // Трансформируем в упрощённый вид
    return connections
      .filter(conn => conn.plot !== null)
      .map(conn => ({
        plotId: conn.plotId,
        plotNumber: conn.plot.plotNumber,
        cadastralNumber: conn.plot.cadastralNumber,
        roleName: PlotUserRoleRoleLabel[conn.role as keyof typeof PlotUserRoleRoleLabel] ?? 'Неизвестно',
        assignedAt: conn.assignedAt,
      }));
  }

  /**
   * Поиск пользователей для выбора собеседника
   *
   * @param query - Текст поиска (минимум 2 символа)
   * @param excludeUserId - ID пользователя для исключения (текущий пользователь)
   * @param limit - Максимальное количество результатов (default: 20, max: 50)
   * @returns Массив результатов поиска
   *
   * @spec
   * - Валидирует query: минимум 2 символа
   * - Вызывает repository.searchUsers
   * - Возвращает массив UserSearchResult
   */
  async searchUsers(
    query: string,
    excludeUserId: string,
    limit?: number
  ): Promise<UserSearchResult[]> {
    if (query.length < 2) {
      throw new Error('Поисковый запрос должен содержать минимум 2 символа');
    }
    return this.repository.searchUsers(query, excludeUserId, limit);
  }
}
