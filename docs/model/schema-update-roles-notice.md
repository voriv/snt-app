# Обновление DBML схемы — Ролевая модель доступа (US-8)

> Данное уведомление описывает изменения концептуальной модели данных для User Story US-8 «Страница управления ролями и участниками». Фрагменты DBML и Prisma предназначены для реализации в Code mode. Файлы `docs/model/entities/*.md` уже обновлены.

---

## Сводка изменений

### Удаляется
- Enum `roles` (GUEST, MEMBER, ADMIN) — из DBML и Prisma
- Поле `users.role` — из таблицы `users` (заменяется на M:N связь через `user_roles`)

### Добавляются таблицы
- `roles` — настраиваемый реестр ролей
- `user_roles` — связь M:N users↔roles
- `pages` — реестр страниц приложения (управляется через UI; поле `access_type` добавлено в US-9)
- `role_pages` — связь M:N roles↔pages
- `api_endpoints` — реестр API endpoints с категориями доступа
- `role_api_endpoints` — связь M:N roles↔api_endpoints
- `access_config_version` — глобальная версия конфигурации доступа (добавлено в US-9, инвалидация сессий)

---

## Обновлённая таблица `users` (DBML)

```dbml
Table users {
  id           varchar       [pk, not null] // cuid()
  email        varchar       [unique, not null]
  name         varchar
  password     varchar       [not null]
  avatar       varchar
  created_at   timestamp     [default: now(), not null]
  updated_at   timestamp     [default: now(), not null]

  Notes:'''
    Primary key: id
    Unique constraint: email
    Роли пользователя — через таблицу user_roles (M:N)
    Поле role удалено — заменено на M:N связь с roles
    '''
}
```

## Новые таблицы (DBML)

```dbml
// ============================================
// Table: roles
// ============================================
Table roles {
  id           varchar       [pk, not null] // cuid()
  name         varchar       [unique, not null]
  description  varchar
  is_system    boolean       [default: false, not null]
  created_at   timestamp     [default: now(), not null]
  updated_at   timestamp     [default: now(), not null]

  Notes:'''
    Primary key: id
    Unique constraint: name
    is_system=true защищает роль от удаления и переименования
    Системные роли: SUPER_ADMIN, GUEST, MEMBER, ADMIN (создаются при миграции)
    '''
}

// ============================================
// Table: user_roles
// ============================================
Table user_roles {
  user_id      varchar       [not null, ref: > users]
  role_id      varchar       [not null, ref: > roles]
  created_at   timestamp     [default: now(), not null]

  Notes:'''
    Primary key: (user_id, role_id) — составной
    Foreign key: user_id -> users.id (CASCADE)
    Foreign key: role_id -> roles.id (CASCADE)
    Один пользователь может иметь несколько ролей
    '''
}

// ============================================
// Table: pages
// ============================================
Table pages {
  id           varchar       [pk, not null] // cuid()
  path         varchar       [unique, not null]
  title        varchar       [not null]
  group_name   varchar
  sort_order   integer       [default: 0, not null]
  access_type  varchar       [default: 'role', not null] // public, owner, role, super_admin — добавлено в US-9
  is_active    boolean       [default: true, not null]
  created_at   timestamp     [default: now(), not null]
  updated_at   timestamp     [default: now(), not null]

  Notes:'''
    Primary key: id
    Unique constraint: path
    path — URL-путь маршрута Next.js (например /dashboard/members)
    access_type (добавлено в US-9):
      public    — доступен без авторизации (/login, /register, /forbidden)
      owner     — auth() + проверка владельца ( /profile)
      role      — auth() + проверка role_pages (по умолчанию)
      super_admin — auth() + только SUPER_ADMIN (/dashboard/roles)
    Новая страница без записей в role_pages недоступна всем, кроме SUPER_ADMIN (только при access_type=role)
    '''
}

// ============================================
// Table: role_pages
// ============================================
Table role_pages {
  role_id      varchar       [not null, ref: > roles]
  page_id      varchar       [not null, ref: > pages]
  created_at   timestamp     [default: now(), not null]

  Notes:'''
    Primary key: (role_id, page_id) — составной
    Foreign key: role_id -> roles.id (CASCADE)
    Foreign key: page_id -> pages.id (CASCADE)
    SUPER_ADMIN имеет доступ ко всем активным страницам через runtime-правило
    '''
}

// ============================================
// Table: api_endpoints
// ============================================
Table api_endpoints {
  id           varchar       [pk, not null] // cuid()
  method       varchar       [not null]     // GET, POST, PATCH, PUT, DELETE
  path         varchar       [not null]     // относительный путь без /api/v1 (например /members, /members/:id)
  description  varchar
  access_type  varchar       [default: 'role', not null] // public, owner, role, super_admin
  is_active    boolean       [default: true, not null]
  created_at   timestamp     [default: now(), not null]
  updated_at   timestamp     [default: now(), not null]

  Notes:'''
    Primary key: id
    Unique constraint: (method, path) — комбинация метод+путь уникальна
    access_type:
      public    — доступен без авторизации (health, register, NextAuth)
      owner     — auth() + проверка владельца ресурса в handler
      role      — auth() + проверка role_api_endpoints
      super_admin — auth() + только SUPER_ADMIN
    is_active=false — endpoint недоступен всем, включая SUPER_ADMIN
    '''
}

// ============================================
// Table: role_api_endpoints
// ============================================
Table role_api_endpoints {
  role_id          varchar       [not null, ref: > roles]
  api_endpoint_id  varchar       [not null, ref: > api_endpoints]
  created_at       timestamp     [default: now(), not null]

  Notes:'''
    Primary key: (role_id, api_endpoint_id) — составной
    Foreign key: role_id -> roles.id (CASCADE)
    Foreign key: api_endpoint_id -> api_endpoints.id (CASCADE)
    Имеет значение только для endpoints с access_type=role
    SUPER_ADMIN имеет полный доступ через runtime-правило
    '''
}

// ============================================
// Table: access_config_version — добавлено в US-9
// ============================================
Table access_config_version {
  id           integer       [pk, not null] // всегда 1, однострочная таблица
  version      bigint        [default: 0, not null] // монотонно возрастает
  updated_at   timestamp     [default: now(), not null]

  Notes:'''
    Primary key: id (всегда 1, единственная запись)
    version — глобальная версия конфигурации доступа
    Инкрементируется при изменении: roles, user_roles, pages, role_pages, api_endpoints, role_api_endpoints, is_active
    Используется в jwt callback для инвалидации устаревших сессий
    Seed: { id: 1, version: 0, updated_at: now() }
    '''
}
}
```

