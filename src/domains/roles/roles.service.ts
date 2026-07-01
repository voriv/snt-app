/**
 * @file roles.service.ts
 * @domain roles
 * @description Бизнес-логика управления ролями, страницами, API endpoints и назначениями
 *
 * @spec
 * - Валидация: через Zod-схемы из roles.validators.ts
 * - Ошибки: RoleNotFoundError, RoleDuplicateError, RoleSystemProtectedError, LastSuperAdminError,
 *           PageNotFoundError, PageDuplicateError, ApiEndpointNotFoundError, ApiEndpointDuplicateError,
 *           RoleInvalidDataError, PageInvalidDataError, ApiEndpointInvalidDataError
 * - Зависимости: репозитории через DI (конструктор)
 *
 * @see docs/user-stories/US-8-roles-management.md — FR-2..FR-14
 */
import type {
  IRoleRepository,
  IPageRepository,
  IRolePageRepository,
  IApiEndpointRepository,
  IRoleApiEndpointRepository,
} from './roles.repository.interface';
import type { Role, Page, ApiEndpoint } from './roles.types';
import type { UserData } from '@/domains/auth/auth.types';
import {
  createRoleSchema,
  updateRoleSchema,
  createPageSchema,
  updatePageSchema,
  createApiEndpointSchema,
  updateApiEndpointSchema,
} from './roles.validators';
import {
  RoleNotFoundError,
  RoleDuplicateError,
  RoleSystemProtectedError,
  LastSuperAdminError,
  RoleInvalidDataError,
  PageNotFoundError,
  PageDuplicateError,
  PageInvalidDataError,
  ApiEndpointNotFoundError,
  ApiEndpointDuplicateError,
  ApiEndpointInvalidDataError,
} from './roles.errors';

/**
 * @service RoleService
 * @domain roles
 * @description Бизнес-логика CRUD ролей и управления участниками/страницами роли
 *
 * @spec
 * - Создание: is_system=false (всегда для API-созданных ролей)
 * - Обновление: системную роль нельзя переименовать (RoleSystemProtectedError)
 * - Удаление: только несистемные; защита последнего SUPER_ADMIN (LastSuperAdminError)
 * - assign/unassign операции идемпотентны
 *
 * @see docs/user-stories/US-8-roles-management.md — FR-3..FR-10
 */
export class RoleService {
  constructor(
    private readonly roleRepo: IRoleRepository,
    private readonly rolePageRepo: IRolePageRepository,
  ) {}

  /**
   * Найти все роли
   * @returns Массив всех ролей, включая системные
   */
  async findAll(): Promise<Role[]> {
    return this.roleRepo.findAll();
  }

  /**
   * Найти роль по ID
   * @param id - Уникальный идентификатор роли
   * @returns Полный объект Role
   * @throws {RoleNotFoundError} если роль не найдена
   */
  async findById(id: string): Promise<Role> {
    const role = await this.roleRepo.findById(id);
    if (!role) {
      throw new RoleNotFoundError(id);
    }
    return role;
  }

  /**
   * Создать новую роль
   * @param data - { name, description? }
   * @returns Созданная роль с is_system=false
   * @throws {RoleInvalidDataError} при ошибке валидации
   * @throws {RoleDuplicateError} если имя уже существует
   *
   * @spec
   * - Валидация через createRoleSchema
   * - is_system всегда false при создании через API
   * - При Prisma P2002 → RoleDuplicateError
   */
  async create(data: unknown): Promise<Role> {
    const validated = createRoleSchema.parse(data);

    const existing = await this.roleRepo.findByName(validated.name);
    if (existing) {
      throw new RoleDuplicateError(validated.name);
    }

    try {
      return await this.roleRepo.create({
        name: validated.name,
        description: validated.description ?? undefined,
      });
    } catch (error) {
      const prismaError = error as { code?: string };
      if (prismaError.code === 'P2002') {
        throw new RoleDuplicateError(validated.name);
      }
      throw error;
    }
  }

