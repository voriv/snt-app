# US-8: Спецификации компонентов управления ролями

> **Режим:** Architect → планирование. Реализация в Code mode.
> **User Story:** [`docs/user-stories/US-8-roles-management.md`](../docs/user-stories/US-8-roles-management.md)
> **Правила:** [`SPECS.md`](.roo/rules/SPECS.md), [`ARCHITECTURE.md`](.roo/rules/ARCHITECTURE.md), [`PROJECT.md`](.roo/rules/PROJECT.md), [`api-paths.md`](.roo/rules/api-paths.md), [`MODEL.md`](.roo/rules/MODEL.md)
> **Ограничение:** Только скелеты с `throw new Error('Not implemented')` + JSDoc/TSDoc. Только Client Components.

---

## 0. Структура нового домена `roles`

```
src/domains/roles/
├── index.ts                              # Публичный API домена (re-exports)
├── roles.types.ts                        # Типы: Role, Page, ApiEndpoint, UserRole, RolePage, RoleApiEndpoint + DTO
├── roles.repository.interface.ts         # IRoleRepository, IPageRepository, IRolePageRepository, IApiEndpointRepository, IRoleApiEndpointRepository
├── roles.repository.prisma.ts            # Реализации репозиториев через Prisma
├── roles.service.ts                      # RoleService, PageService, ApiEndpointService, RoleApiEndpointService
├── access.service.ts                     # AccessService — единый сервис проверки доступа
├── roles.validators.ts                   # Zod-схемы
├── roles.errors.ts                       # Доменные ошибки
src/shared/utils/path-matcher.ts          # matchPath(pattern, actual): boolean
src/app/api/v1/_shared/with-role-guard.ts # withRoleGuard(handler, options)
src/app/api/v1/roles/...                  # route handlers
src/app/api/v1/pages/...                  # route handlers
src/app/api/v1/api-endpoints/...          # route handlers
src/app/(dashboard)/roles/page.tsx        # RolesPage (Client Component)
src/components/features/roles/...         # Feature components
```

> Все файлы домена — в `src/domains/roles/` (единый домен «роли и доступ», т.к. Page и ApiEndpoint неотрывны от Role).

---

## 1. Repository компоненты

### 1.1 `src/domains/roles/roles.types.ts`

```typescript
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
 * @spec - isSystem всегда false при создании через API
 */
export interface CreateRoleInput {
  name: string;
  description?: string;
}

/**
 * @type UpdateRoleInput
 * @domain roles
 * @description DTO для обновления роли
 * @spec - name игнорируется для системных ролей (проверка в сервисе)
 */
export interface UpdateRoleInput {
  name?: string;
  description?: string;
}

/**
 * @type Page
 * @domain roles
 * @description Реестр страниц приложения
 * @spec
 * - Бизнес-ключ: path (unique)
 * - Новая страница без role_pages недоступна всем, кроме SUPER_ADMIN
 * - is_active=false блокирует доступ всем, включая SUPER_ADMIN
 *
 * @see docs/model/entities/page.md
 */
export interface Page {
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
  createdAt: Date;
  updatedAt: Date;
}

/**
 * @type CreatePageInput
 * @domain roles
 */
export interface CreatePageInput {
  path: string;
  title: string;
  groupName?: string;
  sortOrder?: number;
  isActive?: boolean;
}

/**
 * @type UpdatePageInput
 * @domain roles
 */
export interface UpdatePageInput {
  path?: string;
  title?: string;
  groupName?: string;
  sortOrder?: number;
  isActive?: boolean;
}

/**
 * @type ApiEndpoint
 * @domain roles
 * @description Реестр API endpoints с категориями доступа
 * @spec
 * - Уникальная комбинация (method, path)
 * - path может содержать :param (например /members/:id)
 * - access_type=public — без авторизации; owner — auth + владелец в handler;
 *   role — auth + role_api_endpoints; super_admin — auth + только SUPER_ADMIN
 * - is_active=false — недоступен всем, включая SUPER_ADMIN
 *
 * @see docs/model/entities/api-endpoint.md
 */
export interface ApiEndpoint {
  id: string;
  /** HTTP-метод: GET, POST, PATCH, PUT, DELETE */
  method: HttpMethod;
  /** Относительный путь без /api/v1 (например /members, /members/:id). Может содержать :param */
  path: string;
  description: string | null;
  /** Категория доступа */
  accessType: AccessType;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * @type CreateApiEndpointInput
 * @domain roles
 */
export interface CreateApiEndpointInput {
  method: HttpMethod;
  path: string;
  description?: string;
  accessType?: AccessType;
  isActive?: boolean;
}

/**
 * @type UpdateApiEndpointInput
 * @domain roles
 */
export interface UpdateApiEndpointInput {
  method?: HttpMethod;
  path?: string;
  description?: string;
  accessType?: AccessType;
  isActive?: boolean;
}

/**
 * @type UserRole
 * @domain roles
 * @description Связь M:N users↔roles
 * @see docs/model/entities/user-role.md
 */
export interface UserRole {
  userId: string;
  roleId: string;
  createdAt: Date;
}

/**
 * @type RolePage
 * @domain roles
 * @description Связь M:N roles↔pages
 * @see docs/model/entities/role-page.md
 */
export interface RolePage {
  roleId: string;
  pageId: string;
  createdAt: Date;
}

/**
 * @type RoleApiEndpoint
 * @domain roles
 * @description Связь M:N roles↔api_endpoints
 * @spec - Имеет значение только при access_type=role
 * @see docs/model/entities/role-api-endpoint.md
 */
export interface RoleApiEndpoint {
  roleId: string;
  apiEndpointId: string;
  createdAt: Date;
}

/** HTTP-методы, поддерживаемые реестром API endpoints */
export type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';

/** Категории доступа */
export type AccessType = 'public' | 'owner' | 'role' | 'super_admin';
```

