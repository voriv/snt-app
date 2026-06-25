# Требования к API Router компоненту

## Статус: На обсуждении

---

## Метаданные

```yaml
тип: specification
название: API Router Requirements
статус: на обсуждении
автор: Architect
дата-создания: 2026-06-24
дата-обновления: 2026-06-24
версия: 0.1.0
```

---

## 0. Общие положения

Настоящий документ определяет единые требования к созданию, именованию, структуре, декомпозиции, используемым библиотекам и самодокументированию **API Router компонентов** проекта `snt-app`.

API Router является частью Next.js API Routes и отвечает за обработку HTTP-запросов к API endpoints.

### 0.1 Связанные документы

| Документ | Назначение |
|----------|------------|
| [`.roo/rules/architecture.md`](../../../../.roo/rules/architecture.md) | Архитектурные правила, spec-driven development |
| [`.roo/rules/change-rules.md`](../../../../.roo/rules/change-rules.md) | Порядок внесения изменений |
| [`docs/specs/component-spec-requirements.md`](../../component-spec-requirements.md) | Требования к спецификациям компонентов |
| [`docs/specs/components/component-requirements.md`](../component-requirements.md) | Общие требования к компонентам проекта |
| [`architecture/structure/01-architecture.md`](../../../../architecture/structure/01-architecture.md) | Архитектура и технологические решения |

### 0.2 Принципы разработки

1. **Типобезопасность.** Все API handlers строго типизированы (TypeScript strict mode).
2. **Разделение ответственности.** API Router содержит только логику маршрутизации и валидации. Бизнес-логика — в сервисах.
3. **Единый формат ответа.** Все endpoints возвращают данные в стандартизированном формате.
4. **Авторизация и аутентификация.** Каждый endpoint явно указывает требования доступа.
5. **Самодокументирование.** Каждый endpoint описан JSDoc и metadata.
6. **Spec-Driven Development.** Перед созданием или изменением endpoint — создать спецификацию в `specs/api/`.

---

## 1. Архитектура API Router

### 1.1 Расположение файлов

Проект использует **Next.js API Routes** с директорией `src/app/api/`:

```
src/app/api/
├── <resource>/
│   ├── route.ts              # GET /api/<resource>, POST /api/<resource>
│   └── [id]/
│       └── route.ts          # GET /api/<resource>/:id, PUT /api/<resource>/:id, DELETE
├── <resource>/
│   ├── route.ts
│   └── [id]/
│       └── route.ts
└── _lib/
    ├── auth.ts               # Утилита авторизации
    ├── validation.ts         # Утилита валидации
    ├── error-handler.ts      # Утилита обработки ошибок
    └── response.ts           # Утилита формирования ответов
```

#### Вложенные ресурсы

Для вложенных ресурсов используется многоуровневая структура:

```
src/app/api/
├── <parent-resource>/
│   └── [parentId]/
│       └── <child-resource>/
│           ├── route.ts      # GET/POST /api/<parent>/<parentId>/<child>
│           └── [childId]/
│               └── route.ts  # GET/PUT/DELETE /api/<parent>/<parentId>/<child>/<childId>
```

### 1.2 Структура route файла

Каждый `route.ts` файл должен соблюдать следующую структуру:

```typescript
// ================================
// 1. Импорт зависимостей
// ================================
import { NextRequest } from 'next/server';
import { z } from 'zod';

// ================================
// 2. Типы и интерфейсы
// ================================
export type GetResourceResponse = {
  items: ResourceType[];
  pagination: PaginationMeta;
};

export type CreateResourceRequest = z.infer<typeof createResourceSchema>;
export type CreateResourceResponse = { resource: ResourceType };

// ================================
// 3. Схемы валидации
// ================================
const createResourceSchema = z.object({
  name: z.string().min(1).max(100),
  // ... другие поля
});

const getResourceQuerySchema = z.object({
  page: z.string().optional().default('1'),
  limit: z.string().optional().default('20'),
  search: z.string().optional(),
});

// ================================
// 4. Handlers
// ================================

/**
 * GET /api/<resource>
 * Получение списка ресурсов с пагинацией.
 *
 * @remarks
 * Требует аутентификации. Доступен для авторизованных пользователей.
 *
 * @public
 */
export async function GET(request: NextRequest) {
  try {
    // 4.1 Парсинг и валидация query параметров
    const searchParams = request.nextUrl.searchParams;
    const parsed = getResourceQuerySchema.safeParse({
      page: searchParams.get('page'),
      limit: searchParams.get('limit'),
      search: searchParams.get('search'),
    });

    if (!parsed.success) {
      return ErrorResponse.badRequest(parsed.error.errors);
    }

    // 4.2 Проверка авторизации
    const user = await requireAuth();
    
    // 4.3 Вызов сервиса (бизнес-логика)
    const result = await resourceService.getResource(parsed.data, user.id);

    // 4.4 Возврат успешного ответа
    return SuccessResponse.json({ data: result }, 200);
  } catch (error) {
    return ErrorResponse.internal(error);
  }
}

/**
 * POST /api/<resource>
 * Создание нового ресурса.
 *
 * @remarks
 * Требует аутентификации. Требуемая роль: ADMIN.
 *
 * @public
 */
export async function POST(request: NextRequest) {
  try {
    // 4.1 Парсинг тела запроса
    const body = await request.json();
    const parsed = createResourceSchema.safeParse(body);

    if (!parsed.success) {
      return ErrorResponse.badRequest(parsed.error.errors);
    }

    // 4.2 Проверка авторизации и роли
    const user = await requireAuthWithRole(['ADMIN']);

    // 4.3 Вызов сервиса
    const resource = await resourceService.createResource(parsed.data, user.id);

    // 4.4 Возврат созданного ресурса
    return SuccessResponse.json({ resource }, 201);
  } catch (error) {
    return ErrorResponse.internal(error);
  }
}
```

---

## 2. Именование

### 2.1 Именование директорий

Директории endpoints именуются в **lowercase** через дефис:

```
✅ Правильно:
src/app/api/resource-items/route.ts

❌ Неправильно:
src/app/api/ResourceItems/route.ts
src/app/api/resourceItems/route.ts
```

### 2.2 Именование файлов route

Файлы route всегда именуются `route.ts`:

```
src/app/api/
├── items/
│   ├── route.ts           # GET, POST
│   └── [id]/
│       └── route.ts       # GET, PUT, DELETE
```

### 2.3 Именование handler функций

Handler функции именуются по HTTP методу (upper case):

```typescript
export async function GET(request: NextRequest) { ... }
export async function POST(request: NextRequest) { ... }
export async function PUT(request: NextRequest) { ... }
export async function PATCH(request: NextRequest) { ... }
export async function DELETE(request: NextRequest) { ... }
```

---

## 3. Формат ответов

### 3.1 Единый формат успешных ответов

Все успешные ответы должны соответствовать структуре:

```typescript
interface SuccessResponse<T> {
  success: true;
  data: T;
  meta?: {
    pagination?: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}
```

### 3.2 Единый формат ошибок

Все ошибки должны соответствовать структуре:

```typescript
interface ErrorResponse {
  success: false;
  error: {
    code: string;        // Уникальный код ошибки
    message: string;     // Человекочитаемое сообщение
    details?: unknown;   // Детали ошибки (опционально)
  };
}
```

### 3.3 Утилиты для формирования ответов

Создать утилиту `src/app/api/_lib/response.ts`:

```typescript
import { NextResponse } from 'next/server';

export class ApiResponse {
  static success<T>(data: T, status = 200, meta?: Record<string, unknown>) {
    const body: SuccessResponse<T> = { success: true, data };
    if (meta) body.meta = meta;

    return NextResponse.json(body, { status });
  }

  static error(
    code: string,
    message: string,
    status: number,
    details?: unknown
  ) {
    const body: ErrorResponse = {
      success: false,
      error: { code, message, details },
    };

    return NextResponse.json(body, { status });
  }

  // Статические методы для стандартных статусов
  static created<T>(data: T) {
    return this.success(data, 201);
  }

  static noContent() {
    return new NextResponse(null, { status: 204 });
  }

  static badRequest(details?: unknown) {
    return this.error('VALIDATION_ERROR', 'Неверный запрос', 400, details);
  }

  static unauthorized() {
    return this.error('UNAUTHORIZED', 'Требуется авторизация', 401);
  }

  static forbidden(message = 'Доступ запрещён') {
    return this.error('FORBIDDEN', message, 403);
  }

  static notFound() {
    return this.error('NOT_FOUND', 'Ресурс не найден', 404);
  }

  static conflict(message = 'Ресурс уже существует') {
    return this.error('CONFLICT', message, 409);
  }

  static internal(message = 'Внутренняя ошибка сервера') {
    return this.error('INTERNAL_ERROR', message, 500);
  }
}
```