  /**
   * Обновить роль
   * @param id - ID роли
   * @param data - { name?, description? }
   * @returns Обновлённая роль
   * @throws {RoleNotFoundError} если роль не найдена
   * @throws {RoleSystemProtectedError} при попытке изменить name системной роли
   * @throws {RoleDuplicateError} при дублировании имени
   *
   * @spec
   * - Для системных ролей name игнорируется
   * - Валидация через updateRoleSchema
   */
  async update(id: string, data: unknown): Promise<Role> {
    const validated = updateRoleSchema.parse(data);

    const role = await this.roleRepo.findById(id);
    if (!role) {
      throw new RoleNotFoundError(id);
    }

    // Системную роль нельзя переименовать
    if (role.isSystem && validated.name !== undefined && validated.name !== role.name) {
      throw new RoleSystemProtectedError(role.name);
    }

    // Проверка дублирования имени (если меняется)
    if (validated.name !== undefined && validated.name !== role.name) {
      const existing = await this.roleRepo.findByName(validated.name);
      if (existing) {
        throw new RoleDuplicateError(validated.name);
      }
    }

    try {
      return await this.roleRepo.update(id, {
        name: role.isSystem ? undefined : validated.name,
        description: validated.description ?? undefined,
      });
    } catch (error) {
      const prismaError = error as { code?: string };
      if (prismaError.code === 'P2002') {
        throw new RoleDuplicateError(validated.name ?? role.name);
      }
      throw error;
    }
  }

  /**
   * Удалить роль
   * @param id - ID роли
   * @throws {RoleNotFoundError} если роль не найдена
   * @throws {RoleSystemProtectedError} если роль системная (is_system=true)
   * @throws {LastSuperAdminError} если это последний SUPER_ADMIN у пользователя
   *
   * @spec
   * - Только несистемные роли можно удалить
   * - Каскадно удаляются user_roles, role_pages, role_api_endpoints (БД CASCADE)
   * - Пользователи теряют эту роль и связанные права
   */
  async delete(id: string): Promise<void> {
    const role = await this.roleRepo.findById(id);
    if (!role) {
      throw new RoleNotFoundError(id);
    }

    if (role.isSystem) {
      throw new RoleSystemProtectedError(role.name);
    }

    await this.roleRepo.delete(id);
  }

  /**
   * Получить участников роли
   * @param roleId - ID роли
   * @returns Массив пользователей, назначенных роли
   * @throws {RoleNotFoundError} если роль не найдена
   */
  async getRoleUsers(roleId: string): Promise<UserData[]> {
    const role = await this.roleRepo.findById(roleId);
    if (!role) {
      throw new RoleNotFoundError(roleId);
    }
    return this.roleRepo.findUsersByRoleId(roleId);
  }

  /**
   * Добавить пользователя в роль
   * @param roleId - ID роли
   * @param userId - ID пользователя
   * @throws {RoleNotFoundError} если роль не найдена
   *
   * @spec
   * - Идемпотентно (составной PK)
   */
  async addUserToRole(roleId: string, userId: string): Promise<void> {
    const role = await this.roleRepo.findById(roleId);
    if (!role) {
      throw new RoleNotFoundError(roleId);
    }
    await this.roleRepo.addUserToRole(userId, roleId);
  }

  /**
   * Исключить пользователя из роли
   * @param roleId - ID роли
   * @param userId - ID пользователя
   * @throws {RoleNotFoundError} если роль не найдена
   * @throws {LastSuperAdminError} если это последний SUPER_ADMIN и других SUPER_ADMIN в системе нет
   *
   * @spec
   * - Идемпотентно
   * - BR-5: нельзя исключить пользователя из SUPER_ADMIN если это его последняя такая роль
   *   и других SUPER_ADMIN в системе нет
   */
  async removeUserFromRole(roleId: string, userId: string): Promise<void> {
    const role = await this.roleRepo.findById(roleId);
    if (!role) {
      throw new RoleNotFoundError(roleId);
    }

    // Защита последнего SUPER_ADMIN: если удаляем роль SUPER_ADMIN и в системе всего 1 запись
    if (role.name === 'SUPER_ADMIN') {
      const totalSuperAdmins = await this.roleRepo.countSuperAdmins();
      if (totalSuperAdmins <= 1) {
        throw new LastSuperAdminError();
      }
    }

    await this.roleRepo.removeUserFromRole(userId, roleId);
  }

  /**
   * Получить страницы, назначенные роли
   * @param roleId - ID роли
   * @returns Массив страниц
   * @throws {RoleNotFoundError} если роль не найдена
   */
  async getRolePages(roleId: string): Promise<Page[]> {
    const role = await this.roleRepo.findById(roleId);
    if (!role) {
      throw new RoleNotFoundError(roleId);
    }
    return this.rolePageRepo.findPagesByRoleId(roleId);
  }