### 1.2 `src/domains/roles/roles.errors.ts`

```typescript
/**
 * @file roles.errors.ts
 * @domain roles
 * @description Доменные ошибки управления ролями, страницами, API endpoints и доступом
 *
 * @see docs/user-stories/US-8-roles-management.md — секция «Обработка ошибок»
 */
import { NotFoundError, ConflictError, ForbiddenError, ValidationError } from '@/shared/errors/index';

/** Роль не найдена — HTTP 404 */
export class RoleNotFoundError extends NotFoundError {
  constructor(id: string) {
    super(id, id);
  }
}

/** Роль с таким именем уже существует — HTTP 409 */
export class RoleDuplicateError extends ConflictError {
  constructor(name: string) {
    super(`Роль с именем "${name}" уже существует`);
  }
}

/** Системную роль нельзя удалить или переименовать — HTTP 403 */
export class RoleSystemProtectedError extends ForbiddenError {
  constructor(roleName: string) {
    super(`Системную роль "${roleName}" нельзя удалить или переименовать`);
  }
}

/** Попытка удалить/исключить последнего SUPER_ADMIN — HTTP 409 */
export class LastSuperAdminError extends ConflictError {
  constructor(message: string = 'Нельзя удалить последнего SUPER_ADMIN') {
    super(message);
  }
}

/** Неверные данные роли — HTTP 400 */
export class RoleInvalidDataError extends ValidationError {
  constructor(message: string) {
    super(`Неверные данные роли: ${message}`);
  }
}

/** Страница не найдена — HTTP 404 */
export class PageNotFoundError extends NotFoundError {
  constructor(id: string) {
    super(id, id);
  }
}

/** Страница с таким путём уже существует — HTTP 409 */
export class PageDuplicateError extends ConflictError {
  constructor(path: string) {
    super(`Страница с путём "${path}" уже существует`);
  }
}

/** Неверные данные страницы — HTTP 400 */
export class PageInvalidDataError extends ValidationError {
  constructor(message: string) {
    super(`Неверные данные страницы: ${message}`);
  }
}

/** API endpoint не найден — HTTP 404 */
export class ApiEndpointNotFoundError extends NotFoundError {
  constructor(id: string) {
    super(id, id);
  }
}

/** Endpoint с такой комбинацией method+path уже существует — HTTP 409 */
export class ApiEndpointDuplicateError extends ConflictError {
  constructor(method: string, path: string) {
    super(`Endpoint ${method} ${path} уже существует`);
  }
}

/** Неверные данные API endpoint — HTTP 400 */
export class ApiEndpointInvalidDataError extends ValidationError {
  constructor(message: string) {
    super(`Неверные данные API endpoint: ${message}`);
  }
}
```

### 1.3 `src/domains/roles/roles.validators.ts`

```typescript
/**
 * @file roles.validators.ts
 * @domain roles
 * @description Zod-схемы валидации для ролей, страниц и API endpoints
 *
 * @see docs/user-stories/US-8-roles-management.md — BR-1..BR-29
 */
import { z } from 'zod';

export const createRoleSchema = z.object({
  name: z.string().min(2, 'Имя роли должно содержать минимум 2 символа').max(50, 'Имя роли не может превышать 50 символов'),
  description: z.string().max(500, 'Описание не может превышать 500 символов').optional().or(z.literal('')).transform(v => (v === '' ? null : v)),
});

export const updateRoleSchema = z.object({
  name: z.string().min(2, 'Имя роли должно содержать минимум 2 символа').max(50, 'Имя роли не может превышать 50 символов').optional(),
  description: z.string().max(500, 'Описание не может превышать 500 символов').optional().or(z.literal('')).transform(v => (v === '' ? null : v)),
});

export const createPageSchema = z.object({
  path: z.string().regex(/^\/[a-z0-9\-/]*$/i, 'Путь должен начинаться с / и содержать только буквы, цифры, дефисы и слэши'),
  title: z.string().min(2, 'Заголовок должен содержать минимум 2 символа').max(100, 'Заголовок не может превышать 100 символов'),
  groupName: z.string().max(100).optional().or(z.literal('')).transform(v => (v === '' ? null : v)),
  sortOrder: z.number().int().default(0),
  isActive: z.boolean().default(true),
});

export const updatePageSchema = z.object({
  path: z.string().regex(/^\/[a-z0-9\-/]*$/i, 'Путь должен начинаться с /').optional(),
  title: z.string().min(2, 'Заголовок должен содержать минимум 2 символа').max(100, 'Заголовок не может превышать 100 символов').optional(),
  groupName: z.string().max(100).optional().or(z.literal('')).transform(v => (v === '' ? null : v)),
  sortOrder: z.number().int().optional(),
  isActive: z.boolean().optional(),
});

export const createApiEndpointSchema = z.object({
  method: z.enum(['GET', 'POST', 'PATCH', 'PUT', 'DELETE'], { message: 'Метод должен быть одним из: GET, POST, PATCH, PUT, DELETE' }),
  path: z.string().regex(/^\/[a-z0-9\-/:]*$/i, 'Путь должен начинаться с /'),
  description: z.string().max(500).optional().or(z.literal('')).transform(v => (v === '' ? null : v)),
  accessType: z.enum(['public', 'owner', 'role', 'super_admin']).default('role'),
  isActive: z.boolean().default(true),
});

export const updateApiEndpointSchema = z.object({
  method: z.enum(['GET', 'POST', 'PATCH', 'PUT', 'DELETE']).optional(),
  path: z.string().regex(/^\/[a-z0-9\-/:]*$/i, 'Путь должен начинаться с /').optional(),
  description: z.string().max(500).optional().or(z.literal('')).transform(v => (v === '' ? null : v)),
  accessType: z.enum(['public', 'owner', 'role', 'super_admin']).optional(),
  isActive: z.boolean().optional(),
});

export type CreateRoleInput = z.infer<typeof createRoleSchema>;
export type UpdateRoleInput = z.infer<typeof updateRoleSchema>;
export type CreatePageInput = z.infer<typeof createPageSchema>;
export type UpdatePageInput = z.infer<typeof updatePageSchema>;
export type CreateApiEndpointInput = z.infer<typeof createApiEndpointSchema>;
export type UpdateApiEndpointInput = z.infer<typeof updateApiEndpointSchema>;
```