## Удаляемый enum (DBML)

```dbml
// УДАЛЯЕТСЯ:
Enum roles {
  GUEST
  MEMBER
  ADMIN
}
```

## Обновлённые relationships (DBML)

```dbml
// Существующие:
Ref: members.user_id > users.id
Ref: user_profiles.user_id > users.id
Ref: agreements.member_id > members.id
Ref: agreements.plot_id > plots.id
Ref: payments.member_id > members.id
Ref: payments.plot_id > plots.id

// НОВЫЕ:
Ref: user_roles.user_id > users.id
Ref: user_roles.role_id > roles.id
Ref: role_pages.role_id > roles.id
Ref: role_pages.page_id > pages.id
Ref: role_api_endpoints.role_id > roles.id
Ref: role_api_endpoints.api_endpoint_id > api_endpoints.id
```

---

## Необходимые изменения в Prisma-схеме

В файл `prisma/schema.prisma` необходимо внести следующие изменения:

```prisma
// УДАЛИТЬ: enum Role { GUEST MEMBER ADMIN }

// ОБНОВИТЬ модель User — удалить поле role, добавить связь с user_roles
model User {
  id        String   @id @default(cuid())
  email     String   @unique @map("email")
  name      String?  @map("name")
  password  String   @map("password")
  avatar    String?  @map("avatar")
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")
  members   Member?
  profile   UserProfile?
  roles     UserRole[]          // НОВОЕ: M:N через join-таблицу
  // role Role @default(GUEST)  // УДАЛЕНО
}

// НОВАЯ модель
model Role {
  id          String     @id @default(cuid())
  name        String     @unique @map("name")
  description String?    @map("description")
  isSystem    Boolean    @default(false) @map("is_system")
  createdAt   DateTime   @default(now()) @map("created_at")
  updatedAt   DateTime   @updatedAt @map("updated_at")
  users       UserRole[]
  pages       RolePage[]
  apiEndpoints RoleApiEndpoint[]   // НОВОЕ: M:N с api_endpoints

  @@map("roles")
}

// НОВАЯ модель — join-таблица users↔roles
model UserRole {
  userId    String   @map("user_id")
  roleId    String   @map("role_id")
  createdAt DateTime @default(now()) @map("created_at")
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  role      Role     @relation(fields: [roleId], references: [id], onDelete: Cascade)

  @@id([userId, roleId])
  @@map("user_roles")
}

// НОВАЯ модель — реестр страниц
// accessType добавлен в US-9 для унификации механизма доступа страниц и API endpoints
model Page {
  id         String   @id @default(cuid())
  path       String   @unique @map("path")
  title      String   @map("title")
  groupName  String?  @map("group_name")
  sortOrder  Int      @default(0) @map("sort_order")
  accessType String   @default("role") @map("access_type") // public, owner, role, super_admin — US-9
  isActive   Boolean  @default(true) @map("is_active")
  createdAt  DateTime @default(now()) @map("created_at")
  updatedAt  DateTime @updatedAt @map("updated_at")
  roles      RolePage[]

  @@map("pages")
}

// НОВАЯ модель — join-таблица roles↔pages
model RolePage {
  roleId    String   @map("role_id")
  pageId    String   @map("page_id")
  createdAt DateTime @default(now()) @map("created_at")
  role      Role     @relation(fields: [roleId], references: [id], onDelete: Cascade)
  page      Page     @relation(fields: [pageId], references: [id], onDelete: Cascade)

  @@id([roleId, pageId])
  @@map("role_pages")
}

// НОВАЯ модель — реестр API endpoints
model ApiEndpoint {
  id          String   @id @default(cuid())
  method      String   @map("method")
  path        String   @map("path")
  description String?  @map("description")
  accessType  String   @default("role") @map("access_type")
  isActive    Boolean  @default(true) @map("is_active")
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")
  roles       RoleApiEndpoint[]

  @@unique([method, path])
  @@map("api_endpoints")
}

// НОВАЯ модель — join-таблица roles↔api_endpoints
model RoleApiEndpoint {
  roleId        String       @map("role_id")
  apiEndpointId String       @map("api_endpoint_id")
  createdAt     DateTime     @default(now()) @map("created_at")
  role          Role         @relation(fields: [roleId], references: [id], onDelete: Cascade)
  apiEndpoint   ApiEndpoint  @relation(fields: [apiEndpointId], references: [id], onDelete: Cascade)

  @@id([roleId, apiEndpointId])
  @@map("role_api_endpoints")
}

// НОВАЯ модель — глобальная версия конфигурации доступа (US-9)
// Однострочная таблица для инвалидации сессий при изменении прав
model AccessConfigVersion {
  id        Int      @id @default(1) // всегда 1
  version   BigInt   @default(0) @map("version")
  updatedAt DateTime @updatedAt @map("updated_at")

  @@map("access_config_version")
}
```