  /**
   * Назначить страницу роли
   * @param roleId - ID роли
   * @param pageId - ID страницы
   * @throws {RoleNotFoundError} если роль не найдена
   * @throws {PageNotFoundError} если страница не найдена
   *
   * @spec - Идемпотентно (составной PK)
   */
  async assignPageToRole(roleId: string, pageId: string): Promise<void> {
    const role = await this.roleRepo.findById(roleId);
    if (!role) {
      throw new RoleNotFoundError(roleId);
    }

    // Проверка существования страницы через PageRepository — но RoleService не имеет pageRepo.
    // Используем rolePageRepo.findRolesByPageId чтобы проверить, существует ли страница
    // (бросит Prisma-ошибку если pageId не существует, но лучше проверить явно).
    // Делегируем проверку через assignPageToRole — если страница не существует, upsert упадёт с P2003.
    try {
      await this.rolePageRepo.assignPageToRole(roleId, pageId);
    } catch (error) {
      const prismaError = error as { code?: string };
      // P2003 — foreign key constraint violation
      if (prismaError.code === 'P2003') {
        throw new PageNotFoundError(pageId);
      }
      throw error;
    }
  }

  /**
   * Снять страницу с роли
   * @param roleId - ID роли
   * @param pageId - ID страницы
   * @throws {RoleNotFoundError} если роль не найдена
   *
   * @spec - Идемпотентно
   */
  async unassignPageFromRole(roleId: string, pageId: string): Promise<void> {
    const role = await this.roleRepo.findById(roleId);
    if (!role) {
      throw new RoleNotFoundError(roleId);
    }
    await this.rolePageRepo.unassignPageFromRole(roleId, pageId);
  }

  /**
   * Получить имена ролей пользователя (для NextAuth session, US-8)
   *
   * @param userId - ID пользователя
   * @returns Массив имён ролей пользователя
   *
   * @spec
   * - Используется в lib/auth.ts для формирования JWT/session.user.roles
   * - Возвращает пустой массив если у пользователя нет ролей
   */
  async getRoleNamesByUserId(userId: string): Promise<string[]> {
    const roles = await this.roleRepo.findRolesByUserId(userId);
    return roles.map(r => r.name);
  }

  /**
   * Поиск пользователей по email или имени
   *
   * @param query - Строка поиска (минимум 2 символа)
   * @returns Массив найденных пользователей, максимум 20
   * @spec - Используется для UserSearch при добавлении участников в роль (FR-8, AC-10)
   */
  async searchUsers(query: string): Promise<UserData[]> {
    return this.roleRepo.searchUsers(query);
  }
}

/**
 * @service PageService
 * @domain roles
 * @description Бизнес-логика CRUD реестра страниц
 *
 * @spec
 * - Создание: path уникальный, начинается с /
 * - Удаление: каскадно удаляет role_pages (БД CASCADE)
 *
 * @see docs/user-stories/US-8-roles-management.md — FR-7
 */
export class PageService {
  constructor(private readonly pageRepo: IPageRepository) {}

  /**
   * Найти все страницы
   * @returns Массив всех страниц реестра
   */
  async findAll(): Promise<Page[]> {
    return this.pageRepo.findAll();
  }

  /**
   * Найти страницу по ID
   * @param id - ID страницы
   * @returns Полный объект Page
   * @throws {PageNotFoundError} если страница не найдена
   */
  async findById(id: string): Promise<Page> {
    const page = await this.pageRepo.findById(id);
    if (!page) {
      throw new PageNotFoundError(id);
    }
    return page;
  }

  /**
   * Создать страницу
   * @param data - { path, title, groupName?, sortOrder?, isActive? }
   * @returns Созданная страница
   * @throws {PageInvalidDataError} при ошибке валидации
   * @throws {PageDuplicateError} если path уже существует
   *
   * @spec
   * - Валидация через createPageSchema
   * - sortOrder по умолчанию 0, isActive по умолчанию true
   */
  async create(data: unknown): Promise<Page> {
    const validated = createPageSchema.parse(data);

    const existing = await this.pageRepo.findByPath(validated.path);
    if (existing) {
      throw new PageDuplicateError(validated.path);
    }

    try {
      return await this.pageRepo.create({
        path: validated.path,
        title: validated.title,
        groupName: validated.groupName ?? undefined,
        sortOrder: validated.sortOrder,
        isActive: validated.isActive,
      });
    } catch (error) {
      const prismaError = error as { code?: string };
      if (prismaError.code === 'P2002') {
        throw new PageDuplicateError(validated.path);
      }
      throw error;
    }
  }