### 1.4 `src/domains/roles/roles.repository.interface.ts`

```typescript
/**
 * @file roles.repository.interface.ts
 * @domain roles
 * @description Контракты доступа к данным для ролей, страниц, API endpoints и связей
 *
 * @spec
 * - Все методы асинхронные
 * - findById/findBy* возвращают null если не найдено — НЕ бросают ошибку
 * - create/update могут выбросить Prisma P2002 при нарушении уникальности
 */
import type {
  Role, Page, ApiEndpoint, User,
  CreateRoleInput, UpdateRoleInput,
  CreatePageInput, UpdatePageInput,
  CreateApiEndpointInput, UpdateApiEndpointInput,
} from './roles.types';

/**
 * @interface IRoleRepository
 * @domain roles
 * @description Доступ к данным ролей и связям users↔roles
 */
export interface IRoleRepository {
  findAll(): Promise<Role[]>;
  findById(id: string): Promise<Role | null>;
  findByName(name: string): Promise<Role | null>;
  create(data: CreateRoleInput): Promise<Role>;
  update(id: string, data: UpdateRoleInput): Promise<Role>;
  delete(id: string): Promise<void>;
  findUsersByRoleId(roleId: string): Promise<User[]>;
  findRolesByUserId(userId: string): Promise<Role[]>;
  addUserToRole(userId: string, roleId: string): Promise<void>;
  removeUserFromRole(userId: string, roleId: string): Promise<void>;
  countSuperAdmins(): Promise<number>;
}

/**
 * @interface IPageRepository
 * @domain roles
 * @description Доступ к данным реестра страниц
 */
export interface IPageRepository {
  findAll(): Promise<Page[]>;
  findById(id: string): Promise<Page | null>;
  findByPath(path: string): Promise<Page | null>;
  create(data: CreatePageInput): Promise<Page>;
  update(id: string, data: UpdatePageInput): Promise<Page>;
  delete(id: string): Promise<void>;
}

/**
 * @interface IRolePageRepository
 * @domain roles
 * @description Доступ к данным связей roles↔pages
 */
export interface IRolePageRepository {
  findPagesByRoleId(roleId: string): Promise<Page[]>;
  findRolesByPageId(pageId: string): Promise<Role[]>;
  assignPageToRole(roleId: string, pageId: string): Promise<void>;
  unassignPageFromRole(roleId: string, pageId: string): Promise<void>;
  unassignAllPagesFromRole(roleId: string): Promise<void>;
}

/**
 * @interface IApiEndpointRepository
 * @domain roles
 * @description Доступ к данным реестра API endpoints
 */
export interface IApiEndpointRepository {
  findAll(): Promise<ApiEndpoint[]>;
  findById(id: string): Promise<ApiEndpoint | null>;
  findByMethodAndPath(method: string, path: string): Promise<ApiEndpoint | null>;
  create(data: CreateApiEndpointInput): Promise<ApiEndpoint>;
  update(id: string, data: UpdateApiEndpointInput): Promise<ApiEndpoint>;
  delete(id: string): Promise<void>;
}

/**
 * @interface IRoleApiEndpointRepository
 * @domain roles
 * @description Доступ к данным связей roles↔api_endpoints
 */
export interface IRoleApiEndpointRepository {
  findEndpointsByRoleId(roleId: string): Promise<ApiEndpoint[]>;
  findRolesByEndpointId(endpointId: string): Promise<Role[]>;
  assignEndpointToRole(roleId: string, endpointId: string): Promise<void>;
  unassignEndpointFromRole(roleId: string, endpointId: string): Promise<void>;
  unassignAllEndpointsFromRole(roleId: string): Promise<void>;
}
```

### 1.5 `src/domains/roles/roles.repository.prisma.ts`

Скелет — все методы `throw new Error('Not implemented')`:

