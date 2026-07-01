/**
 * @file roles.types.ts
 * @domain roles
 * @description Доменные типы ролевой модели RBAC: Role, Page, ApiEndpoint и связи M:N
 *
 * @spec
 * - Все типы совместимы с Prisma-моделями, но не зависят от них напрямую
 * - Имена полей в camelCase (см. MODEL.md §5.1 — конвенции именования)
 *
 * @see docs/model/entities/role.md
 * @see docs/model/entities/page.md
 * @see docs/model/entities/api-endpoint.md
 * @see docs/model/entities/user-role.md
 * @see docs/model/entities/role-page.md
 * @see docs/model/entities/role-api-endpoint.md
 * @see docs/user-stories/US-8-roles-management.md — секция «Модель данных»
 */

/**
 * @type Role
 * @domain roles
 * @description Настраиваемая роль в системе RBAC
 *
 * @spec
 * - Бизнес-ключ: name (unique)
 * - Жизненный цикл: создаётся с isSystem=false; системные роли защищены от удаления/переименования
 * - Инварианты: name 2-50 символов, непустой, уникальный
 *
 * @see docs/model/entities/role.md — концептуальная модель
 */
export interface Role {
  /** Уникальный идентификатор. Генерируется автоматически (cuid) */
  id: string;
  /** Имя роли. Уникальное. 2-50 символов. Системные роли: SUPER_ADMIN, ADMIN, MEMBER, GUEST */
  name: string;
  /** Описание роли. Опциональное, до 500 символов */
  description: string | null;
  /** Признак системной роли. true — защищена от удаления/переименования */
  isSystem: boolean;
  /** Дата создания */
  createdAt: Date;
  /** Дата последнего обновления */
  updatedAt: Date;
}

/**
 * @type CreateRoleInput
 * @domain roles
 * @description DTO для создания роли
 *
 * @spec
 * - isSystem всегда false при создании через API (задаётся сервисом, не клиентом)
 */
export interface CreateRoleInput {
  /** Имя роли. 2-50 символов, уникальное */
  name: string;
  /** Описание. Опциональное, до 500 символов */
  description?: string;
}

/**
 * @type UpdateRoleInput
 * @domain roles
 * @description DTO для обновления роли
 *
 * @spec
 * - name игнорируется для системных ролей (проверка в сервисе)
 * - Все поля опциональны
 */
export interface UpdateRoleInput {
  /** Новое имя роли. Игнорируется для системных ролей */
  name?: string;
  /** Новое описание */
  description?: string;
}

/**
 * @type Page
 * @domain roles
 * @description Реестр страниц приложения
 *
 * @spec
 * - Бизнес-ключ: path (unique)
 * - Новая страница без role_pages недоступна всем, кроме SUPER_ADMIN
 * - is_active=false блокирует доступ всем, включая SUPER_ADMIN
 * - accessType добавлен в US-9 для унификации механизма доступа
 *
 * @see docs/model/entities/page.md — концептуальная модель
 */
export interface Page {
  /** Уникальный идентификатор. Генерируется автоматически (cuid) */
  id: string;
  /** URL-путь маршрута Next.js (например /dashboard/members). Уникальный. Начинается с / */
  path: string;
  /** Заголовок страницы для меню. 2-100 символов */
  title: string;
  /** Группа для меню. Опциональное */
  groupName: string | null;
  /** Порядок сортировки в меню @default 0 */
  sortOrder: number;
  /** Категория доступа: public, owner, role, super_admin @default role */
  accessType: AccessType;
  /** Активна ли страница. false — недоступна всем, включая SUPER_ADMIN */
  isActive: boolean;
  /** Дата создания */
  createdAt: Date;
  /** Дата последнего обновления */
  updatedAt: Date;
}

/**
 * @type CreatePageInput
 * @domain roles
 * @description DTO для создания страницы
 */
export interface CreatePageInput {
  /** Путь. Начинается с /, уникальный */
  path: string;
  /** Заголовок. 2-100 символов */
  title: string;
  /** Группа для меню. Опциональное */
  groupName?: string;
  /** Порядок сортировки @default 0 */
  sortOrder?: number;
  /** Активна ли страница @default true */
  isActive?: boolean;
}

