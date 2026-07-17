# 🌐 ПРАВИЛА РАЗРАБОТКИ API ROUTER

> **Версия:** v1.0  
> **Дата:** 2026-07-16  
> **Назначение:** Системный промпт — правила и контракты для API-слоя (Next.js Route Handlers)  
> **Связанные файлы:** [`PROJECT.md`](PROJECT.md), [`SPECS.md`](SPECS.md), [`CODE_REVIEW.md`](CODE_REVIEW.md), [`api-paths.md`](api-paths.md)  
> **Детальная инструкция:** [`api-router-prompt.md`](../prompt/api-router-prompt.md)

---

## 1. Философия

API Route Handler — это HTTP-слой приложения, который принимает запросы, делегирует бизнес-логику сервисам и возвращает стандартизированные JSON-ответы.

```
Client (apiClient) → Route Handler → Service → Repository → DB
    (fetch)          (auth + DI)     (logic)    (data)
```

### Принципы

| Принцип | Описание |
|---------|----------|
| **Толстый сервис, тонкий handler** | Handler содержит только HTTP-логику: auth, body parse, DI вызов, response format |
| **Стандартизированный ответ** | Всегда `{ success: boolean, data?: T, error?: { code, message } }` |
| **Централизованная обработка ошибок** | `errorResponse()` функция обрабатывает все типы ошибок в одном месте |
| **DI для сервисов** | Получение сервисов через `getContainer().getService()`, не прямой импорт |
| **RBAC через seed** | Каждый endpoint зарегистрирован в `SEED_API_ENDPOINTS` (`prisma/seed.ts`) |
| **JSDoc как спецификация** | `@route`, `@auth`, `@response` — единственные источники HTTP-контракта |

---

## 2. Стратегия: Создание vs Дополнение

Определи режим работы по состоянию файлов:

| Условие | Режим | Действие |
|---------|-------|----------|
| `route.ts` не существует | **Создание с нуля** | Создать handler + тесты + RBAC seed |
| `route.ts` существует | **Дополнение** | Добавить HTTP-методы в существующий файл |

### Определение домена

| Источник | Что извлекать |
|----------|---------------|
| План реализации (`docs/plans/us-XX-plan.md`) | ID задач, описание endpoint'ов |
| User Story (`docs/user-stories/US-XX-*.md`) | API-контракты, HTTP-статусы |
| `src/domains/<domain>/<domain>.service.ts` | Доступные методы сервиса |
| `src/domains/<domain>/<domain>.types.ts` | DTO-типы для body/response |
| `src/domains/<domain>/<domain>.errors.ts` | Доменные ошибки для `errorResponse()` |

> ⚠️ Если сервис не существует, а handler требует его — остановись и сообщи пользователю.

---

## 3. Route Handlers (`route.ts`)

### Обязательные JSDoc-теги

| Тег | Уровень | Обязательность |
|-----|---------|----------------|
| `@route` | Каждый handler | ✅ |
| `@auth` | Каждый handler | ✅ |
| `@description` | Каждый handler | ✅ |
| `@spec` | Каждый handler (если нетривиальный) | ✅ |
| `@body` | POST/PUT/PATCH | ✅ |
| `@response` | Каждый handler | ✅ |
| `@param` | Каждый handler (если есть params/query) | ✅ |

### Типы Route Handlers

| Тип | Файл | HTTP-методы | Пример |
|-----|------|-------------|--------|
| **Коллекция** | `resource/route.ts` | GET (list), POST (create) | `/api/v1/members` |
| **Элемент** | `resource/[id]/route.ts` | GET, PATCH, DELETE | `/api/v1/members/:id` |
| **Подресурс-коллекция** | `resource/[id]/children/route.ts` | GET, POST | `/api/v1/members/:id/plots` |
| **Подресурс-элемент** | `resource/[id]/children/[childId]/route.ts` | GET, PATCH, DELETE | `/api/v1/members/:id/plots/:plotId` |

### Паттерн Collection (Коллекция)