```typescript
/**
 * @file roles.repository.prisma.ts
 * @domain roles
 * @description Реализация репозиториев через Prisma Client
 *
 * @spec
 * - Использует singleton Prisma Client из infrastructure/prisma/client.ts
 * - Маппит Prisma-модели (snake_case через @map) → доменные типы (camelCase)
 * - Prisma P2002 → доменные ошибки Duplicate преобразуются на уровне сервиса
 *
 * @see src/domains/roles/roles.repository.interface.ts
 */
import { prisma } from '@/infrastructure/prisma/client';
import type {
  IRoleRepository, IPageRepository, IRolePageRepository,
  IApiEndpointRepository, IRoleApiEndpointRepository,
} from './roles.repository.interface';
import type { Role, Page, ApiEndpoint, User } from './roles.types';

export class RoleRepository implements IRoleRepository {
  async findAll(): Promise<Role[]> { throw new Error('Not implemented'); }
  async findById(id: string): Promise<Role | null> { throw new Error('Not implemented'); }
  async findByName(name: string): Promise<Role | null> { throw new Error('Not implemented'); }
  async create(data: import('./roles.types').CreateRoleInput): Promise<Role> { throw new Error('Not implemented'); }
  async update(id: string, data: import('./roles.types').UpdateRoleInput): Promise<Role> { throw new Error('Not implemented'); }
  async delete(id: string): Promise<void> { throw new Error('Not implemented'); }
  async findUsersByRoleId(roleId: string): Promise<User[]> { throw new Error('Not implemented'); }
  async findRolesByUserId(userId: string): Promise<Role[]> { throw new Error('Not implemented'); }
  async addUserToRole(userId: string, roleId: string): Promise<void> { throw new Error('Not implemented'); }
  async removeUserFromRole(userId: string, roleId: string): Promise<void> { throw new Error('Not implemented'); }
  async countSuperAdmins(): Promise<number> { throw new Error('Not implemented'); }
}

export class PageRepository implements IPageRepository {
  async findAll(): Promise<Page[]> { throw new Error('Not implemented'); }
  async findById(id: string): Promise<Page | null> { throw new Error('Not implemented'); }
  async findByPath(path: string): Promise<Page | null> { throw new Error('Not implemented'); }
  async create(data: import('./roles.types').CreatePageInput): Promise<Page> { throw new Error('Not implemented'); }
  async update(id: string, data: import('./roles.types').UpdatePageInput): Promise<Page> { throw new Error('Not implemented'); }
  async delete(id: string): Promise<void> { throw new Error('Not implemented'); }
}

export class RolePageRepository implements IRolePageRepository {
  async findPagesByRoleId(roleId: string): Promise<Page[]> { throw new Error('Not implemented'); }
  async findRolesByPageId(pageId: string): Promise<Role[]> { throw new Error('Not implemented'); }
  async assignPageToRole(roleId: string, pageId: string): Promise<void> { throw new Error('Not implemented'); }
  async unassignPageFromRole(roleId: string, pageId: string): Promise<void> { throw new Error('Not implemented'); }
  async unassignAllPagesFromRole(roleId: string): Promise<void> { throw new Error('Not implemented'); }
}

export class ApiEndpointRepository implements IApiEndpointRepository {
  async findAll(): Promise<ApiEndpoint[]> { throw new Error('Not implemented'); }
  async findById(id: string): Promise<ApiEndpoint | null> { throw new Error('Not implemented'); }
  async findByMethodAndPath(method: string, path: string): Promise<ApiEndpoint | null> { throw new Error('Not implemented'); }
  async create(data: import('./roles.types').CreateApiEndpointInput): Promise<ApiEndpoint> { throw new Error('Not implemented'); }
  async update(id: string, data: import('./roles.types').UpdateApiEndpointInput): Promise<ApiEndpoint> { throw new Error('Not implemented'); }
  async delete(id: string): Promise<void> { throw new Error('Not implemented'); }
}

export class RoleApiEndpointRepository implements IRoleApiEndpointRepository {
  async findEndpointsByRoleId(roleId: string): Promise<ApiEndpoint[]> { throw new Error('Not implemented'); }
  async findRolesByEndpointId(endpointId: string): Promise<Role[]> { throw new Error('Not implemented'); }
  async assignEndpointToRole(roleId: string, endpointId: string): Promise<void> { throw new Error('Not implemented'); }
  async unassignEndpointFromRole(roleId: string, endpointId: string): Promise<void> { throw new Error('Not implemented'); }
  async unassignAllEndpointsFromRole(roleId: string): Promise<void> { throw new Error('Not implemented'); }
}
```

### 1.6 Изменение `src/domains/auth/auth.repository.interface.ts` и `auth.types.ts`

**Удалить** поле `role` из `UserData`, `CreateUserInput`, `UserWithPassword`. Роли теперь через `user_roles`.

```typescript
// auth.types.ts — ОБНОВИТЬ:
export interface UserData {
  id: string;
  email: string;
  name: string | null;
  // role: 'GUEST' | 'MEMBER' | 'ADMIN';  ← УДАЛЕНО
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserInput {
  email: string;
  passwordHash: string;
  name: null;
  // role: 'GUEST';  ← УДАЛЕНО
}
```

> ⚠️ Это каскадное изменение: `auth.repository.prisma.ts`, `auth.service.ts` (registerUser), `lib/auth.ts` (jwt/session callbacks — role убирается или вычисляется из user_roles) должны быть обновлены в Code mode.

---

## 2. Service компоненты

### 2.1 `src/domains/roles/roles.service.ts`

