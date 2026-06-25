# API паттерны

> 📌 Контекстный сегмент. Полная версия: [`api-router-requirements.md`](../specs/components/api-routers/api-router-requirements.md)

---

## Структура API

```
src/app/api/
├── <resource>/route.ts          # GET (list), POST (create)
├── <resource>/[id]/route.ts    # GET (one), PUT (update), DELETE
├── <parent>/[parentId]/<child>/route.ts   # Вложенные ресурсы
└── _lib/
    ├── auth.ts                  # requireAuth(), requireAuthWithRole()
    ├── response.ts              # ApiResponse утилиты
    ├── validation.ts            # Общие Zod схемы
    └── error-handler.ts         # ApiErrorHandler
```

**Именование директорий:** lowercase через дефис (`resource-items/`)
**Handler функции:** по HTTP методу в UPPERCASE (`GET`, `POST`, `PUT`, `DELETE`)

---

## Формат ответов

### Успешный ответ

```typescript
interface SuccessResponse<T> {
  success: true
  data: T
  meta?: { pagination?: { page: number; limit: number; total: number; totalPages: number } }
}
```

### Ошибка

```typescript
interface ErrorResponse {
  success: false
  error: { code: string; message: string; details?: unknown }
}
```

### Стандартные коды ошибок

| Код | HTTP | Описание |
|-----|------|----------|
| `VALIDATION_ERROR` | 400 | Неверный запрос |
| `UNAUTHORIZED` | 401 | Требуется авторизация |
| `FORBIDDEN` | 403 | Доступ запрещён |
| `NOT_FOUND` | 404 | Ресурс не найден |
| `CONFLICT` | 409 | Ресурс уже существует |
| `INTERNAL_ERROR` | 500 | Внутренняя ошибка |

---

## ApiResponse утилита

```typescript
export class ApiResponse {
  static success<T>(data: T, status = 200, meta?)     // 200 OK
  static created<T>(data: T)                          // 201 Created
  static noContent()                                   // 204 No Content
  static badRequest(details?)                          // 400
  static unauthorized()                                // 401
  static forbidden(message?)                          // 403
  static notFound()                                    // 404
  static conflict(message?)                            // 409
  static internal(message?)                            // 500
  static handle(error: unknown)                        // Универсальная обработка
}
```

---

## Стандартный handler (GET с пагинацией)

```typescript
export async function GET(request: NextRequest) {
  try {
    await requireAuth()                                           // 1. Авторизация
    const parsed = getResourceQuerySchema.safeParse(              // 2. Валидация query
      Object.fromEntries(request.nextUrl.searchParams)
    )
    if (!parsed.success) return ApiResponse.badRequest(parsed.error.errors)

    const result = await resourceService.list(parsed.data)        // 3. Service вызов
    return ApiResponse.success(result.items, 200, {               // 4. Ответ
      pagination: { page: parsed.data.page, limit: parsed.data.limit, total: result.total },
    })
  } catch (error) {
    return ApiResponse.handle(error)                               // 5. Обработка ошибок
  }
}
```

## Стандартный handler (POST создание)

```typescript
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuthWithRole(['ADMIN'])             // 1. Авторизация + роль
    const body = await request.json()                              // 2. Парсинг тела
    const parsed = createResourceSchema.safeParse(body)           // 3. Zod валидация
    if (!parsed.success) return ApiResponse.badRequest(parsed.error.errors)

    const resource = await resourceService.create(parsed.data, user.id) // 4. Service вызов
    return ApiResponse.created({ resource })                       // 5. 201 Created
  } catch (error) {
    return ApiResponse.handle(error)
  }
}
```

---

## Пагинация

| Параметр | Тип | По умолчанию | Макс |
|----------|-----|--------------|------|
| `page` | number | 1 | — |
| `limit` | number | 20 | 100 |
| `sortBy` | string | `createdAt` | — |
| `sortOrder` | `'asc' \| 'desc'` | `desc` | — |

```typescript
export class PaginationHelper {
  static parse(params: URLSearchParams) {
    const page = parseInt(params.get('page') ?? '1') || 1
    const limit = Math.min(parseInt(params.get('limit') ?? '20') || 20, 100)
    return { page: Math.max(1, page), limit: Math.max(1, limit) }
  }
}
```

---

## Middleware (src/middleware.ts)

```typescript
const publicPaths = ['/api/auth/login', '/api/auth/register', '/api/auth/forgot-password']

export async function middleware(request: NextRequest) {
  if (publicPaths.some(path => pathname.startsWith(path))) return NextResponse.next()
  const token = request.cookies.get('session-token')?.value
  if (!token) return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED' } }, { status: 401 })
  return NextResponse.next()
}

export const config = { matcher: '/api/:path*' }
```

---

## Обработка ошибок ORM

```typescript
static handleDatabaseError(error: unknown) {
  switch (error.code) {
    case 'P2002': return ApiResponse.conflict('Ресурс уже существует')
    case 'P2025': return ApiResponse.notFound('Ресурс не найден')
    case 'P2003': return ApiResponse.badRequest('Неверный внешний ключ')
    default:      return ApiResponse.internal('Ошибка базы данных')
  }
}
```

---

## Чек-лист endpoint

- [ ] JSDoc документация
- [ ] Zod валидация входных данных
- [ ] Проверка аутентификации (`requireAuth`)
- [ ] Единый формат ответов (`ApiResponse`)
- [ ] try/catch с `ApiResponse.handle()`
- [ ] Нет бизнес-логики в handler
- [ ] Нет `any` в типах

---

📄 Полные требования: [`api-router-requirements.md`](../specs/components/api-routers/api-router-requirements.md)
📄 Спецификация endpoints: [`component-spec-requirements.md`](../specs/component-spec-requirements.md)