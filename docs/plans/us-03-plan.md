# План реализации: US-03: Контроль доступа к функциям приложения на основе роли

> **Шаблон используется для декомпозиции User Story на технические задачи по слоям архитектуры.**  
> Шаблон создаётся на этапе PLAN (Спецификация) и передаётся в Code-режим для выполнения.  
> Статусы задач: `[TODO]` → `[IN PROGRESS]` → `[DONE]`

---

## 📋 Метаданные

| Параметр       | Значение                          |
| -------------- | --------------------------------- |
| **US-ID**      | `US-03`                           |
| **Название**   | Контроль доступа к функциям приложения на основе роли |
| **Версия плана** | `v2.0`                            |
| **Дата создания** | `2026-07-09`                   |
| **Статус**     | `[TODO]`                          |
| **Зависит от** | `US-01`, `US-02` |

---

## 📎 Ссылки

- **User Story:** [`docs/user-stories/US-03-контроль-доступа-к-функциям-приложения-на-основе-роли.md`](../user-stories/US-03-контроль-доступа-к-функциям-приложения-на-основе-роли.md)
- **Требования (REQ):** `docs/requirements/REQ-ROLES-001.md`
- **Модель данных:** `docs/model/entities/role.md`, `docs/model/entities/api-endpoint.md`

---

## 📦 Детальный список задач

| ID задачи | Статус | Описание |
|-----------|--------|----------|
| **US-03-T0-SPECS** | `[TODO]` | JSDoc спецификации |
| **US-03-T1-DB** | `[TODO]` | Проверить модель данных |
| **US-03-T2-TYPES** | `[TODO]` | Доменные типы |
| **US-03-T3-VALIDATORS** | `[TODO]` | Zod-схемы |
| **US-03-T4-ERRORS** | `[TODO]` | Доменные ошибки |
| **US-03-T5-REPO** | `[TODO]` | Repository |
| **US-03-T6-SERVICE** | `[TODO]` | Service (AccessService.canAccessApi) |
| **US-03-T7-API** | `[TODO]` | API withRoleGuard wrapper |
| **US-03-T8-PROFILE** | `[TODO]` | Patch /api/v1/profile (GET, PATCH, PUT, POST, DELETE) |
| **US-03-T9-THEME** | `[TODO]` | Patch /api/v1/profile/theme (PATCH) |
| **US-03-T10-PLOT-USERS-ID** | `[TODO]` | Patch /api/v1/plot-users/:id (GET, PATCH, DELETE) |
| **US-03-T11-PLOT-USERS-USERS** | `[TODO]` | Patch /api/v1/plot-users/users (GET) |
| **US-03-T12-ROLES-ID** | `[TODO]` | Patch /api/v1/roles/:id (GET, PATCH, DELETE) |
| **US-03-T13-ROLES-USERS** | `[TODO]` | Patch /api/v1/roles/:id/users (GET, POST, DELETE) |
| **US-03-T14-ROLES-PAGES** | `[TODO]` | Patch /api/v1/roles/:id/pages (GET, POST, DELETE) |
| **US-03-T15-ROLES-API-ENDPOINTS** | `[TODO]` | Patch /api/v1/roles/:id/api-endpoints (GET, POST, DELETE) |
| **US-03-T16-UI** | `[TODO]` | UI-компоненты (нет изменений) |
| **US-03-T17-PAGE** | `[TODO]` | Страницы (нет изменений) |

---

## 📝 Детальное описание задач

### US-03-T0-SPECS: JSDoc спецификации

**Целевое состояние:** Все API Route Handlers, сервисы и репозитории имеют полные JSDoc-аннотации.

**Чек-лист:**
- [ ] Все API Route Handlers имеют `@route`, `@auth`, `@response`, `@spec`
- [ ] Service методы имеют `@param`, `@returns`, `@throws`
- [ ] Интерфейсы репозиториев имеют `@interface`

---

### US-03-T1-DB: Проверить модель данных

**Целевое состояние:** Сущности `ApiEndpoint`, `RoleApiEndpoint`, `Role`, `UserRole`, `UserProfile` существуют и корректны.

**Чек-лист:**
- [ ] `ApiEndpoint` имеет поля: `id`, `path`, `method`, `access_type`, `isActive`
- [ ] `RoleApiEndpoint` имеет поля: `id`, `role_id`, `api_endpoint_id`
- [ ] Seed содержит системные роли: GUEST, MEMBER, ADMIN, SUPER_ADMIN

---

### US-03-T2-TYPES: Доменные типы

**Целевое состояние:** Типы `ApiEndpoint`, `RoleApiEndpoint`, `AccessOptions` определены.

**Чек-лист:**
- [ ] Тип `ApiEndpoint` имеет все обязательные поля
- [ ] Тип `AccessOptions` определяет `method`, `path`, `accessType`

---

### US-03-T3-VALIDATORS: Zod-схемы

**Целевое состояние:** Валидаторы корректны для API запросов.

**Чек-лист:**
- [ ] Нет специфичных валидаторов для US-03
- [ ] Существующие валидаторы совместимы с новой логикой

---

### US-03-T4-ERRORS: Доменные ошибки

**Целевое состояние:** Используется `ForbiddenError` для 403 с сообщениями на русском языке.

---

### US-03-T5-REPO: Repository

**Целевое состояние:** Методы `findRolesByEndpointId`, `findAll`, `findRolesByUserId` существуют и реализованы.

**Чек-лист:**
- [ ] `findRolesByEndpointId` существует в `IRoleApiEndpointRepository`
- [ ] `findAll` существует в `IApiEndpointRepository`
- [ ] `findRolesByUserId` существует в `IRoleRepository`

---

### US-03-T6-SERVICE: Service (AccessService.canAccessApi)