```typescript
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
 * - Зависимости: репозитории через DI
 *
 * @see docs/user-stories/US-8-roles-management.md — FR-2..FR-14
 */
import type {
  IRoleRepository, IPageRepository, IRolePageRepository,
  IApiEndpointRepository, IRoleApiEndpointRepository,
} from './roles.repository.interface';
import type { Role, Page, ApiEndpoint } from './roles.types';

/**
 * @service RoleService
 * @domain roles
 * @description Бизнес-логика CRUD ролей и управления участниками/страницами роли
 */
export class RoleService {
  constructor(
    private readonly roleRepo: IRoleRepository,
    private readonly rolePageRepo: IRolePageRepository,
  ) {}

  /** Найти все роли */
  async findAll(): Promise<Role[]> { throw new Error('Not implemented'); }

  /** Найти роль по ID. @throws {RoleNotFoundError} если не найдена */
  async findById(id: string): Promise<Role> { throw new Error('Not implemented'); }

  /** Создать роль. is_system=false. @throws {RoleDuplicateError} при дублировании имени */
  async create(data: unknown): Promise<Role> { throw new Error('Not implemented'); }

  /** Обновить роль. @throws {RoleSystemProtectedError} при попытке переименовать системную. @throws {RoleDuplicateError} */
  async update(id: string, data: unknown): Promise<Role> { throw new Error('Not implemented'); }

  /**
   * Удалить роль. Только несистемные.
   * @throws {RoleSystemProtectedError} если is_system=true
   * @throws {LastSuperAdminError} если это последний SUPER_ADMIN у пользователя
   * Каскадно удаляет user_roles и role_pages (через БД CASCADE)
   */
  async delete(id: string): Promise<void> { throw new Error('Not implemented'); }

  /** Получить участников роли */
  async getRoleUsers(roleId: string): Promise<import('@/domains/auth/auth.types').UserData[]> { throw new Error('Not implemented'); }

  /**
   * Добавить пользователя в роль.
   * @throws {LastSuperAdminError} если исключение последнего SUPER_ADMIN
   * Идемпотентно (составной PK)
   */
  async addUserToRole(roleId: string, userId: string): Promise<void> { throw new Error('Not implemented'); }

  /**
   * Исключить пользователя из роли.
   * @throws {LastSuperAdminError} если это последний SUPER_ADMIN и других SUPER_ADMIN нет
   * Идемпотентно
   */
  async removeUserFromRole(roleId: string, userId: string): Promise<void> { throw new Error('Not implemented'); }

  /** Получить страницы, назначенные роли */
  async getRolePages(roleId: string): Promise<Page[]> { throw new Error('Not implemented'); }

  /** Назначить страницу роли. Идемпотентно */
  async assignPageToRole(roleId: string, pageId: string): Promise<void> { throw new Error('Not implemented'); }

  /** Снять страницу с роли. Идемпотентно */
  async unassignPageFromRole(roleId: string, pageId: string): Promise<void> { throw new Error('Not implemented'); }
}

/**
 * @service PageService
 * @domain roles
 * @description Бизнес-логика CRUD реестра страниц
 */
export class PageService {
  constructor(private readonly pageRepo: IPageRepository) {}

  async findAll(): Promise<Page[]> { throw new Error('Not implemented'); }
  /** @throws {PageDuplicateError} при дублировании path */
  async create(data: unknown): Promise<Page> { throw new Error('Not implemented'); }
  /** @throws {PageNotFoundError} @throws {PageDuplicateError} */
  async update(id: string, data: unknown): Promise<Page> { throw new Error('Not implemented'); }
  /** @throws {PageNotFoundError}. Каскадно удаляет role_pages (БД CASCADE) */
  async delete(id: string): Promise<void> { throw new Error('Not implemented'); }
}

/**
 * @service ApiEndpointService
 * @domain roles
 * @description Бизнес-логика CRUD реестра API endpoints
 */
export class ApiEndpointService {
  constructor(private readonly endpointRepo: IApiEndpointRepository) {}

  async findAll(): Promise<ApiEndpoint[]> { throw new Error('Not implemented'); }
  async findById(id: string): Promise<ApiEndpoint> { throw new Error('Not implemented'); }
  async findByMethodAndPath(method: string, path: string): Promise<ApiEndpoint | null> { throw new Error('Not implemented'); }
  /** @throws {ApiEndpointDuplicateError} при дублировании (method, path) */
  async create(data: unknown): Promise<ApiEndpoint> { throw new Error('Not implemented'); }
  /** @throws {ApiEndpointNotFoundError} @throws {ApiEndpointDuplicateError} */
  async update(id: string, data: unknown): Promise<ApiEndpoint> { throw new Error('Not implemented'); }
  /** @throws {ApiEndpointNotFoundError}. Каскадно удаляет role_api_endpoints (БД CASCADE) */
  async delete(id: string): Promise<void> { throw new Error('Not implemented'); }
}

/**
 * @service RoleApiEndpointService
 * @domain roles
 * @description Управление назначениями API endpoints ролям
 */
export class RoleApiEndpointService {
  constructor(private readonly roleEndpointRepo: IRoleApiEndpointRepository) {}

  async getRoleEndpoints(roleId: string): Promise<ApiEndpoint[]> { throw new Error('Not implemented'); }
  async assignEndpointToRole(roleId: string, endpointId: string): Promise<void> { throw new Error('Not implemented'); }
  async unassignEndpointFromRole(roleId: string, endpointId: string): Promise<void> { throw new Error('Not implemented'); }
}
```

### 2.2 `src/domains/roles/access.service.ts`