## Необходимые миграции

```bash
npx prisma migrate dev --name roles_rbac_model
```

## Seed данные (выполняется в рамках миграции/скрипта)

```typescript
// Псевдокод миграции данных — для реализации в Code mode
const SEED_ROLES = [
  { name: 'SUPER_ADMIN', description: 'Супер-администратор. Полный доступ ко всем страницам.', isSystem: true },
  { name: 'ADMIN',       description: 'Администратор. Настраиваемая роль.',                   isSystem: true },
  { name: 'MEMBER',       description: 'Член СНТ. Настраиваемая роль.',                        isSystem: true },
  { name: 'GUEST',        description: 'Гость. Настраиваемая роль.',                            isSystem: true },
];

// accessType добавлен в US-9 для унификации категорий доступа страниц и API endpoints
const SEED_PAGES = [
  // public — доступны без авторизации
  { path: '/login',            title: 'Вход',              groupName: 'Публичное',         sortOrder: 0,   accessType: 'public',    isActive: true },
  { path: '/register',         title: 'Регистрация',       groupName: 'Публичное',         sortOrder: 10,  accessType: 'public',    isActive: true },
  { path: '/forbidden',        title: 'Доступ запрещён',   groupName: 'Публичное',         sortOrder: 20,  accessType: 'public',    isActive: true },
  // role — доступ по ролям через role_pages
  { path: '/dashboard',         title: 'Дашборд',           groupName: 'Основное',         sortOrder: 0,   accessType: 'role',      isActive: true },
  { path: '/dashboard/members',  title: 'Члены СНТ',         groupName: 'Основное',         sortOrder: 10,  accessType: 'role',      isActive: true },
  { path: '/dashboard/plots',   title: 'Участки',           groupName: 'Основное',         sortOrder: 20,  accessType: 'role',      isActive: true },
  // owner — auth + владелец
  { path: '/dashboard/profile', title: 'Профиль',           groupName: 'Личное',           sortOrder: 100, accessType: 'owner',    isActive: true },
  // super_admin — только SUPER_ADMIN
  { path: '/dashboard/roles',   title: 'Управление ролями',  groupName: 'Администрирование', sortOrder: 200, accessType: 'super_admin', isActive: true },
];

// US-9: глобальная версия конфигурации доступа — для инвалидации сессий
const SEED_ACCESS_CONFIG_VERSION = [
  { id: 1, version: 0 }, // начальная запись, инкрементируется при изменении прав
];

const SEED_API_ENDPOINTS = [
  // public
  { method: 'GET',    path: '/',                       accessType: 'public',     description: 'Health check' },
  { method: 'POST',   path: '/auth/register',           accessType: 'public',     description: 'Регистрация нового пользователя' },
  { method: 'GET',    path: '/auth/[...nextauth]',       accessType: 'public',     description: 'NextAuth' },
  { method: 'POST',   path: '/auth/[...nextauth]',       accessType: 'public',     description: 'NextAuth' },
  // owner
  { method: 'GET',    path: '/profile',                 accessType: 'owner',      description: 'Профиль текущего пользователя' },
  { method: 'POST',   path: '/profile',                 accessType: 'owner',      description: 'Создание/обновление аватара профиля' },
  { method: 'DELETE', path: '/profile',                 accessType: 'owner',      description: 'Удаление аватара профиля' },
  { method: 'PATCH',  path: '/profile/theme',           accessType: 'owner',      description: 'Смена темы пользователя' },
  // role
  { method: 'GET',    path: '/members',                accessType: 'role',       description: 'Список членов СНТ' },
  { method: 'POST',   path: '/members',                accessType: 'role',       description: 'Создание члена СНТ' },
  { method: 'GET',    path: '/members/:id',            accessType: 'role',       description: 'Просмотр члена СНТ' },
  { method: 'PUT',    path: '/members/:id',            accessType: 'role',       description: 'Редактирование члена СНТ' },
  { method: 'DELETE', path: '/members/:id',            accessType: 'role',       description: 'Удаление члена СНТ' },
  { method: 'GET',    path: '/plots',                   accessType: 'role',       description: 'Список участков' },
  { method: 'POST',   path: '/plots',                   accessType: 'role',       description: 'Создание участка' },
  // super_admin
  { method: 'GET',    path: '/roles',                  accessType: 'super_admin', description: 'Список ролей' },
  { method: 'POST',   path: '/roles',                  accessType: 'super_admin', description: 'Создать роль' },
  { method: 'GET',    path: '/roles/:id',              accessType: 'super_admin', description: 'Получить роль' },
  { method: 'PATCH',  path: '/roles/:id',              accessType: 'super_admin', description: 'Обновить роль' },
  { method: 'DELETE', path: '/roles/:id',              accessType: 'super_admin', description: 'Удалить роль' },
  { method: 'GET',    path: '/roles/:id/users',        accessType: 'super_admin', description: 'Участники роли' },
  { method: 'POST',   path: '/roles/:id/users',        accessType: 'super_admin', description: 'Добавить участника' },
  { method: 'DELETE', path: '/roles/:id/users/:userId',accessType: 'super_admin', description: 'Исключить участника' },
  { method: 'GET',    path: '/roles/:id/pages',        accessType: 'super_admin', description: 'Страницы роли' },
  { method: 'POST',   path: '/roles/:id/pages',        accessType: 'super_admin', description: 'Назначить страницу' },
  { method: 'DELETE', path: '/roles/:id/pages/:pageId',accessType: 'super_admin', description: 'Снять страницу' },
  { method: 'GET',    path: '/roles/:id/api-endpoints',accessType: 'super_admin', description: 'API endpoints роли' },
  { method: 'POST',   path: '/roles/:id/api-endpoints',accessType: 'super_admin', description: 'Назначить API endpoint' },
  { method: 'DELETE', path: '/roles/:id/api-endpoints/:endpointId', accessType: 'super_admin', description: 'Снять API endpoint' },
  { method: 'GET',    path: '/pages',                  accessType: 'super_admin', description: 'Список страниц' },
  { method: 'POST',   path: '/pages',                  accessType: 'super_admin', description: 'Создать страницу' },
  { method: 'PATCH',  path: '/pages/:id',              accessType: 'super_admin', description: 'Обновить страницу' },
  { method: 'DELETE', path: '/pages/:id',              accessType: 'super_admin', description: 'Удалить страницу' },
  { method: 'GET',    path: '/api-endpoints',          accessType: 'super_admin', description: 'Список API endpoints' },
  { method: 'POST',   path: '/api-endpoints',          accessType: 'super_admin', description: 'Создать endpoint' },
  { method: 'PATCH',  path: '/api-endpoints/:id',      accessType: 'super_admin', description: 'Обновить endpoint' },
  { method: 'DELETE', path: '/api-endpoints/:id',      accessType: 'super_admin', description: 'Удалить endpoint' },
];

// Миграция существующих назначений:
// Для каждого пользователя с users.role = X создать запись user_roles(user, роль X)
// Затем удалить колонку role из таблицы users
```

