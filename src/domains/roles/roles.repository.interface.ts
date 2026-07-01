/**
 * @file roles.repository.interface.ts
 * @domain roles
 * @description Контракты доступа к данным для ролей, страниц, API endpoints и связей M:N
 *
 * @spec
 * - Все методы асинхронные
 * - findById/findBy* возвращают null если не найдено — НЕ бросают ошибку
 * - create/update могут выбросить Prisma P2002 при нарушении уникальности (преобразуется в сервисе)
 * - Идемпотентные операции assign/unassign не бросают ошибку при повторном вызове
 *
 * @see docs/user-stories/US-8-roles-management.md — секция «Repository»
 */
import type {
  Role,
  Page,
  ApiEndpoint,
  CreateRoleInput,
  UpdateRoleInput,
  CreatePageInput,
  UpdatePageInput,
  CreateApiEndpointInput,
  UpdateApiEndpointInput,
} from './roles.types';
import type { UserData } from '@/domains/auth/auth.types';

/**
 * @interface IRoleRepository
 * @domain roles
 * @description Доступ к данным ролей и связям users↔roles
 *
 * @spec
 * - findRolesByUserId: возвращает все роли пользователя (для AccessService)
 * - countSuperAdmins: возвращает количество пользователей с ролью SUPER_ADMIN
 *   (для защиты последнего SUPER_ADMIN — BR-4, BR-5)
 */
export interface IRoleRepository {
  /** Найти все роли */
  findAll(): Promise<Role[]>;

  /**
   * Найти роль по ID
   * @returns Role если найдена, null если не найдена — НЕ бросает ошибку
   */
  findById(id: string): Promise<Role | null>;

  /**
   * Найти роль по имени
   * @returns Role если найдена, null если не найдена — НЕ бросает ошибку
   */
  findByName(name: string): Promise<Role | null>;

  /** Создать роль. @throws Prisma P2002 при дублировании name */
  create(data: CreateRoleInput): Promise<Role>;

  /** Обновить роль. @throws Prisma P2002 при дублировании name */
  update(id: string, data: UpdateRoleInput): Promise<Role>;

  /** Удалить роль. Каскадно удаляет user_roles, role_pages, role_api_endpoints (БД CASCADE) */
  delete(id: string): Promise<void>;

  /** Найти пользователей, назначенных роли */
  findUsersByRoleId(roleId: string): Promise<UserData[]>;

  /**
   * Поиск пользователей по частичному совпадению email или name (case-insensitive)
   * @param query - Строка поиска (минимум 2 символа)
   * @returns Массив найденных пользователей (без пароля), максимум 20 результатов
   * @spec - Используется для UserSearch при добавлении участников в роль (FR-8, AC-10)
   */
  searchUsers(query: string): Promise<UserData[]>;

  /** Найти все роли пользователя (для AccessService и сессии) */
  findRolesByUserId(userId: string): Promise<Role[]>;

  /** Назначить роль пользователю. Идемпотентно (составной PK) */
  addUserToRole(userId: string, roleId: string): Promise<void>;

  /** Исключить роль у пользователя. Идемпотентно */
  removeUserFromRole(userId: string, roleId: string): Promise<void>;

  /**
   * Подсчитать количество пользователей с ролью SUPER_ADMIN
   * @returns Количество пользователей, имеющих роль SUPER_ADMIN
   * @spec — Используется для защиты последнего SUPER_ADMIN (BR-4, BR-5)
   */
  countSuperAdmins(): Promise<number>;
}

/**
 * @interface IPageRepository
 * @domain roles
 * @description Доступ к данным реестра страниц
 */
export interface IPageRepository {
  /** Найти все страницы */
  findAll(): Promise<Page[]>;

  /**
   * Найти страницу по ID
   * @returns Page если найдена, null если не найдена
   */
  findById(id: string): Promise<Page | null>;

  /**
   * Найти страницу по пути
   * @returns Page если найдена, null если не найдена
   */
  findByPath(path: string): Promise<Page | null>;

  /** Создать страницу. @throws Prisma P2002 при дублировании path */
  create(data: CreatePageInput): Promise<Page>;

  /** Обновить страницу. @throws Prisma P2002 при дублировании path */
  update(id: string, data: UpdatePageInput): Promise<Page>;

  /** Удалить страницу. Каскадно удаляет role_pages (БД CASCADE) */
  delete(id: string): Promise<void>;
}

/**
 * @interface IRolePageRepository
 * @domain roles
 * @description Доступ к данным связей roles↔pages
 *
 * @spec
 * - assign/unassign идемпотентны (составной PK)
 * - unassignAllPagesFromRole: для каскадной очистки при удалении роли (хотя БД CASCADE делает это автоматически)
 */
export interface IRolePageRepository {
  /** Найти страницы, назначенные роли */
  findPagesByRoleId(roleId: string): Promise<Page[]>;

  /** Найти роли, имеющие доступ к странице */
  findRolesByPageId(pageId: string): Promise<Role[]>;

  /** Назначить страницу роли. Идемпотентно */
  assignPageToRole(roleId: string, pageId: string): Promise<void>;

  /** Снять страницу с роли. Идемпотентно */
  unassignPageFromRole(roleId: string, pageId: string): Promise<void>;

  /** Снять все страницы с роли */
  unassignAllPagesFromRole(roleId: string): Promise<void>;
}

/**
 * @interface IApiEndpointRepository
 * @domain roles
 * @description Доступ к данным реестра API endpoints
 */
export interface IApiEndpointRepository {
  /** Найти все API endpoints */
  findAll(): Promise<ApiEndpoint[]>;

  /**
   * Найти endpoint по ID
   * @returns ApiEndpoint если найден, null если не найден
   */
  findById(id: string): Promise<ApiEndpoint | null>;

  /**
   * Найти endpoint по комбинации method+path
   * @returns ApiEndpoint если найден, null если не найден
   */
  findByMethodAndPath(method: string, path: string): Promise<ApiEndpoint | null>;

  /** Создать endpoint. @throws Prisma P2002 при дублировании (method, path) */
  create(data: CreateApiEndpointInput): Promise<ApiEndpoint>;

  /** Обновить endpoint. @throws Prisma P2002 при дублировании (method, path) */
  update(id: string, data: UpdateApiEndpointInput): Promise<ApiEndpoint>;

  /** Удалить endpoint. Каскадно удаляет role_api_endpoints (БД CASCADE) */
  delete(id: string): Promise<void>;
}

/**
 * @interface IRoleApiEndpointRepository
 * @domain roles
 * @description Доступ к данным связей roles↔api_endpoints
 *
 * @spec
 * - assign/unassign идемпотентны (составной PK)
 * - Имеет значение только для endpoints с access_type=role
 */
export interface IRoleApiEndpointRepository {
  /** Найти API endpoints, назначенные роли */
  findEndpointsByRoleId(roleId: string): Promise<ApiEndpoint[]>;

  /** Найти роли, имеющие доступ к endpoint */
  findRolesByEndpointId(endpointId: string): Promise<Role[]>;

  /** Назначить endpoint роли. Идемпотентно */
  assignEndpointToRole(roleId: string, endpointId: string): Promise<void>;

  /** Снять endpoint с роли. Идемпотентно */
  unassignEndpointFromRole(roleId: string, endpointId: string): Promise<void>;

  /** Снять все endpoints с роли */
  unassignAllEndpointsFromRole(roleId: string): Promise<void>;
}