```typescript
/**
 * @service AccessService
 * @domain roles
 * @description Единый сервис проверки доступа пользователей к страницам и API endpoints
 *
 * @spec
 * - Зависимости: IRoleRepository, IPageRepository, IRolePageRepository,
 *   IApiEndpointRepository, IRoleApiEndpointRepository через DI
 * - SUPER_ADMIN: при наличии роли SUPER_ADMIN → true (runtime-правило, без обращения к role_pages/role_api_endpoints)
 * - Неактивная страница/endpoint (is_active=false) → false для ВСЕХ, включая SUPER_ADMIN
 * - Сопоставление путей через matchPath(pattern, actual) из src/shared/utils/path-matcher.ts
 *
 * @see docs/user-stories/US-8-roles-management.md — FR-15, FR-16, BR-16..BR-29
 */
import type {
  IRoleRepository, IPageRepository, IRolePageRepository,
  IApiEndpointRepository, IRoleApiEndpointRepository,
} from './roles.repository.interface';

export class AccessService {
  constructor(
    private readonly roleRepo: IRoleRepository,
    private readonly pageRepo: IPageRepository,
    private readonly rolePageRepo: IRolePageRepository,
    private readonly endpointRepo: IApiEndpointRepository,
    private readonly roleEndpointRepo: IRoleApiEndpointRepository,
  ) {}

  /**
   * Проверить доступ пользователя к странице
   * @param userId - ID пользователя
   * @param path - Путь страницы (например /dashboard/members)
   * @returns true если доступ разрешён
   *
   * @spec
   * - Если страница is_active=false → false (для всех, включая SUPER_ADMIN)
   * - Если у пользователя есть роль SUPER_ADMIN → true (runtime-правило)
   * - Иначе проверка наличия записи в role_pages для любой роли пользователя
   * - Если страница не найдена → false
   */
  async canAccessPage(userId: string, path: string): Promise<boolean> { throw new Error('Not implemented'); }

  /**
   * Проверить доступ пользователя к API endpoint
   * @param userId - ID пользователя
   * @param method - HTTP-метод запроса
   * @param path - Путь запроса (например /members/abc123 — сопоставляется с шаблонами)
   * @returns true если доступ разрешён
   *
   * @spec
   * - Endpoint определяется через matchPath по реестру api_endpoints
   * - Если endpoint не найден или is_active=false → false (для всех, включая SUPER_ADMIN)
   * - access_type=public → true (без проверки авторизации — проверяется в withRoleGuard)
   * - access_type=owner → true при наличии сессии (владение проверяется в handler)
   * - access_type=super_admin → только SUPER_ADMIN
   * - access_type=role → SUPER_ADMIN → true; иначе проверка role_api_endpoints для любой роли пользователя
   */
  async canAccessApi(userId: string, method: string, path: string): Promise<boolean> { throw new Error('Not implemented'); }

  /**
   * Получить список страниц, доступных пользователю (для построения меню)
   * @param userId - ID пользователя
   * @returns Активные страницы, доступные пользователю
   *
   * @spec
   * - SUPER_ADMIN → все активные страницы
   * - Иначе: страницы с записью в role_pages для любой роли пользователя
   * - Неактивные страницы исключаются всегда
   */
  async getAccessiblePages(userId: string): Promise<import('./roles.types').Page[]> { throw new Error('Not implemented'); }
}
```

### 2.3 Изменение `src/domains/auth/auth.service.ts`

`registerUser` — удалить назначение роли GUEST. Пользователь создаётся без ролей.

```typescript
// Было:
return this.repository.create({ email, passwordHash, name: null, role: 'GUEST' });
// Стало:
return this.repository.create({ email, passwordHash, name: null });
```

> Назначение ролей новым пользователям (если нужно) — отдельная задача seed/миграции, не в registerUser.

### 2.4 `src/di/container.ts` — добавить фабрики

```typescript
// Новые фабрики:
export function createRoleService(): RoleService { throw new Error('Not implemented'); }
export function createPageService(): PageService { throw new Error('Not implemented'); }
export function createApiEndpointService(): ApiEndpointService { throw new Error('Not implemented'); }
export function createRoleApiEndpointService(): RoleApiEndpointService { throw new Error('Not implemented'); }
export function createAccessService(): AccessService { throw new Error('Not implemented'); }

// В Container добавить ленивые геттеры для каждого сервиса
```

---

## 3. Утилита path-matcher

### 3.1 `src/shared/utils/path-matcher.ts`

```typescript
/**
 * @function matchPath
 * @description Сопоставляет путь запроса с шаблоном, содержащим :param
 *
 * @param pattern - Шаблон с параметрами (например /members/:id)
 * @param actual - Реальный путь запроса (например /members/abc123)
 * @returns true если пути совпадают
 *
 * @spec
 * - :param соответствует любому одиночному сегменту ([\w-]+)
 * - Количество сегментов должно совпадать
 * - /members/:id соответствует /members/abc123, но НЕ /members/abc123/profile
 * - Регистрозависимое сопоставление
 *
 * @see docs/user-stories/US-8-roles-management.md — FR-16, BR-29
 */
export function matchPath(pattern: string, actual: string): boolean {
  throw new Error('Not implemented');
}
```

---

## 4. API Router компоненты

### 4.1 `src/app/api/v1/_shared/with-role-guard.ts`

```typescript
/**
 * @function withRoleGuard
 * @description Обёртка для API Route Handlers, проверяющая доступ через AccessService
 *
 * @param handler - Исходный route handler (GET/POST/PATCH/PUT/DELETE)
 * @param options - { method, path } — для поиска endpoint в реестре api_endpoints
 * @returns Защищённый route handler
 *
 * @spec
 * - Шаг 1: Найти endpoint в реестре по (method, path) через matchPath
 * - Если endpoint не найден или is_active=false → 403 Forbidden
 * - access_type=public → пропустить без проверки auth()
 * - access_type=owner → auth() обязателен; 401 если нет сессии; доступ=true (владение в handler)
 * - access_type=role → auth() + AccessService.canAccessApi(userId, method, path); 403 если нет прав
 * - access_type=super_admin → auth() + проверка роли SUPER_ADMIN; 403 если нет
 * - При отсутствии сессии на защищаемом endpoint → 401 Unauthorized
 * - При отсутствии прав → 403 Forbidden с сообщением «Недостаточно прав»
 *
 * @see docs/user-stories/US-8-roles-management.md — FR-15, FR-17
 */
import type { NextRequest, NextResponse } from 'next/server';

export interface RoleGuardOptions {
  method: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  path: string;
}

export function withRoleGuard<T>(
  handler: (request: NextRequest, context: T) => Promise<NextResponse>,
  options: RoleGuardOptions,
): (request: NextRequest, context: T) => Promise<NextResponse> {
  throw new Error('Not implemented');
}
```

### 4.2 Route Handlers — структура

```
src/app/api/v1/roles/
├── route.ts                          # GET (list), POST (create)
└── [id]/
    ├── route.ts                      # GET, PATCH, DELETE
    ├── users/route.ts                # GET (list users), POST (add user)
    ├── users/[userId]/route.ts       # DELETE (remove user)
    ├── pages/route.ts                # GET (list pages), POST (assign page)
    ├── pages/[pageId]/route.ts       # DELETE (unassign page)
    ├── api-endpoints/route.ts        # GET (list endpoints), POST (assign endpoint)
    └── api-endpoints/[endpointId]/route.ts  # DELETE (unassign endpoint)

src/app/api/v1/pages/
├── route.ts                          # GET, POST
└── [id]/route.ts                     # PATCH, DELETE

src/app/api/v1/api-endpoints/
├── route.ts                          # GET, POST
└── [id]/route.ts                     # PATCH, DELETE
```