```typescript
// src/app/api/v1/resource/route.ts

/**
 * @route GET /api/v1/resource
 * @auth required
 * @description Возвращает список всех ресурсов
 *
 * @response 200 { success: true, data: Resource[] }
 * @response 500 { success: false, error: { code: string, message: string } }
 *
 * @spec
 * - Без пагинации в текущей реализации
 * - Возвращает все ресурсы
 */
export async function GET() {
  const session = await auth();
  if (!session) {
    return new NextResponse(
      JSON.stringify({ success: false, error: { code: 'UNAUTHORIZED', message: 'Требуется авторизация' } }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    const service = getContainer().getResourceService();
    const data = await service.findAll();
    return new NextResponse(
      JSON.stringify({ success: true, data }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return errorResponse(error);
  }
}

/**
 * @route POST /api/v1/resource
 * @auth required
 * @description Создаёт новый ресурс
 *
 * @body CreateResourceData
 * @response 201 { success: true, data: Resource }
 * @response 400 { success: false, error: { code: string, message: string } }
 * @response 409 { success: false, error: { code: string, message: string } }
 */
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session) {
    return new NextResponse(
      JSON.stringify({ success: false, error: { code: 'UNAUTHORIZED', message: 'Требуется авторизация' } }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    const body = await request.json();
    const service = getContainer().getResourceService();
    const data = await service.create(body, session.user.id);
    return new NextResponse(
      JSON.stringify({ success: true, data }),
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return errorResponse(error);
  }
}

/**
 * @function errorResponse
 * @description Централизованная обработка ошибок для route handler
 *
 * @param error - Ошибка, выброшенная сервисом
 * @returns NextResponse с соответствующим HTTP-статусом
 */
function errorResponse(error: unknown): NextResponse {
  if (error instanceof ResourceNotFoundError) {
    return new NextResponse(
      JSON.stringify({ success: false, error: { code: 'NOT_FOUND', message: error.message } }),
      { status: 404, headers: { 'Content-Type': 'application/json' } }
    );
  }
  if (error instanceof ResourceInvalidDataError) {
    return new NextResponse(
      JSON.stringify({ success: false, error: { code: 'VALIDATION_ERROR', message: error.message } }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }
  if (error instanceof ResourceDuplicateError) {
    return new NextResponse(
      JSON.stringify({ success: false, error: { code: 'CONFLICT', message: error.message } }),
      { status: 409, headers: { 'Content-Type': 'application/json' } }
    );
  }
  // Fallback
  return new NextResponse(
    JSON.stringify({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Внутренняя ошибка сервера' } }),
    { status: 500, headers: { 'Content-Type': 'application/json' } }
  );
}
```

### Паттерн Element (Элемент)

```typescript
// src/app/api/v1/resource/[id]/route.ts

/**
 * @route GET /api/v1/resource/:id
 * @auth required
 * @description Возвращает ресурс по идентификатору
 *
 * @response 200 { success: true, data: Resource }
 * @response 404 { success: false, error: { code: string, message: string } }
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) {
    return new NextResponse(
      JSON.stringify({ success: false, error: { code: 'UNAUTHORIZED', message: 'Требуется авторизация' } }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    const { id } = await params;
    const service = getContainer().getResourceService();
    const data = await service.findById(id);
    return new NextResponse(
      JSON.stringify({ success: true, data }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return errorResponse(error);
  }
}

/**
 * @route DELETE /api/v1/resource/:id
 * @auth required
 * @description Удаляет ресурс по идентификатору
 *
 * @response 200 { success: true, data: null }
 * @response 404 { success: false, error: { code: string, message: string } }
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // ... аналогичная структура
}
```

### Правила `errorResponse()`

| Правило | Описание |
|---------|----------|
| **Доменные ошибки → HTTP-статусы** | NotFoundError → 404, ValidationError → 400, ConflictError → 409, ForbiddenError → 403 |
| **Fallback на 500** | Все необработанные ошибки → 500 с общим сообщением |
| **Единая функция** | Одна `errorResponse()` на файл route.ts |
| **instanceof проверки** | Использовать `instanceof` для типов ошибок, не string-сравнение |
| **Russian messages** | Все сообщения об ошибках на русском языке |

### Чек-лист

- [ ] JSDoc заполнен для каждого handler-а (`@route`, `@auth`, `@response`)
- [ ] `auth()` проверка в каждом защищённом endpoint
- [ ] `errorResponse()` обрабатывает все доменные ошибки + fallback
- [ ] Валидация query/body параметров (делегирована сервису)
- [ ] Все HTTP-статусы соответствуют JSDoc `@response`
- [ ] Сервис вызывается через `getContainer().getService()`
- [ ] `params: Promise<{ id: string }>` для динамических роутов
- [ ] `npm run type-check` — 0 ошибок

---

## 4. RBAC SEEDING (`prisma/seed.ts`)

### Обязательность

**Каждый новый API endpoint должен быть зарегистрирован в `SEED_API_ENDPOINTS` массиве в `prisma/seed.ts`.**

Без этого `withRoleGuard()` не найдёт endpoint в реестре БД и вернёт 403 Forbidden.

### Формат записи

```typescript
{ method: 'GET', path: '/resource', accessType: 'role', description: 'Описание на русском' }
```

