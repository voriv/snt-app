# Middleware: {{middleware-name}}

## Статус: {{статус}}

## 1. Описание

### 1.1 Назначение

{{Краткое описание назначения Middleware. Какие задачи решает и какие запросы обрабатывает.}}

### 1.2 Границы ответственности

{{Описание границ ответственности Middleware. Что входит и что НЕ входит в ответственность.}}

| Входит | НЕ входит |
|--------|-----------|
| {{Operation 1}} | {{External concern 1}} |
| {{Operation 2}} | {{External concern 2}} |

### 1.3 Связанные компоненты

| Компонент | Тип | Ссылка |
|-----------|-----|--------|
| {{component-name}} | {{component-type}} | [Ссылка](../path/to/component.md) |

---

## 2. Конфигурация

### 2.1 Маршруты

#### Маршруты, требующие обработки

| Маршрут | Метод | Описание |
|---------|-------|----------|
| {{path}} | {{method}} | {{description}} |

#### Исключенные маршруты (не обрабатываются)

| Маршрут | Причина |
|---------|---------|
| {{path}} | {{reason}} |

### 2.2 Configuration

```typescript
import { NextRequest, NextResponse } from 'next/server';
import type { NextMiddleware } from 'next/server';

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api|_next/static|_next/image|favicon.ico|public|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
```

---

## 3. Логика работы

### 3.1 Алгоритм обработки

{{Описание пошагового алгоритма обработки запроса.}}

| Шаг | Описание | Условие перехода |
|-----|----------|------------------|
| 1 | {{step-1}} | {{condition}} |
| 2 | {{step-2}} | {{condition}} |
| 3 | {{step-3}} | {{condition}} |

### 3.2 Основная реализация

```typescript
import { NextRequest, NextResponse } from 'next/server';

export async function middleware(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl;

  // 1. Проверка маршрутов
  if (isExcludedPath(pathname)) {
    return NextResponse.next();
  }

  // 2. Аутентификация
  const token = request.cookies.get('token')?.value;
  if (!token && isAuthenticatedPath(pathname)) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // 3. Авторизация
  if (isAuthorizedPath(pathname) && token) {
    try {
      const user = await verifyToken(token);
      if (!hasPermission(user, pathname)) {
        return NextResponse.json(
          { error: 'Доступ запрещён' },
          { status: 403 }
        );
      }
    } catch {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  // 4. Добавление заголовков
  const response = NextResponse.next();
  response.headers.set('x-request-id', generateId());

  return response;
}
```

### 3.3 Утилиты

```typescript
function isExcludedPath(pathname: string): boolean {
  const excludedPaths = ['/api/', '/_next/', '/favicon.ico', '/public/'];
  return excludedPaths.some(path => pathname.startsWith(path));
}

function isAuthenticatedPath(pathname: string): boolean {
  return ['/dashboard', '/profile'].includes(pathname);
}

function isAuthorizedPath(pathname: string): boolean {
  return ['/admin'].includes(pathname);
}
```

---

## 4. Проверка аутентификации

### 4.1 Получение токена

| Источник | Метод | Описание |
|----------|-------|----------|
| Cookie | `request.cookies.get('token')` | JWT токен из cookies |
| Header | `request.headers.get('authorization')` | Bearer токен из headers |

### 4.2 Валидация токена

```typescript
async function verifyToken(token: string): Promise<User | null> {
  try {
    const decoded = await jwt.verify(token, process.env.JWT_SECRET!);
    return decoded as User;
  } catch {
    return null;
  }
}
```

---

## 5. Обработка ошибок

### 5.1 Типы ошибок

| Ошибка | Код | HTTP статус | Когда выбрасывается |
|--------|-----|-------------|---------------------|
| UnauthorizedError | UNAUTHORIZED | 401 | Нет токена / невалидный токен |
| ForbiddenError | FORBIDDEN | 403 | Недостаточно прав |
| InternalError | INTERNAL_ERROR | 500 | Внутренняя ошибка |

### 5.2 Обработка исключений

```typescript
export async function middleware(request: NextRequest): Promise<NextResponse> {
  try {
    // Основная логика...
  } catch (error) {
    console.error('Middleware error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Внутренняя ошибка middleware',
        },
      },
      { status: 500 }
    );
  }
}
```

---

## 6. Производительность

### 6.1 Оптимизация

| Оптимизация | Описание |
|-------------|----------|
| Кэширование токена | Использовать memoization для проверки токена |
| Минимум I/O | Избегать синхронных операций в middleware |
| Быстрый выход | Проверяйте исключения как можно раньше |

### 6.2 Время выполнения

| Метрика | Целевое значение |
|---------|------------------|
| Время выполнения | < 50ms |
| Потребление памяти | < 5MB |

---

## 7. Тестирование

### 7.1 Unit тесты

| Тест | Сценарий | Ожидаемый результат |
|------|----------|---------------------|
| {{test-name}} | {{scenario}} | {{expected}} |

### 7.2 Integration тесты

| Тест | Сценарий | Ожидаемый результат |
|------|----------|---------------------|
| {{test-name}} | {{scenario}} | {{expected}} |

---

## 8. Структура файлов

| Файл | Назначение |
|------|------------|
| `src/middleware.ts` | Основной файл Middleware |
| `src/middleware/utils.ts` | Вспомогательные функции |
| `src/middleware/auth.ts` | Логика аутентификации |
| `src/middleware/__tests__/middleware.test.ts` | Тесты |

---

## 9. Зависимости

### 9.1 Внутренние зависимости

| Зависимость | Тип | Назначение |
|-------------|-----|------------|
| {{dependency}} | {{type}} | {{purpose}} |

### 9.2 Внешние зависимости

| Пакет | Версия | Назначение | Согласовано |
|-------|--------|------------|-------------|
| {{package}} | {{version}} | {{purpose}} | {{yes/no}} |

---

## 10. Чек-лист качества

- [ ] Middleware правильно конфигурирует маршруты (config.matcher)
- [ ] Исключены статические файлы и API маршруты из обработки
- [ ] Реализована проверка аутентификации
- [ ] Реализована проверка авторизации (ролевой доступ)
- [ ] Используется try/catch для обработки ошибок
- [ ] Нет синхронных I/O операций
- [ ] Добавлены необходимые заголовки ответа
- [ ] Написаны unit и integration тесты
- [ ] Время выполнения < 50ms

---

## 11. История изменений

| Версия | Дата | Изменения | Автор |
|--------|------|-----------|-------|
| 0.1.0 | {{YYYY-MM-DD}} | Начальная версия | {{автор}} |