### 4.3 Пример скелета `src/app/api/v1/roles/route.ts`

```typescript
/**
 * @route GET /api/v1/roles
 * @auth required
 * @role SUPER_ADMIN
 * @description Возвращает список всех ролей
 *
 * @response 200 { success: true, data: Role[] }
 * @response 401 { success: false, error: { code: 'UNAUTHORIZED', message: string } }
 * @response 403 { success: false, error: { code: 'FORBIDDEN', message: string } }
 *
 * @spec
 * - Доступ только для SUPER_ADMIN (через withRoleGuard)
 * - Возвращает все роли, включая системные
 */
export async function GET(): Promise<void> { throw new Error('Not implemented'); }

/**
 * @route POST /api/v1/roles
 * @auth required
 * @role SUPER_ADMIN
 * @description Создаёт новую роль
 *
 * @body CreateRoleInput { name: string, description?: string }
 * @response 201 { success: true, data: Role }
 * @response 400 { success: false, error: { code: 'VALIDATION_ERROR', message: string } }
 * @response 409 { success: false, error: { code: 'CONFLICT', message: string } }
 *
 * @spec
 * - is_system всегда false при создании через API
 * - При дублировании имени → 409 Conflict
 */
export async function POST(): Promise<void> { throw new Error('Not implemented'); }
```

> Аналогичные скелеты с JSDoc для всех остальных route handlers (см. матрицу API в US-8, строки 432-455).

### 4.4 Унификация auth() на существующих endpoints

Существующие handlers должны быть обёрнуты в `withRoleGuard`:
- `src/app/api/v1/members/route.ts` (GET, POST) — access_type=role (после seed)
- `src/app/api/v1/members/[id]/route.ts` (GET, PATCH, DELETE) — access_type=role
- `src/app/api/v1/plots/route.ts` (GET, POST) — access_type=role
- `src/app/api/v1/profile/route.ts` — access_type=owner
- `src/app/api/v1/profile/theme/route.ts` — access_type=owner
- `src/app/api/v1/auth/register/route.ts` — access_type=public

> Реализация обёртки существующих handlers — в Code mode.

---

## 5. UI компоненты (только Client Components)

> **Все** UI-компоненты помечаются `'use client'`. Server Components НЕ используются (см. PROJECT.md §2).

### 5.1 Страница `src/app/(dashboard)/roles/page.tsx`

```typescript
/**
 * @page /dashboard/roles
 * @auth required
 * @role SUPER_ADMIN
 * @description Страница управления ролями, страницами, API endpoints и участниками
 *
 * @spec
 * - Client Component с 'use client'
 * - Базовая проверка роли SUPER_ADMIN (полная защита в US-9)
 * - Четыре вкладки: «Роли», «Страницы», «API», «Участники»
 * - Загрузка данных через apiClient
 * - Состояния: loading, error, data
 * - EmptyState для пустых списков
 *
 * @data-flow
 * - useSession() → проверка SUPER_ADMIN
 * - apiClient.get('/roles') → RoleList
 * - apiClient.get('/pages') → PageList
 * - apiClient.get('/api-endpoints') → ApiEndpointList
 */
'use client';
export default function RolesPage(): JSX.Element { throw new Error('Not implemented'); }
```

### 5.2 Feature-компоненты `src/components/features/roles/`

Все — Client Components с `'use client'`.

| Файл | Компонент | Описание |
|------|-----------|----------|
| `RoleList.tsx` | RoleList | Таблица ролей: name, description, is_system, кол-во users/pages, действия |
| `RoleForm.tsx` | RoleForm | Форма создания/редактирования роли (name, description). name disabled для системных |
| `RoleUsersManager.tsx` | RoleUsersManager | Список участников роли + исключение + UserSearch |
| `RolePagesManager.tsx` | RolePagesManager | Чекбоксы всех страниц для назначения роли |
| `RoleApiEndpointsManager.tsx` | RoleApiEndpointsManager | Чекбоксы endpoints (только access_type=role) |
| `PageList.tsx` | PageList | Таблица реестра страниц: path, title, group, sort_order, is_active |
| `PageForm.tsx` | PageForm | Форма создания/редактирования страницы |
| `ApiEndpointList.tsx` | ApiEndpointList | Таблица endpoints: method, path, access_type (Badge), is_active |
| `ApiEndpointForm.tsx` | ApiEndpointForm | Форма создания/редактирования endpoint |
| `UserSearch.tsx` | UserSearch | Поиск пользователя по email/имени для добавления в роль |
| `index.ts` | — | Re-exports |

Пример скелета `RoleList.tsx`:

```typescript
/**
 * @component RoleList
 * @category features
 * @description Таблица ролей с действиями: редактировать, управлять страницами/API/участниками, удалить
 *
 * @spec
 * - Системные роли помечаются Badge
 * - Кнопка «Удалить» заблокирована для системных ролей (is_system=true)
 * - EmptyState если roles.length === 0
 * - Колонки: имя, описание, системная (значок), кол-во участников, кол-во страниц, действия
 * - Подтверждение удаления через ConfirmDialog со списком затронутых пользователей
 */
'use client';
export function RoleList(): JSX.Element { throw new Error('Not implemented'); }
```