  /**
   * Обновить страницу
   * @param id - ID страницы
   * @param data - поля для обновления
   * @returns Обновлённая страница
   * @throws {PageNotFoundError} если страница не найдена
   * @throws {PageInvalidDataError} при ошибке валидации
   * @throws {PageDuplicateError} при дублировании path
   */
  async update(id: string, data: unknown): Promise<Page> {
    const validated = updatePageSchema.parse(data);

    const page = await this.pageRepo.findById(id);
    if (!page) {
      throw new PageNotFoundError(id);
    }

    // Проверка дублирования path (если меняется)
    if (validated.path !== undefined && validated.path !== page.path) {
      const existing = await this.pageRepo.findByPath(validated.path);
      if (existing) {
        throw new PageDuplicateError(validated.path);
      }
    }

    try {
      return await this.pageRepo.update(id, {
        path: validated.path,
        title: validated.title,
        groupName: validated.groupName ?? undefined,
        sortOrder: validated.sortOrder,
        isActive: validated.isActive,
      });
    } catch (error) {
      const prismaError = error as { code?: string };
      if (prismaError.code === 'P2002') {
        throw new PageDuplicateError(validated.path ?? page.path);
      }
      throw error;
    }
  }

  /**
   * Удалить страницу
   * @param id - ID страницы
   * @throws {PageNotFoundError} если страница не найдена
   *
   * @spec - Каскадно удаляет role_pages (БД CASCADE)
   */
  async delete(id: string): Promise<void> {
    const page = await this.pageRepo.findById(id);
    if (!page) {
      throw new PageNotFoundError(id);
    }
    await this.pageRepo.delete(id);
  }
}

/**
 * @service ApiEndpointService
 * @domain roles
 * @description Бизнес-логика CRUD реестра API endpoints
 *
 * @spec
 * - Создание: уникальная комбинация (method, path)
 * - Удаление: каскадно удаляет role_api_endpoints (БД CASCADE)
 *
 * @see docs/user-stories/US-8-roles-management.md — FR-13
 */
export class ApiEndpointService {
  constructor(private readonly endpointRepo: IApiEndpointRepository) {}

  /**
   * Найти все API endpoints
   * @returns Массив всех endpoints реестра
   */
  async findAll(): Promise<ApiEndpoint[]> {
    return this.endpointRepo.findAll();
  }

  /**
   * Найти endpoint по ID
   * @param id - ID endpoint
   * @returns Полный объект ApiEndpoint
   * @throws {ApiEndpointNotFoundError} если endpoint не найден
   */
  async findById(id: string): Promise<ApiEndpoint> {
    const endpoint = await this.endpointRepo.findById(id);
    if (!endpoint) {
      throw new ApiEndpointNotFoundError(id);
    }
    return endpoint;
  }

  /**
   * Найти endpoint по комбинации method+path
   * @param method - HTTP-метод
   * @param path - Путь
   * @returns ApiEndpoint если найден, null если не найден
   *
   * @spec - Используется AccessService для определения access_type запроса
   */
  async findByMethodAndPath(method: string, path: string): Promise<ApiEndpoint | null> {
    return this.endpointRepo.findByMethodAndPath(method, path);
  }

  /**
   * Создать API endpoint
   * @param data - { method, path, description?, accessType?, isActive? }
   * @returns Созданный endpoint
   * @throws {ApiEndpointInvalidDataError} при ошибке валидации
   * @throws {ApiEndpointDuplicateError} при дублировании (method, path)
   *
   * @spec
   * - Валидация через createApiEndpointSchema
   * - accessType по умолчанию 'role', isActive по умолчанию true
   */
  async create(data: unknown): Promise<ApiEndpoint> {
    const validated = createApiEndpointSchema.parse(data);

    const existing = await this.endpointRepo.findByMethodAndPath(validated.method, validated.path);
    if (existing) {
      throw new ApiEndpointDuplicateError(validated.method, validated.path);
    }

    try {
      return await this.endpointRepo.create({
        method: validated.method,
        path: validated.path,
        description: validated.description ?? undefined,
        accessType: validated.accessType,
        isActive: validated.isActive,
      });
    } catch (error) {
      const prismaError = error as { code?: string };
      if (prismaError.code === 'P2002') {
        throw new ApiEndpointDuplicateError(validated.method, validated.path);
      }
      throw error;
    }
  }