| Поле | Тип | Описание |
|------|-----|----------|
| `method` | `'GET' \| 'POST' \| 'PATCH' \| 'PUT' \| 'DELETE'` | HTTP-метод |
| `path` | `string` | Относительный путь (без `/api/v1`), например `/resource/:id` |
| `accessType` | `'public' \| 'role' \| 'owner' \| 'super_admin'` | Уровень доступа |
| `description` | `string` | Описание на русском языке |

### Определение `accessType`

| accessType | Описание | Пример |
|------------|----------|--------|
| `public` | Публичный endpoint (без авторизации) | Health check |
| `role` | Доступ по ролям (ADMIN, MEMBER и т.д.) | CRUD операций |
| `owner` | Доступ владельцу ресурса | Профиль пользователя |
| `super_admin` | Только SUPER_ADMIN | Системные настройки |

### Механизм работы

```
Seed (prisma/seed.ts)
  ↓ upsert by (method, path)
api_endpoints table
  ↓ AccessService.canAccessApi()
withRoleGuard(handler, { method, path })
  ↓ проверка session.user.role
HTTP response (200 or 403)
```

### Чек-лист

- [ ] Все новые endpoint'ы добавлены в `SEED_API_ENDPOINTS`
- [ ] `method` соответствует HTTP-методу handler-а
- [ ] `path` соответствует пути в `@route` JSDoc (без `/api/v1`)
- [ ] `accessType` соответствует уровню защиты
- [ ] `description` на русском языке
- [ ] Seed идемпотентный (upsert по `(method, path)`)

---

## 5. withRoleGuard (RBAC обёртка)

### Когда использовать

| Условие | Действие |
|---------|----------|
| Endpoint зарегистрирован в `api_endpoints` | Использовать `withRoleGuard(handler, { method, path })` |
| В User Story указано RBAC | Использовать `withRoleGuard()` |
| Простой endpoint без RBAC | Использовать `auth()` напрямую |

### Использование

```typescript
import { withRoleGuard } from '@/app/api/v1/_shared/with-role-guard';
import { getContainer } from '@/di/container';
import { NextRequest, NextResponse } from 'next/server';

// Handler-функция (не export)
async function handleGet(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const service = getContainer().getResourceService();
  const data = await service.findById(id);
  return NextResponse.json({ success: true, data });
}

// Export через withRoleGuard
export const GET = withRoleGuard(handleGet, { method: 'GET', path: '/resource/:id' });
```

### Как работает `withRoleGuard()`

1. `withRoleGuard()` принимает handler `(request, context) => Promise<NextResponse>` и `{ method, path }`
2. Внутри guard вызывается `auth()` для получения сессии
3. Если сессия отсутствует — возвращается 401
4. Endpoint ищется в БД через `AccessService.resolveEndpoint(method, path)`
5. Если `accessType === 'public'` — пропускается без auth
6. Если `accessType === 'owner'` — достаточно авторизации
7. Если `accessType === 'role'` или `'super_admin'` — проверяется `AccessService.canAccessApi()`
8. Если доступ запрещён — возвращается 403
9. Если доступ разрешён — вызывается inner handler с `(request, context)`

### Сигнатура `withRoleGuard`

```typescript
// src/app/api/v1/_shared/with-role-guard.ts
export function withRoleGuard<T = RouteContext>(
  handler: (request: NextRequest, context: T) => Promise<NextResponse>,
  options: RoleGuardOptions,
): (request: NextRequest, context: T) => Promise<NextResponse>
```

> **Критично:** Handler принимает `(request, context)`, НЕ `(session)`. Session извлекается внутри guard через `auth()`.

> **Референс:** [`src/app/api/v1/plots/route.ts`](../../src/app/api/v1/plots/route.ts), [`src/app/api/v1/_shared/with-role-guard.ts`](../../src/app/api/v1/_shared/with-role-guard.ts)

---

## 6. Unit-тесты (`tests/api/<resource>.test.ts`)

### Паттерн моков

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, POST } from '@/app/api/v1/<resource>/route';
import { NextRequest } from 'next/server';

// Моки
vi.mock('@/lib/auth', () => ({
  auth: vi.fn(),
}));

vi.mock('@/di/container', () => ({
  getContainer: vi.fn(() => ({
    getResourceService: vi.fn(() => mockService),
  })),
}));

const mockService = {
  findAll: vi.fn(),
  findById: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
};

function createRequest(url: string, options?: { method?: string; body?: unknown }) {
  return new NextRequest(new URL(url, 'http://localhost:3000'), {
    method: options?.method ?? 'GET',
    body: options?.body ? JSON.stringify(options.body) : undefined,
    headers: { 'content-type': 'application/json' },
  });
}