**Целевое состояние:** `AccessService.canAccessApi(userId, method, path)` и `resolveEndpoint(method, path)` реализованы корректно.

**Чек-лист:**
- [ ] `canAccessApi` проверяет `access_type`: `public`, `owner`, `super_admin`, `role`
- [ ] `resolveEndpoint` находит endpoint через `matchPath`
- [ ] `is_active=false` возвращает `false`
- [ ] SUPER_ADMIN имеет приоритет
- [ ] Обработка отсутствия endpoint — возвращает `false`

---

### US-03-T7-API: API withRoleGuard wrapper

**Целевое состояние:** Функция `withRoleGuard` оборачивает handler, вызывает `AccessService.canAccessApi`, возвращает 403 при отказе.

**Чек-лист:**
- [ ] Импортируется `auth()` и `AccessService`
- [ ] Возвращает 403 с сообщением "Доступ запрещён"

---

### US-03-T8-PROFILE: Patch /api/v1/profile

**Целевое состояние:** Все методы (`GET`, `PATCH`, `PUT`, `POST`, `DELETE`) обернуты через `withRoleGuard` с `accessType=owner`.

**Чек-лист:**
- [ ] `src/app/api/v1/profile/route.ts` обернуты все методы

**Пример:**
```typescript
import { withRoleGuard } from '@/app/api/v1/_shared/with-role-guard';
export const GET = withRoleGuard(handleGet, { method: 'GET', path: '/profile' });
export const PATCH = withRoleGuard(handlePatch, { method: 'PATCH', path: '/profile' });
export const PUT = withRoleGuard(handleUpdateProfile, { method: 'PUT', path: '/profile' });
export const POST = withRoleGuard(handlePost, { method: 'POST', path: '/profile' });
export const DELETE = withRoleGuard(handleDelete, { method: 'DELETE', path: '/profile' });
```

---

### US-03-T9-THEME: Patch /api/v1/profile/theme

**Целевое состояние:** `PATCH /profile/theme` обернут через `withRoleGuard` с `accessType=owner`.

**Чек-лист:**
- [ ] `src/app/api/v1/profile/theme/route.ts` обернут `PATCH`

**Пример:**
```typescript
export const PATCH = withRoleGuard(handlePatch, { method: 'PATCH', path: '/profile/theme' });
```

---

### US-03-T10-PLOT-USERS-ID: Patch /api/v1/plot-users/:id

**Целевое состояние:** `GET`, `PATCH`, `DELETE` обернуты через `withRoleGuard` с `accessType=role`.

**Чек-лист:**
- [ ] `src/app/api/v1/plot-users/[id]/route.ts` обернуты все методы

---

### US-03-T11-PLOT-USERS-USERS: Patch /api/v1/plot-users/users

**Целевое состояние:** `GET /plot-users/users` обернут через `withRoleGuard` с `accessType=owner`.

**Чек-лист:**
- [ ] `src/app/api/v1/plot-users/users/route.ts` обернут `GET`

---

### US-03-T12-ROLES-ID: Patch /api/v1/roles/:id

**Целевое состояние:** `GET`, `PATCH`, `DELETE` обернуты через `withRoleGuard` с `accessType=super_admin`.

**Чек-лист:**
- [ ] `src/app/api/v1/roles/[id]/route.ts` обернуты все методы

---

### US-03-T13-ROLES-USERS: Patch /api/v1/roles/:id/users

**Целевое состояние:** `GET`, `POST`, `DELETE` обернуты через `withRoleGuard` с `accessType=super_admin`.

**Чек-лист:**
- [ ] `src/app/api/v1/roles/[id]/users/route.ts` обернуты `GET`, `POST`
- [ ] `src/app/api/v1/roles/[id]/users/[userId]/route.ts` обернут `DELETE`

---

### US-03-T14-ROLES-PAGES: Patch /api/v1/roles/:id/pages

**Целевое состояние:** `GET`, `POST`, `DELETE` обернуты через `withRoleGuard` с `accessType=super_admin`.

**Чек-лист:**
- [ ] `src/app/api/v1/roles/[id]/pages/route.ts` обернуты `GET`, `POST`
- [ ] `src/app/api/v1/roles/[id]/pages/[pageId]/route.ts` обернут `DELETE`

---

### US-03-T15-ROLES-API-ENDPOINTS: Patch /api/v1/roles/:id/api-endpoints

**Целевое состояние:** `GET`, `POST`, `DELETE` обернуты через `withRoleGuard` с `accessType=super_admin`.

**Чек-лист:**
- [ ] `src/app/api/v1/roles/[id]/api-endpoints/route.ts` обернуты `GET`, `POST`
- [ ] `src/app/api/v1/roles/[id]/api-endpoints/[endpointId]/route.ts` обернут `DELETE`

---

### US-03-T16-UI: UI-компоненты

**Статус:** Нет изменений — защита на уровне API, UI только отображает сообщения об ошибках.

---

### US-03-T17-PAGE: Страницы

**Статус:** Нет изменений — защита на уровне API, страницы используют `apiClient` для запросов и отображают ошибки от сервера.

---

## ✅ Чек-лист валидации

- [ ] Все API endpoints защищены через `withRoleGuard`
- [ ] `AccessService.canAccessApi` реализован корректно
- [ ] SUPER_ADMIN имеет привилегированный доступ
- [ ] `is_active=false` endpoint'ы недоступны
- [ ] JSDoc аннотации полные и корректные
- [ ] Ошибки возвращают HTTP 403 с сообщением "Доступ запрещён"

---

## 📝 История изменений

| Дата | Автор | Действие |
|------|-------|----------|
| 2026-07-09 | Architect | Создание плана v1.0 |
| 2026-07-09 | Architect | Обновление плана v2.0 — детализация задач |