## Архитектурные правила

1. **SUPER_ADMIN — runtime-правило**: полный доступ ко всем активным страницам и API endpoints (категорий `role`, `super_admin`) реализуется в коде проверки доступа, а НЕ через заполнение `role_pages`/`role_api_endpoints` всеми записями. Сервис проверки при наличии у пользователя роли `SUPER_ADMIN` возвращает `true` без обращения к этим таблицам.
2. **Новая страница/endpoint по умолчанию закрыты**: страница без записей в `role_pages` или endpoint с `access_type=role` без записей в `role_api_endpoints` недоступны всем, кроме `SUPER_ADMIN`.
3. **Категории доступа API**: `public` (без авторизации), `owner` (auth + проверка владельца в handler), `role` (auth + проверка role_api_endpoints), `super_admin` (auth + только SUPER_ADMIN). Записи в `role_api_endpoints` имеют значение только при `access_type=role`.
4. **Категории доступа страниц (US-9)**: аналогично API — `public` (без авторизации: `/login`, `/register`, `/forbidden`), `owner` (auth + владелец: `/profile`), `role` (auth + проверка role_pages), `super_admin` (auth + только SUPER_ADMIN: `/dashboard/roles`). Записи в `role_pages` имеют значение только при `access_type=role`.
5. **is_active=false**: неактивная страница или endpoint недоступны всем, включая SUPER_ADMIN.
6. **CASCADE на удаление**: удаление роли удаляет её `user_roles`, `role_pages`, `role_api_endpoints`; удаление страницы удаляет её `role_pages`; удаление endpoint удаляет его `role_api_endpoints`.
7. **Защита системных ролей**: при `is_system=true` сервис блокирует удаление и переименование роли.
8. **Защита последнего SUPER_ADMIN**: нельзя удалить роль `SUPER_ADMIN`, если это последняя такая роль хотя бы у одного пользователя.
9. **Сопоставление путей**: API path может содержать `:param` (например `/members/:id`), сопоставление с реальным запросом через path-matcher в коде.
10. **Инвалидация сессий (US-9)**: при любом изменении ролей/страниц/endpoints/связей инкрементируется `access_config_version.version`. JWT callback сравнивает `token.accessVersion` с текущим значением; при несовпадении — обновляет токен и перезагружает список доступных страниц.

## Связанные файлы

- [`docs/model/entities/role.md`](entities/role.md) — сущность Role
- [`docs/model/entities/page.md`](entities/page.md) — сущность Page
- [`docs/model/entities/api-endpoint.md`](entities/api-endpoint.md) — сущность ApiEndpoint
- [`docs/model/entities/user-role.md`](entities/user-role.md) — связь M:N users↔roles
- [`docs/model/entities/role-page.md`](entities/role-page.md) — связь M:N roles↔pages
- [`docs/model/entities/role-api-endpoint.md`](entities/role-api-endpoint.md) — связь M:N roles↔api_endpoints
- [`docs/model/entities/access-config-version.md`](entities/access-config-version.md) — глобальная версия конфигурации доступа (US-9)
- [`docs/model/entities/user.md`](entities/user.md) — обновлённая сущность User (без поля role)
- [`docs/user-stories/US-8-roles-management.md`](../user-stories/US-8-roles-management.md) — спецификация US-8
- [`docs/user-stories/US-9-page-access.md`](../user-stories/US-9-page-access.md) — спецификация US-9 (проверка доступа к страницам)
- [`docs/user-stories/US-8-roles-management.md`](../user-stories/US-8-roles-management.md) — User Story