> Все компоненты используют существующие UI-атомы: [`Button`](src/components/ui/Button/Button.tsx), [`Card`](src/components/ui/Card/Card.tsx), [`Badge`](src/components/ui/Badge/Badge.tsx), [`ConfirmDialog`](src/components/ui/ConfirmDialog/ConfirmDialog.tsx), [`Input`](src/components/ui/Input/Input.tsx). EmptyState — либо переиспользовать существующий inline-паттерн из [`MemberList`](src/components/features/members/MemberList.tsx), либо вынести в отдельный компонент `src/components/ui/EmptyState/` (рекомендуется по PROJECT.md §4).

---

## 6. Соответствие модели данных концептуальной модели

Проверка соответствия [`docs/model/schema-update-roles-notice.md`](docs/model/schema-update-roles-notice.md) и [`prisma/schema.prisma`](prisma/schema.prisma):

| Концептуальная модель (DBML) | Prisma | Доменный тип (TS) | Статус |
|------------------------------|--------|-------------------|--------|
| `roles` (id, name, description, is_system, created_at, updated_at) | model Role | `Role` | ✅ соответствует |
| `user_roles` (user_id, role_id, created_at) | model UserRole | `UserRole` | ✅ соответствует |
| `pages` (id, path, title, group_name, sort_order, access_type, is_active, ...) | model Page | `Page` | ✅ соответствует (access_type добавлен в US-9, но Prisma-поле создаётся в US-8) |
| `role_pages` (role_id, page_id, created_at) | model RolePage | `RolePage` | ✅ соответствует |
| `api_endpoints` (id, method, path, description, access_type, is_active, ...) | model ApiEndpoint | `ApiEndpoint` | ✅ соответствует |
| `role_api_endpoints` (role_id, api_endpoint_id, created_at) | model RoleApiEndpoint | `RoleApiEndpoint` | ✅ соответствует |
| `users.role` (enum) — УДАЛЕНО | поле `role` удалено | `UserData.role` удалено | ✅ соответствует |
| Enum `Role` — УДАЛЕНО | enum Role удалён | — | ✅ соответствует |

**Составной PK и CASCADE** (BR-12..BR-15, BR-26..BR-28):
- `user_roles`: `@@id([userId, roleId])`, `onDelete: Cascade` на обеих FK
- `role_pages`: `@@id([roleId, pageId])`, `onDelete: Cascade` на обеих FK
- `role_api_endpoints`: `@@id([roleId, apiEndpointId])`, `onDelete: Cascade` на обеих FK
- `api_endpoints`: `@@unique([method, path])` (BR-19)

> ⚠️ Миграция Prisma-схемы и seed — отдельная задача Code mode (Model layer, см. MODEL.md). В рамках US-8 спецификаций модель данных подтверждена как соответствующая концептуальной.

---

## 7. Чек-лист валидации компонентов против User Story

| FR/AC | Компонент | Статус |
|-------|-----------|--------|
| FR-1 / AC-1: Страница /dashboard/roles, 4 вкладки | RolesPage | ✅ спроектирована |
| FR-2: Список ролей | RoleList | ✅ |
| FR-3 / AC-2,3: Создание роли, дублирование | RoleForm + RoleService.create | ✅ |
| FR-4 / AC-4: Редактирование, name disabled для системных | RoleForm + RoleService.update | ✅ |
| FR-5 / AC-5,6: Удаление с подтверждением, запрет системных | RoleList + ConfirmDialog + RoleService.delete | ✅ |
| FR-6 / AC-7: Назначение страниц роли | RolePagesManager | ✅ |
| FR-7 / AC-8,9,13,14: CRUD страниц, валидация path | PageForm + PageService | ✅ |
| FR-8 / AC-10,11: Управление участниками | RoleUsersManager + UserSearch + RoleService.addUser/removeUser | ✅ |
| FR-9: Защита системных ролей | RoleService + RoleSystemProtectedError | ✅ |
| FR-10 / AC-12: Защита последнего SUPER_ADMIN | RoleService + LastSuperAdminError + countSuperAdmins | ✅ |
| FR-11: Блокировка повторной отправки | Button isLoading во всех формах | ✅ |
| FR-12 / AC-16: EmptyState | EmptyState в RoleList/PageList/ApiEndpointList | ✅ |
| FR-13 / AC-17,18: CRUD API endpoints | ApiEndpointForm + ApiEndpointService | ✅ |
| FR-14 / AC-19: Назначение endpoints роли | RoleApiEndpointsManager | ✅ |
| FR-15 / AC-20,21: Защита через AccessService + withRoleGuard | AccessService + withRoleGuard | ✅ |
| FR-16 / AC-22: path-matcher | matchPath | ✅ |
| FR-17: Унификация auth() | withRoleGuard обёртывает все handlers | ✅ |

**Проверка Server Components:** все страницы и feature-компоненты помечены `'use client'`. Server Components не используются (соответствует PROJECT.md §2).

---

## 8. Порядок реализации в Code mode

1. **Model layer** (MODEL.md): обновить [`prisma/schema.prisma`](prisma/schema.prisma) согласно [`docs/model/schema-update-roles-notice.md`](docs/model/schema-update-roles-notice.md), создать миграцию, seed.
2. **Domain layer**: создать домен `src/domains/roles/` (типы, ошибки, валидаторы, интерфейсы, реализации-скелеты).
3. **auth domain**: удалить поле `role` из типов, репозитория, сервиса; обновить `lib/auth.ts`.
4. **Service layer**: создать сервисы (скелеты), `AccessService`, `matchPath`.
5. **DI**: обновить [`container.ts`](src/di/container.ts).
6. **API layer**: создать `withRoleGuard`, route handlers (скелеты), обернуть существующие.
7. **UI layer**: создать страницу `roles/page.tsx` и feature-компоненты (все Client).
8. **Verify**: `npm run type-check`, `npm run lint`, `npm run dev`, проверить страницы.