### 3.4 Примеры ответов

#### Успешный GET (200)

```json
{
  "success": true,
  "data": {
    "items": [
      { "id": "1", "name": "Item 1" }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 100,
      "totalPages": 5
    }
  }
}
```

#### Успешный POST (201)

```json
{
  "success": true,
  "data": {
    "resource": {
      "id": "1",
      "name": "Item 1"
    }
  }
}
```

#### Ошибка валидации (400)

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Неверный запрос",
    "details": [
      { "field": "name", "message": "Обязательное поле" }
    ]
  }
}
```

#### Ошибка авторизации (401)

```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Требуется авторизация"
  }
}
```

---

## 4. Валидация

### 4.1 Zod схемы для валидации

Все входные данные должны валидироваться через Zod:

```typescript
import { z } from 'zod';

// Схема создания ресурса
export const createResourceSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  // ... другие поля
});

// Схема обновления ресурса
export const updateResourceSchema = createResourceSchema.partial();

// Схема query параметров
export const getResourceQuerySchema = z.object({
  page: z.string().transform(Number).default('1').refine(val => val >= 1),
  limit: z.string().transform(Number).default('20').refine(val => val >= 1 && val <= 100),
  search: z.string().optional(),
  sortBy: z.enum(['name', 'createdAt']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});
```

### 4.2 Валидация параметров пути

```typescript
import { z } from 'zod';

export const resourceIdSchema = z.object({
  id: z.string().uuid(),
});
```

### 4.3 Обработка ошибок валидации

```typescript
const parsed = createResourceSchema.safeParse(body);

if (!parsed.success) {
  const details = parsed.error.errors.map(err => ({
    field: err.path.join('.'),
    message: err.message,
  }));
  return ApiResponse.badRequest(details);
}
```

---

## 5. Авторизация и аутентификация

### 5.1 Общий подход

Каждый endpoint должен явно указывать требования к аутентификации и авторизации:

1. **Публичные endpoints** — не требуют аутентификации
2. **Authenticated endpoints** — требуют подтверждённой сессии
3. **Role-based endpoints** — требуют определённой роли или права

### 5.2 Утилита авторизации

Создать утилиту `src/app/api/_lib/auth.ts`:

```typescript
export interface AuthenticatedUser {
  id: string;
  // ... другие поля пользователя
}

/**
 * Получение авторизованного пользователя.
 * @returns AuthenticatedUser или null
 */
export async function getAuthUser(): Promise<AuthenticatedUser | null> {
  // Реализация зависит от используемого auth-решения
}

/**
 * Проверка авторизации и возврат пользователя или ошибка 401.
 * @throws ApiResponse.unauthorized() если не авторизован
 */
export async function requireAuth(): Promise<AuthenticatedUser> {
  const user = await getAuthUser();
  
  if (!user) {
    throw ApiResponse.unauthorized();
  }

  return user;
}

/**
 * Проверка авторизации с требованием роли.
 * @param requiredRoles Массив допустимых ролей
 * @throws ApiResponse.unauthorized() если не авторизован
 * @throws ApiResponse.forbidden() если роль не достаточна
 */
export async function requireAuthWithRole(
  requiredRoles: string[]
): Promise<AuthenticatedUser> {
  const user = await requireAuth();
  
  // Проверка роли (реализация зависит от домена)
  if (!requiredRoles.includes(user.role)) {
    throw ApiResponse.forbidden('Недостаточно прав доступа');
  }

  return user;
}
```

### 5.3 Использование в endpoints

```typescript
// Публичный endpoint
export async function GET(request: NextRequest) {
  // Нет проверок
}

// Требуется аутентификация
export async function POST(request: NextRequest) {
  const user = await requireAuth();
  // ... логика
}

// Требуется аутентификация и роль
export async function DELETE(request: NextRequest) {
  const user = await requireAuthWithRole(['ADMIN', 'MODERATOR']);
  // ... логика
}
```

---

## 6. Обработка ошибок

### 6.1 Утилита обработки ошибок

Создать утилиту `src/app/api/_lib/error-handler.ts`:

```typescript
export class ApiErrorHandler {
  /**
   * Обработка ошибок ORM.
   */
  static handleDatabaseError(error: unknown) {
    // Обработка специфичных ошибок ORM (Prisma, TypeORM и т.д.)
    switch (error.code) {
      case 'P2002':
        return ApiResponse.conflict('Ресурс уже существует');
      case 'P2025':
        return ApiResponse.notFound('Ресурс не найден');
      case 'P2003':
        return ApiResponse.badRequest('Неверный внешний ключ');
      default:
        return ApiResponse.internal('Ошибка базы данных');
    }
  }

  /**
   * Обработка JSON parse ошибок.
   */
  static handleJsonParse(error: unknown) {
    return ApiResponse.badRequest('Неверный формат JSON');
  }

  /**
   * Универсальная обработка ошибок.
   */
  static handle(error: unknown) {
    if (error instanceof Response) {
      return error; // Уже API response
    }

    // Обработка специфичных ошибок
    if (error.code === 'P2002' || error.code === 'P2025') {
      return this.handleDatabaseError(error);
    }

    return ApiResponse.internal();
  }
}
```

### 6.2 Шаблон обработки ошибок в handler

```typescript
export async function GET(request: NextRequest) {
  try {
    // ... логика
    return ApiResponse.success(data);
  } catch (error) {
    return ApiErrorHandler.handle(error);
  }
}
```

---

## 7. Пагинация

### 7.1 Стандартные параметры пагинации

| Параметр | Тип | По умолчанию | Описание |
|----------|-----|--------------|----------|
| `page` | `number` | 1 | Номер страницы |
| `limit` | `number` | 20 | Количество записей на странице (макс. 100) |
| `sortBy` | `string` | `createdAt` | Поле сортировки |
| `sortOrder` | `'asc' \| 'desc'` | `desc` | Направление сортировки |

### 7.2 Формат ответа с пагинацией

```typescript
interface PaginatedResponse<T> {
  success: true;
  data: T[];
  meta: {
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}
```

### 7.3 Утилита пагинации

```typescript
export class PaginationHelper {
  static parse(queryParams: URLSearchParams) {
    const page = parseInt(queryParams.get('page') ?? '1') || 1;
    const limit = Math.min(
      parseInt(queryParams.get('limit') ?? '20') || 20,
      100
    );

    return { page: Math.max(1, page), limit: Math.max(1, limit) };
  }

  static calculateTotalPages(total: number, limit: number) {
    return Math.ceil(total / limit);
  }

  static offset(page: number, limit: number) {
    return (page - 1) * limit;
  }
}
```

---

## 8. Middleware

### 8.1 Аутентификация middleware

Создать `src/middleware.ts` для глобальной проверки аутентификации:

```typescript
import { NextRequest, NextResponse } from 'next/server';

// Пути, не требующие аутентификации
const publicPaths = [
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/forgot-password',
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Пропустить публичные пути
  if (publicPaths.some(path => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // Проверить токен
  const token = request.cookies.get('session-token')?.value;
  
  if (!token) {
    return NextResponse.json(
      { success: false, error: { code: 'UNAUTHORIZED', message: 'Требуется авторизация' } },
      { status: 401 }
    );
  }

  return NextResponse.next();
}

// Конфигурация matcher
export const config = {
  matcher: '/api/:path*',
};
```

---

## 9. Документирование API

### 9.1 JSDoc для endpoint handlers

Каждый handler должен иметь JSDoc:

```typescript
/**
 * GET /api/<resource>
 * Получение списка ресурсов с пагинацией.
 *
 * @remarks
 * Требует аутентификации. Доступно для авторизованных пользователей.
 *
 * @queryParam {number} [page=1] - Номер страницы
 * @queryParam {number} [limit=20] - Количество записей (макс. 100)
 * @queryParam {string} [sortBy=createdAt] - Поле сортировки
 * @queryParam {'asc' | 'desc'} [sortOrder=desc] - Направление сортировки
 *
 * @response {200} Paginated list of resources
 * @response {401} Unauthorized
 *
 * @public
 */
export async function GET(request: NextRequest) { ... }

/**
 * POST /api/<resource>
 * Создание нового ресурса.
 *
 * @remarks
 * Требует аутентификации. Требуемая роль: ADMIN.
 *
 * @body {string} name - Название ресурса (обязательно)
 * @body {number} value - Значение (обязательно)
 *
 * @response {201} Created resource
 * @response {400} Validation error
 * @response {401} Unauthorized
 * @response {403} Forbidden
 *
 * @public
 */
export async function POST(request: NextRequest) { ... }
```

### 9.2 Metadata в route файле

```typescript
/**
 * @apiGroup Resource
 * @auth required
 * @roles ADMIN, MEMBER
 */
```

---

## 10. Структура проекта API

### 10.1 Общие принципы построения endpoints

| Действие | Method | Path | Handler |
|----------|--------|------|---------|
| Список ресурсов | GET | `/api/<resource>` | `resource/route.ts` |
| Создание ресурса | POST | `/api/<resource>` | `resource/route.ts` |
| Получение ресурса | GET | `/api/<resource>/:id` | `resource/[id]/route.ts` |
| Обновление ресурса | PUT | `/api/<resource>/:id` | `resource/[id]/route.ts` |
| Удаление ресурса | DELETE | `/api/<resource>/:id` | `resource/[id]/route.ts` |
| Вложенные ресурсы | GET/POST | `/api/<parent>/<parentId>/<child>` | `<parent>/[parentId]/<child>/route.ts` |

---

## 11. Проверка качества (чек-лист)

Перед мержем каждого API endpoint проверить:

```markdown
- [ ] Endpoint имеет JSDoc документацию
- [ ] Входные данные валидируются через Zod схемы
- [ ] Проверка аутентификации реализована
- [ ] Проверка ролей реализована (если требуется)
- [ ] Используется единый формат ответов (ApiResponse)
- [ ] Обработка ошибок реализована через try/catch
- [ ] Ошибки ORM обрабатываются корректно
- [ ] Пагинация реализована для списков
- [ ] Ответы кэшируются (если применимо)
- [ ] Нет бизнес-логики в handler (только маршрутизация)
- [ ] Используется `NextRequest` типизация
- [ ] Нет `any` в типах
- [ ] Нет `console.log` в продакшен коде
- [ ] Endpoint протестирован (unit/integration тесты)
```

---

## 12. Библиотеки и зависимости

> ℹ️ **Полный справочник** разрешённых/запрещённых зависимостей — в [`shared/dependencies.md#4-api-router`](../../shared/dependencies.md#4-api-router)

---

## 13. Примеры

### 13.1 Краткий пример: GET /api/<resource>

```typescript
// src/app/api/<resource>/route.ts
import { NextRequest } from 'next/server';
import { ApiResponse } from '../_lib/response';
import { requireAuth } from '../_lib/auth';

const getResourceQuerySchema = z.object({
  page: z.string().transform(Number).default('1'),
  limit: z.string().transform(Number).default('20'),
  search: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    await requireAuth();                                           // 1. Авторизация
    const parsed = getResourceQuerySchema.safeParse(               // 2. Валидация query
      Object.fromEntries(request.nextUrl.searchParams)
    );
    if (!parsed.success) return ApiResponse.badRequest(parsed.error.errors);

    const result = await resourceService.getResources(parsed.data); // 3. Сервис
    return ApiResponse.success(result.items, 200, {                 // 4. Ответ с пагинацией
      pagination: { page: parsed.data.page, limit: parsed.data.limit, total: result.total },
    });
  } catch (error) {
    return ApiResponse.handle(error);                                // 5. Единая обработка ошибок
  }
}
```

### 13.2 Краткий пример: POST /api/<resource>

```typescript
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuthWithRole(['ADMIN']);              // 1. Авторизация + роль
    const body = await request.json();                              // 2. Парсинг тела
    const parsed = createResourceSchema.safeParse(body);           // 3. Zod валидация
    if (!parsed.success) return ApiResponse.badRequest(parsed.error.errors);

    const resource = await resourceService.createResource(parsed.data, user.id); // 4. Сервис
    return ApiResponse.created({ resource });                       // 5. 201 Created
  } catch (error) {
    return ApiResponse.handle(error);
  }
}
```

**Ключевые паттерны, проиллюстрированные примерами:**
1. **try/catch** с `ApiResponse.handle()` — единая обработка ошибок
2. **requireAuth() / requireAuthWithRole()** — авторизация первым шагом
3. **Zod safeParse** — валидация входных данных перед бизнес-логикой
4. **Service вызов** — бизнес-логика делегирована сервису
5. **ApiResponse утилиты** — стандартизированные ответы (success, created, badRequest)

---

## 14. История изменений

> ℹ️ Единый журнал изменений — в [`CHANGELOG.md`](../../CHANGELOG.md)