/**
 * @type UpdatePageInput
 * @domain roles
 * @description DTO для обновления страницы
 */
export interface UpdatePageInput {
  /** Новый путь */
  path?: string;
  /** Новый заголовок */
  title?: string;
  /** Новая группа */
  groupName?: string;
  /** Новый порядок сортировки */
  sortOrder?: number;
  /** Новое состояние активности */
  isActive?: boolean;
}

/**
 * @type ApiEndpoint
 * @domain roles
 * @description Реестр API endpoints с категориями доступа
 *
 * @spec
 * - Уникальная комбинация (method, path)
 * - path может содержать :param (например /members/:id)
 * - access_type=public — без авторизации; owner — auth + владелец в handler;
 *   role — auth + role_api_endpoints; super_admin — auth + только SUPER_ADMIN
 * - is_active=false — недоступен всем, включая SUPER_ADMIN
 *
 * @see docs/model/entities/api-endpoint.md — концептуальная модель
 */
export interface ApiEndpoint {
  /** Уникальный идентификатор. Генерируется автоматически (cuid) */
  id: string;
  /** HTTP-метод: GET, POST, PATCH, PUT, DELETE */
  method: HttpMethod;
  /** Относительный путь без /api/v1 (например /members, /members/:id). Может содержать :param */
  path: string;
  /** Описание endpoint. Опциональное */
  description: string | null;
  /** Категория доступа */
  accessType: AccessType;
  /** Активен ли endpoint. false — недоступен всем, включая SUPER_ADMIN */
  isActive: boolean;
  /** Дата создания */
  createdAt: Date;
  /** Дата последнего обновления */
  updatedAt: Date;
}

/**
 * @type CreateApiEndpointInput
 * @domain roles
 * @description DTO для создания API endpoint
 */
export interface CreateApiEndpointInput {
  /** HTTP-метод */
  method: HttpMethod;
  /** Путь. Начинается с /, может содержать :param */
  path: string;
  /** Описание. Опциональное */
  description?: string;
  /** Категория доступа @default role */
  accessType?: AccessType;
  /** Активен ли endpoint @default true */
  isActive?: boolean;
}

/**
 * @type UpdateApiEndpointInput
 * @domain roles
 * @description DTO для обновления API endpoint
 */
export interface UpdateApiEndpointInput {
  /** Новый HTTP-метод */
  method?: HttpMethod;
  /** Новый путь */
  path?: string;
  /** Новое описание */
  description?: string;
  /** Новая категория доступа */
  accessType?: AccessType;
  /** Новое состояние активности */
  isActive?: boolean;
}

/**
 * @type UserRole
 * @domain roles
 * @description Связь M:N users↔roles
 *
 * @spec
 * - Составной PK (userId, roleId)
 * - Один пользователь может иметь несколько ролей
 *
 * @see docs/model/entities/user-role.md — концептуальная модель
 */
export interface UserRole {
  /** ID пользователя */
  userId: string;
  /** ID роли */
  roleId: string;
  /** Дата создания связи */
  createdAt: Date;
}

/**
 * @type RolePage
 * @domain roles
 * @description Связь M:N roles↔pages
 *
 * @spec
 * - Составной PK (roleId, pageId)
 * - Определяет доступ роли к странице
 *
 * @see docs/model/entities/role-page.md — концептуальная модель
 */
export interface RolePage {
  /** ID роли */
  roleId: string;
  /** ID страницы */
  pageId: string;
  /** Дата создания связи */
  createdAt: Date;
}

/**
 * @type RoleApiEndpoint
 * @domain roles
 * @description Связь M:N roles↔api_endpoints
 *
 * @spec
 * - Составной PK (roleId, apiEndpointId)
 * - Имеет значение только при access_type=role
 *
 * @see docs/model/entities/role-api-endpoint.md — концептуальная модель
 */
export interface RoleApiEndpoint {
  /** ID роли */
  roleId: string;
  /** ID API endpoint */
  apiEndpointId: string;
  /** Дата создания связи */
  createdAt: Date;
}

/** HTTP-методы, поддерживаемые реестром API endpoints */
export type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';

/** Категории доступа для страниц и API endpoints */
export type AccessType = 'public' | 'owner' | 'role' | 'super_admin';