function createParams(id: string) {
  return { params: Promise.resolve({ id }) };
}
```

### Матрица обязательных тестов

| Handler | Happy Path | Edge Case | Ошибка |
|---------|-----------|-----------|--------|
| `GET list` | ✅ 200 с данными | ✅ Пустой массив | ✅ 401, ✅ 500 |
| `POST create` | ✅ 201 создан | ✅ Граничные значения | ✅ 400, ✅ 401, ✅ 409, ✅ 500 |
| `GET by id` | ✅ 200 с данными | — | ✅ 401, ✅ 404, ✅ 500 |
| `PATCH update` | ✅ 200 обновлён | ✅ Частичное обновление | ✅ 400, ✅ 401, ✅ 404, ✅ 500 |
| `DELETE` | ✅ 200 удалён | — | ✅ 401, ✅ 404, ✅ 500 |

### Чек-лист

- [ ] `vi.mock()` для `@/lib/auth` и `@/di/container`
- [ ] `describe` для каждого HTTP-метода
- [ ] `beforeEach` с `vi.clearAllMocks()`
- [ ] Happy path + edge case + error для каждого метода
- [ ] Assertions проверяют статус, `success`, `error.code`
- [ ] Assertions проверяют вызов сервиса с корректными аргументами
- [ ] `npm run test:unit -- tests/api/<resource>.test.ts` — все PASS

---

## 7. Строгие запреты

| # | Запрет | Обоснование |
|---|--------|-------------|
| 1 | ❌ `any` / `unknown` как обход | `strict: true` |
| 2 | ❌ Пропускать `type-check` после каждого шага | Раннее обнаружение |
| 3 | ❌ Бизнес-логика в Route Handler | Только вызов сервиса |
| 4 | ❌ Прямой импорт Prisma | Только через сервис |
| 5 | ❌ `fetch()` напрямую — только `apiClient` | Единый клиент (в компонентах) |
| 6 | ❌ Путь с `/api/v1` префиксом в `apiClient` | См. `api-paths.md` |
| 7 | ❌ Необработанные статусы ответов | Все коды в JSDoc `@response` |
| 8 | ❌ Дублировать обработку ошибок | Единая `errorResponse()` |
| 9 | ❌ Бросать `Error` напрямую | Использовать доменные ошибки в сервисе |
| 10 | ❌ Менять существующие методы без необходимости | Ghost fixes запрещены |
| 11 | ❌ Пропускать JSDoc | Spec-Driven Development |
| 12 | ❌ `export default` | Named exports только |
| 13 | ❌ Регистрировать endpoint без добавления в seed | RBAC не сработает |
| 14 | ❌ Забыть проверить `auth()` в защищённом endpoint | Безопасность |

---

## 8. Команды проверки

| Этап | Команда | Ожидаемый результат |
|------|---------|-------------------|
| После скелета | `npm run type-check` | 0 ошибок |
| После реализации | `npm run type-check` | 0 ошибок |
| После тестов | `npm run type-check` | 0 ошибок |
| После тестов | `npm run test:unit -- tests/api/` | Все PASS |
| Финальная верификация | `npm run type-check` + `npm run test:unit` | 0 ошибок + все PASS |

---

## 9. Связь с другими правилами

| Правило | Связь |
|---------|-------|
| [`PROJECT.md`](PROJECT.md) | §7.8 API Route Handlers, §2 Архитектурный паттерн |
| [`SPECS.md`](SPECS.md) | §5.5 API Route Handlers JSDoc-аннотации |
| [`CODE_REVIEW.md`](CODE_REVIEW.md) | Чек-лист проверки API Layer |
| [`api-paths.md`](api-paths.md) | Формирование путей в `apiClient` |
| [`api-router-prompt.md`](../prompt/api-router-prompt.md) | Пошаговая инструкция для выполнения |

---

## 10. Референсы

| Ресурс | Файл | Примечание |
|--------|------|-----------|
| Announcements Collection | [`announcements/route.ts`](../../src/app/api/v1/announcements/route.ts) | GET list + POST create |
| Announcement Element | [`announcements/[id]/route.ts`](../../src/app/api/v1/announcements/[id]/route.ts) | GET by id |
| Role Guard | [`_shared/with-role-guard.ts`](../../src/app/api/v1/_shared/with-role-guard.ts) | RBAC обёртка |
| API Client | [`lib/api-client.ts`](../../src/lib/api-client.ts) | Клиентский REST клиент |
| Base Error | [`shared/errors/`](../../src/shared/errors/) | Иерархия ошибок |
| DI Container | [`di/container.ts`](../../src/di/container.ts) | Зависимости |
| Seed | [`prisma/seed.ts`](../../prisma/seed.ts) | RBAC seeding endpoint'ов |

---

**Последнее обновление:** 2026-07-16