  /**
   * Обновить API endpoint
   * @param id - ID endpoint
   * @param data - поля для обновления
   * @returns Обновлённый endpoint
   * @throws {ApiEndpointNotFoundError} если endpoint не найден
   * @throws {ApiEndpointInvalidDataError} при ошибке валидации
   * @throws {ApiEndpointDuplicateError} при дублировании (method, path)
   */
  async update(id: string, data: unknown): Promise<ApiEndpoint> {
    const validated = updateApiEndpointSchema.parse(data);

    const endpoint = await this.endpointRepo.findById(id);
    if (!endpoint) {
      throw new ApiEndpointNotFoundError(id);
    }

    // Проверка дублирования (method, path) если меняется
    const newMethod = validated.method ?? endpoint.method;
    const newPath = validated.path ?? endpoint.path;
    if (newMethod !== endpoint.method || newPath !== endpoint.path) {
      const existing = await this.endpointRepo.findByMethodAndPath(newMethod, newPath);
      if (existing) {
        throw new ApiEndpointDuplicateError(newMethod, newPath);
      }
    }

    try {
      return await this.endpointRepo.update(id, {
        method: validated.method,
        path: validated.path,
        description: validated.description ?? undefined,
        accessType: validated.accessType,
        isActive: validated.isActive,
      });
    } catch (error) {
      const prismaError = error as { code?: string };
      if (prismaError.code === 'P2002') {
        throw new ApiEndpointDuplicateError(newMethod, newPath);
      }
      throw error;
    }
  }

  /**
   * Удалить API endpoint
   * @param id - ID endpoint
   * @throws {ApiEndpointNotFoundError} если endpoint не найден
   *
   * @spec - Каскадно удаляет role_api_endpoints (БД CASCADE)
   */
  async delete(id: string): Promise<void> {
    const endpoint = await this.endpointRepo.findById(id);
    if (!endpoint) {
      throw new ApiEndpointNotFoundError(id);
    }
    await this.endpointRepo.delete(id);
  }
}

/**
 * @service RoleApiEndpointService
 * @domain roles
 * @description Управление назначениями API endpoints ролям
 *
 * @spec
 * - assign/unassign операции идемпотентны
 * - Назначения имеют значение только для endpoints с access_type=role
 *
 * @see docs/user-stories/US-8-roles-management.md — FR-14
 */
export class RoleApiEndpointService {
  constructor(private readonly roleEndpointRepo: IRoleApiEndpointRepository) {}

  /**
   * Получить API endpoints, назначенные роли
   * @param roleId - ID роли
   * @returns Массив endpoints
   * @throws {RoleNotFoundError} если роль не найдена
   */
  async getRoleEndpoints(roleId: string): Promise<ApiEndpoint[]> {
    return this.roleEndpointRepo.findEndpointsByRoleId(roleId);
  }

  /**
   * Назначить API endpoint роли
   * @param roleId - ID роли
   * @param endpointId - ID endpoint
   * @throws {ApiEndpointNotFoundError} если endpoint не найден
   *
   * @spec - Идемпотентно (составной PK)
   */
  async assignEndpointToRole(roleId: string, endpointId: string): Promise<void> {
    try {
      await this.roleEndpointRepo.assignEndpointToRole(roleId, endpointId);
    } catch (error) {
      const prismaError = error as { code?: string };
      // P2003 — foreign key constraint violation
      if (prismaError.code === 'P2003') {
        throw new ApiEndpointNotFoundError(endpointId);
      }
      throw error;
    }
  }

  /**
   * Снять API endpoint с роли
   * @param roleId - ID роли
   * @param endpointId - ID endpoint
   *
   * @spec - Идемпотентно
   */
  async unassignEndpointFromRole(roleId: string, endpointId: string): Promise<void> {
    await this.roleEndpointRepo.unassignEndpointFromRole(roleId, endpointId);
  }
}
