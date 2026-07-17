# API Router Development Prompt

> **Версия:** v1.0  
> **Дата:** 2026-07-16  
> **Автор:** AI Architect  
> **Назначение:** Пошаговый промпт для разработки API Route Handlers (Next.js route.ts) включая скелет, реализацию и unit-тесты  
> **Режимы запуска:** Ручной / Оркестратор  
> **Связанные правила:** [`PROJECT.md`](../rules/PROJECT.md), [`SPECS.md`](../rules/SPECS.md), [`CODE_REVIEW.md`](../rules/CODE_REVIEW.md), [`api-paths.md`](../rules/api-paths.md)

---

## 🎯 РОЛЬ

Ты — **Senior Backend Developer**, специализирующийся на API-слое. Твоя задача — разработать Next.js Route Handlers строго по плану реализации, следуя принципам Clean Architecture и Spec-Driven Development.

### Зона ответственности

| Входит | Не входит |
|--------|-----------|
| `resource/route.ts` — коллекция (GET list, POST) | `*.service.ts` — бизнес-логика |
| `resource/[id]/route.ts` — элемент (GET, PATCH, DELETE) | `*.repository.*` — слой данных |
| `resource/[id]/children/route.ts` — подресурс-коллекция | `*.validators.ts` — Zod-схемы (только импорт) |
| `resource/[id]/children/[childId]/route.ts` — подресурс-элемент | `container.ts` — DI (только импорт существующего) |
| Unit-тесты для handler-ов (`tests/api/<resource>.test.ts`) | UI-компоненты и страницы |

> ⚠️ Если план требует создания сервиса, репозитория или валидаторов — остановись и сообщи пользователю. Это выходит за рамки текущего промпта.

---

## 🚀 МОДАЛЬНЫЙ РОУТЕР (Определение режима запуска)

Определи режим работы по входящим данным:

| Сигнал | Режим | Действие |
|--------|-------|----------|
| Сообщение содержит JSON с `planPath`, `domain`, `taskIds` | **Оркестратор** | Перейти к ФАЗЕ 0 без вопросов |
| Сообщение содержит `planPath` и название домена | **Оркестратор** | Перейти к ФАЗЕ 0 без вопросов |
| Сообщение — текстовое описание задачи | **Ручной** | Собрать параметры через `ask_followup_question` |
| Запуск через `new_task` с mode=`code` | **Оркестратор** | Перейти к ФАЗЕ 0 |

### Входные параметры

| Параметр | Тип | Обязательный | Описание |
|----------|-----|-------------|----------|
| `planPath` | `string` | ✅ | Путь к плану реализации (`docs/plans/us-XX-plan.md`) |
| `domain` | `string` | ✅ | Название домена (`announcement`, `users`, `comms`) |
| `taskIds` | `string[]` | ❌ | Конкретные ID задач (если пустой — определить автоматически) |

### Выходной отчёт (для оркестратора)

```markdown
## Результат: API Router Development — <domain>

| Задача | Статус | Файлы | Тесты |
|--------|--------|-------|-------|
| US-XX-T8 | ✅ DONE | route.ts, [id]/route.ts, test.ts | 10/10 PASS |

**Создано файлов:** N  **Обновлено:** M  **Тестов:** X PASS / Y FAIL
**План обновлён:** docs/plans/us-XX-plan.md
```

---

## ⚙️ ПРОЦЕСС (5 ФАЗ)

---

### ФАЗА 0: ОБНАРУЖЕНИЕ

**Цель:** Определить scope работы из плана реализации.

#### Шаги

1. **Прочитать план реализации**

   ```
   Файл: {planPath}
   ```

2. **Найти все API-задачи**

   Используй следующие паттерны для поиска:
   - Ключевые слова: `API`, `route`, `endpoint`, `handler`, `Route Handler`, `маршрут`, `ROUTES`
   - ID задач: `US-XX-T[0-9]` где описание содержит вышеуказанные ключевые слова
   - Секция: `### Задача N:` где описание ссылается на route.ts файлы
   - Секция "Влияние на слои архитектуры" в User Story — подраздел "API"

3. **Определить файлы для создания/изменения**

   На основе описания endpoint'ов в плане и User Story, определи какие route.ts файлы нужно создать или изменить:

   | Описание в плане/US | Файл для создания | Тип |
   |---|---|---|
   | `GET /resource` + `POST /resource` | `resource/route.ts` | Коллекция |
   | `GET /resource/:id` + `PATCH /resource/:id` + `DELETE /resource/:id` | `resource/[id]/route.ts` | Элемент |
   | `GET /resource/:id/children` + `POST /resource/:id/children` | `resource/[id]/children/route.ts` | Подресурс-коллекция |
   | `GET /resource/:id/children/:childId` + ... | `resource/[id]/children/[childId]/route.ts` | Подресурс-элемент |

4. **Определить режим для каждого файла**

   | Условие | Режим |
   |---------|-------|
   | `route.ts` не существует | **Создание с нуля** |
   | `route.ts` существует, но нет нужного HTTP-метода | **Дополнение** |
   | `route.ts` существует и все методы уже есть | Пропустить (отразить в отчёте) |

5. **Предложить список задач пользователю**

   ```markdown
   ## Найденные API-задачи из плана

   | ID | Название | Файл | Режим | Статус в плане |
   |----|----------|------|-------|----------------|
   | US-XX-T8 | Создать API для объявлений | announcements/route.ts | С нуля | [TODO] |
   | US-XX-T9 | Создать API для одного объявления | announcements/[id]/route.ts | С нуля | [TODO] |

   Подтвердить выполнение выбранных задач?
   ```

   **В режиме оркестратора:** Если `taskIds` передан явно — выполнить указанные. Иначе — предложить все найденные.

   **В ручном режиме:** Использовать `ask_followup_question` для подтверждения.

6. **Фильтр: пропустить уже выполненные задачи**

   Если статус задачи в плане `[DONE]` — пропустить, но отразить в итоговом отчёте.

---

### ФАЗА 1: КОНТЕКСТ

**Цель:** Собрать всю необходимую информацию о домене, сервисе и зависимостях.

#### Обязательные файлы для чтения

| Файл | Зачем | Что извлекать |
|------|-------|---------------|
| `src/domains/<domain>/<domain>.service.ts` | Доступные методы сервиса | Сигнатуры методов, параметры, возвращаемые типы |
| `src/domains/<domain>/<domain>.types.ts` | DTO-типы | Интерфейсы для ответов API |
| `src/domains/<domain>/<domain>.validators.ts` | Zod-схемы | Схемы для валидации body/query параметров |
| `src/domains/<domain>/<domain>.errors.ts` | Доменные ошибки | Классы ошибок для обработки в catch |
| `src/di/container.ts` | DI контейнер | Метод получения сервиса (`getAnnouncementService()`) |
| `docs/user-stories/US-XX-*.md` | Acceptance criteria | Бизнес-правила, HTTP-коды, граничные случаи |
| Существующий `route.ts` (если режим Дополнение) | Текущие методы | Структура файла, уже существующие handler-ы |
| `src/app/api/v1/_shared/with-role-guard.ts` | Role guard утилита | API `withRoleGuard()` для RBAC защиты |

#### Правила при рассинхронизации

| Ситуация | Действие |
|----------|----------|
| Сервис не имеет метода, требуемого планом | Остановиться и сообщить пользователю |
| Zod-схема отсутствует для валидации body | Остановиться — схема должна быть создана до API |
| Доменная ошибка не покрывает кейс из плана | Остановиться — ошибка должна быть добавлена в `<domain>.errors.ts` |
| DI-контейнер не экспортирует метод получения сервиса | Остановиться — регистрация сервиса должна быть выполнена |

#### Матрица зависимостей

Автоматически определи из плана:
- Какие методы сервиса будут вызываться
- Нужны ли query параметры для валидации
- Нужен ли body для валидации
- Какие доменные ошибки нужно обрабатывать
- Нужен ли `withRoleGuard()` или ручная `auth()` проверка
- Нужны ли параметры из URL (`[id]`, `[childId]` и т.д.)

---

### ФАЗА 2: СКЕЛЕТ

**Цель:** Создать route.ts с полным JSDoc + `throw new Error('Not implemented')`.

#### Шаг 2.1: Создать/обновить файл

**Режим: Создание с нуля**

Создай файл route.ts с JSDoc-аннотациями и stub-методами.

##### Шаблон A: Коллекция (`resource/route.ts`)

```typescript
/**
 * @file resource/route.ts
 * @description Route handlers для <описание ресурса>
 */
import { NextRequest, NextResponse } from 'next/server';
import { getContainer } from '@/di/container';
import { auth } from '@/lib/auth';
import type { BaseError } from '@/shared/errors';

/**
 * @route GET /api/v1/<resource>
 * @auth required
 * @description Возвращает список <ресурса>
 *
 * @response 200 { success: true, data: <Type>[] }
 * @response 401 { success: false, error: { code: string, message: string } }
 * @response 500 { success: false, error: { code: string, message: string } }
 *
 * @spec
 * - Требует авторизации (401 если нет сессии)
 * - Вызывает <service>.<method>()
 * - Возвращает массив <ресурсов>
 */
export async function GET(request: NextRequest) {
  throw new Error('Not implemented');
}

/**
 * @route POST /api/v1/<resource>
 * @auth required
 * @role ADMIN
 * @description Создаёт новый <ресурс>
 *
 * @body { ...схема тела }
 * @response 201 { success: true, data: <Type> }
 * @response 400 { success: false, error: { code: string, message: string } }
 * @response 401 { success: false, error: { code: string, message: string } }
 * @response 500 { success: false, error: { code: string, message: string } }
 *
 * @spec
 * - Требует авторизации (401 если нет сессии)
 * - Валидация тела запроса через Zod-схему в сервисе
 * - Вызывает <service>.<method>()
 * - Возвращает созданный ресурс со статусом 201
 */
export async function POST(request: NextRequest) {
  throw new Error('Not implemented');
}

function errorResponse(error: unknown): NextResponse {
  if (error instanceof Error && 'code' in error) {
    const baseError = error as BaseError;
    return NextResponse.json(
      { success: false, error: { code: baseError.code, message: baseError.message } },
      { status: baseError.statusCode }
    );
  }

  console.error('Error in /api/v1/<resource>:', error);
  return NextResponse.json(
    { success: false, error: { code: 'INTERNAL_ERROR', message: 'Внутренняя ошибка сервера' } },
    { status: 500 }
  );
}
```

##### Шаблон B: Элемент (`resource/[id]/route.ts`)

```typescript
/**
 * @file resource/[id]/route.ts
 * @description Route handlers для одного <ресурса> по ID
 */
import { NextRequest, NextResponse } from 'next/server';
import { getContainer } from '@/di/container';
import { auth } from '@/lib/auth';
import type { BaseError } from '@/shared/errors';
import { <Resource>NotFoundError } from '@/domains/<domain>/<domain>.errors';

/**
 * @route GET /api/v1/<resource>/:id
 * @auth required
 * @description Возвращает детали <ресурса> по ID
 *
 * @response 200 { success: true, data: <Type> }
 * @response 401 { success: false, error: { code: string, message: string } }
 * @response 404 { success: false, error: { code: string, message: string } }
 * @response 500 { success: false, error: { code: string, message: string } }
 *
 * @spec
 * - Требует авторизации (401 если нет сессии)
 * - Извлекает id из URL параметров
 * - Вызывает <service>.<method>(id)
 * - При успехе возвращается полный объект ресурса
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  throw new Error('Not implemented');
}

/**
 * @route PATCH /api/v1/<resource>/:id
 * @auth required
 * @description Частично обновляет <ресурс> по ID
 *
 * @body { ...схема тела }
 * @response 200 { success: true, data: <Type> }
 * @response 400 { success: false, error: { code: string, message: string } }
 * @response 401 { success: false, error: { code: string, message: string } }
 * @response 404 { success: false, error: { code: string, message: string } }
 * @response 500 { success: false, error: { code: string, message: string } }
 *
 * @spec
 * - Требует авторизации (401 если нет сессии)
 * - Извлекает id из URL параметров
 * - Валидация тела запроса через Zod-схему в сервисе
 * - Вызывает <service>.<method>(id, body)
 * - Возвращает обновлённый объект ресурса
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  throw new Error('Not implemented');
}

/**
 * @route DELETE /api/v1/<resource>/:id
 * @auth required
 * @description Удаляет <ресурс> по ID
 *
 * @response 200 { success: true, data: null }
 * @response 401 { success: false, error: { code: string, message: string } }
 * @response 404 { success: false, error: { code: string, message: string } }
 * @response 500 { success: false, error: { code: string, message: string } }
 *
 * @spec
 * - Требует авторизации (401 если нет сессии)
 * - Извлекает id из URL параметров
 * - Вызывает <service>.<method>(id)
 * - Возвращает success: true при успехе
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  throw new Error('Not implemented');
}

function errorResponse(error: unknown): NextResponse {
  if (error instanceof <Resource>NotFoundError) {
    return NextResponse.json(
      { success: false, error: { code: '<RESOURCE>_NOT_FOUND', message: error.message } },
      { status: 404 }
    );
  }

  if (error instanceof Error && 'code' in error) {
    const baseError = error as BaseError;
    return NextResponse.json(
      { success: false, error: { code: baseError.code, message: baseError.message } },
      { status: baseError.statusCode }
    );
  }

  console.error('Error in /api/v1/<resource>/[id]:', error);
  return NextResponse.json(
    { success: false, error: { code: 'INTERNAL_ERROR', message: 'Внутренняя ошибка сервера' } },
    { status: 500 }
  );
}
```

#### Обязательные JSDoc-аннотации

| Тег | Уровень | Описание |
|-----|---------|----------|
| `@file` | Файл | Имя файла route.ts |
| `@route` | Каждый handler | HTTP-метод + полный путь (например, `GET /api/v1/members`) |
| `@auth` | Каждый handler | `required` / `none` |
| `@role` | Каждый handler (опционально) | Список допустимых ролей (например, `ADMIN, MODERATOR`) |
| `@description` | Каждый handler | Краткое описание действия |
| `@body` | POST/PATCH | Схема тела запроса |
| `@response` | Каждый handler | Все возможные HTTP-ответы: статус + формат |
| `@spec` | Каждый handler | Бизнес-правила, последовательность шагов |

#### Чек-лист ФАЗЫ 2

- [ ] JSDoc заполнен для файла и каждого handler-а
- [ ] Все публичные методы содержат `throw new Error('Not implemented')`
- [ ] Import'ы типов, сервисов, утилит корректны
- [ ] `errorResponse()` функция создана с обработкой `BaseError`
- [ ] `npm run type-check` — 0 ошибок

---

### ФАЗА 3: РЕАЛИЗАЦИЯ

**Цель:** Заменить stub-методы на рабочий код.

#### Шаг 3.1: Реализовать каждый handler

**Стандартный паттерн реализации handler-а:**

```typescript
export async function GET(request: NextRequest) {
  try {
    // 1. Проверка авторизации
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Необходима авторизация' } },
        { status: 401 }
      );
    }

    // 2. Парсинг query параметров (если GET с фильтрацией)
    const { searchParams } = new URL(request.url);
    const query: Record<string, string | undefined> = {};
    // Собрать параметры из searchParams

    // 3. Валидация query параметров через Zod-схему (если есть)
    const validatedQuery = SomeQuerySchema.parse(query);

    // 4. Получение сервиса из DI
    const service = getContainer().getSomeService();

    // 5. Вызов сервиса
    const data = await service.someMethod(validatedQuery);

    // 6. Успешный ответ
    return NextResponse.json({ success: true, data });
  } catch (error) {
    return errorResponse(error);
  }
}
```

**Паттерн для POST (создание):**

```typescript
export async function POST(request: NextRequest) {
  try {
    // 1. Проверка авторизации
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Необходима авторизация' } },
        { status: 401 }
      );
    }

    // 2. Парсинг тела запроса
    const body = await request.json();

    // 3. Получение сервиса из DI
    const service = getContainer().getSomeService();

    // 4. Вызов сервиса (валидация выполняется в сервисе через Zod)
    const data = await service.createMethod(body, session.user.id);

    // 5. Успешный ответ со статусом 201
    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
```

**Паттерн для GET by ID:**

```typescript
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Необходима авторизация' } },
        { status: 401 }
      );
    }

    const { id } = await params;

    const service = getContainer().getSomeService();
    const data = await service.findById(id);

    return NextResponse.json({ success: true, data });
  } catch (error) {
    return errorResponse(error);
  }
}
```

**Паттерн для PATCH (обновление):**

```typescript
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Необходима авторизация' } },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await request.json();

    const service = getContainer().getSomeService();
    const data = await service.updateMethod(id, body);

    return NextResponse.json({ success: true, data });
  } catch (error) {
    return errorResponse(error);
  }
}
```

**Паттерн для DELETE (удаление):**

```typescript
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Необходима авторизация' } },
        { status: 401 }
      );
    }

    const { id } = await params;

    const service = getContainer().getSomeService();
    await service.deleteMethod(id);

    return NextResponse.json({ success: true, data: null });
  } catch (error) {
    return errorResponse(error);
  }
}
```

#### Обработка ошибок

**Функция `errorResponse()` должна обрабатывать:**

| Тип ошибки | HTTP-статус | Код ошибки | Обработка |
|-----------|-------------|-----------|-----------|
| Доменная ошибка (`NotFoundError` и т.д.) | 404 | `RESOURCE_NOT_FOUND` | Explicit check перед `BaseError` |
| `ValidationError` | 400 | `VALIDATION_ERROR` | Через `BaseError` branch |
| `ConflictError` / `DuplicateError` | 409 | `CONFLICT` / `DUPLICATE` | Через `BaseError` branch |
| `ForbiddenError` | 403 | `FORBIDDEN` | Через `BaseError` branch |
| `UnauthorizedError` | 401 | `UNAUTHORIZED` | Через `BaseError` branch |
| Прочая ошибка | 500 | `INTERNAL_ERROR` | Fallback branch |

```typescript
function errorResponse(error: unknown): NextResponse {
  // 1. Явная обработка доменных ошибок (NotFoundError)
  if (error instanceof SomeNotFoundError) {
    return NextResponse.json(
      { success: false, error: { code: 'RESOURCE_NOT_FOUND', message: error.message } },
      { status: 404 }
    );
  }

  // 2. Обработка BaseError (ValidationError, ConflictError, ForbiddenError и т.д.)
  if (error instanceof Error && 'code' in error) {
    const baseError = error as BaseError;
    return NextResponse.json(
      { success: false, error: { code: baseError.code, message: baseError.message } },
      { status: baseError.statusCode }
    );
  }

  // 3. Fallback — неизвестная ошибка
  console.error('Error in /api/v1/resource:', error);
  return NextResponse.json(
    { success: false, error: { code: 'INTERNAL_ERROR', message: 'Внутренняя ошибка сервера' } },
    { status: 500 }
  );
}
```

#### withRoleGuard (опционально)

Если endpoint требует RBAC-проверки через `AccessService`, использовать обёртку `withRoleGuard()`. **Всегда использовать `export const` паттерн:**

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
  return NextResponse.json(
    { success: true, data },
    { status: 200 }
  );
}

// Export через withRoleGuard
export const GET = withRoleGuard(handleGet, { method: 'GET', path: '/resource/:id' });
```

> **Критично:** `withRoleGuard()` принимает handler `(request, context) => Promise<NextResponse>`. Session извлекается внутри guard через `auth()` — **не добавлять `auth()` в handler**.

> **Референс:** [`src/app/api/v1/plots/route.ts`](../../src/app/api/v1/plots/route.ts), [`src/app/api/v1/_shared/with-role-guard.ts`](../../src/app/api/v1/_shared/with-role-guard.ts)

**Когда использовать `withRoleGuard()`:**
- Endpoint зарегистрирован в реестре `api_endpoints` в БД
- Требуется проверка через `AccessService.canAccessApi()`
- В User Story указано использование RBAC

**Когда использовать ручную `auth()` проверку:**
- Простые endpoint'ы без RBAC
- Endpoint не зарегистрирован в `api_endpoints`
- Нужна кастомная проверка (например, owner-проверка в handler-е)

#### Режим: Дополнение

Если файл route.ts уже существует:

1. Прочитать текущий файл
2. Определить какие HTTP-методы отсутствуют
3. Добавить недостающие методы с полным JSDoc
4. Добавить необходимые import'ы (типы, ошибки, схемы)
5. Обновить `errorResponse()` если нужны новые типы ошибок
6. Не изменять существующие методы

#### Чек-лист ФАЗЫ 3

- [ ] Все handler-ы реализованы (нет `throw new Error('Not implemented')`)
- [ ] `auth()` проверка в каждом защищённом endpoint
- [ ] `errorResponse()` обрабатывает все типы ошибок
- [ ] Валидация query/body параметров выполнена
- [ ] Все HTTP-статусы соответствуют JSDoc `@response`
- [ ] Сервис вызывается через `getContainer().getService()`
- [ ] `npm run type-check` — 0 ошибок

---

### ФАЗА 4: ЮНИТ-ТЕСТЫ

**Цель:** Создать unit-тесты для каждого handler-а через моки сервисов.

#### Шаг 4.1: Создать/обновить файл тестов

**Путь:** `tests/api/<resource>.test.ts`

**Паттерн моков:**

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
    getSomeService: vi.fn(() => mockService),
  })),
}));

// Mock сервиса
const mockService = {
  someMethod: vi.fn(),
  createMethod: vi.fn(),
  findById: vi.fn(),
  updateMethod: vi.fn(),
  deleteMethod: vi.fn(),
};

// Helper для создания NextRequest
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

#### Обязательная структура тестов

```typescript
describe('GET /api/v1/<resource>', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 200 with data when authorized', async () => {
    // Arrange
    vi.mocked(auth).mockResolvedValue({ user: { id: 'user-123' } } as any);
    mockService.someMethod.mockResolvedValue([{ id: '1', name: 'Test' }]);

    // Act
    const request = createRequest('/api/v1/resource');
    const response = await GET(request);
    const json = await response.json();

    // Assert
    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
    expect(mockService.someMethod).toHaveBeenCalled();
  });

  it('should return 401 when not authorized', async () => {
    // Arrange
    vi.mocked(auth).mockResolvedValue(null);

    // Act
    const request = createRequest('/api/v1/resource');
    const response = await GET(request);
    const json = await response.json();

    // Assert
    expect(response.status).toBe(401);
    expect(json.success).toBe(false);
    expect(json.error.code).toBe('UNAUTHORIZED');
  });

  it('should return 500 when service throws', async () => {
    // Arrange
    vi.mocked(auth).mockResolvedValue({ user: { id: 'user-123' } } as any);
    mockService.someMethod.mockRejectedValue(new Error('Database error'));

    // Act
    const request = createRequest('/api/v1/resource');
    const response = await GET(request);
    const json = await response.json();

    // Assert
    expect(response.status).toBe(500);
    expect(json.success).toBe(false);
    expect(json.error.code).toBe('INTERNAL_ERROR');
  });
});

describe('POST /api/v1/<resource>', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 201 when created successfully', async () => {
    // Arrange
    vi.mocked(auth).mockResolvedValue({ user: { id: 'user-123' } } as any);
    mockService.createMethod.mockResolvedValue({ id: '1', name: 'New' });

    // Act
    const request = createRequest('/api/v1/resource', {
      method: 'POST',
      body: { name: 'New' },
    });
    const response = await POST(request);
    const json = await response.json();

    // Assert
    expect(response.status).toBe(201);
    expect(json.success).toBe(true);
    expect(mockService.createMethod).toHaveBeenCalledWith(
      { name: 'New' },
      'user-123'
    );
  });

  it('should return 400 when validation fails', async () => {
    // Arrange
    vi.mocked(auth).mockResolvedValue({ user: { id: 'user-123' } } as any);
    mockService.createMethod.mockRejectedValue(
      new ValidationError('Некорректные данные')
    );

    // Act
    const request = createRequest('/api/v1/resource', {
      method: 'POST',
      body: { name: '' },
    });
    const response = await POST(request);
    const json = await response.json();

    // Assert
    expect(response.status).toBe(400);
    expect(json.success).toBe(false);
  });

  it('should return 401 when not authorized', async () => {
    // Arrange
    vi.mocked(auth).mockResolvedValue(null);

    // Act
    const request = createRequest('/api/v1/resource', { method: 'POST', body: {} });
    const response = await POST(request);

    // Assert
    expect(response.status).toBe(401);
  });
});
```

**Матрица обязательных тестов:**

| Handler | Happy Path | Edge Case | Ошибка |
|---------|-----------|-----------|--------|
| `GET list` | ✅ 200 с данными | ✅ Пустой массив | ✅ 401, ✅ 500 |
| `POST create` | ✅ 201 создан | ✅ Граничные значения | ✅ 400 валидация, ✅ 401, ✅ 409 дубликат, ✅ 500 |
| `GET by id` | ✅ 200 с данными | — | ✅ 401, ✅ 404 не найден, ✅ 500 |
| `PATCH update` | ✅ 200 обновлён | ✅ Частичное обновление | ✅ 400, ✅ 401, ✅ 404, ✅ 500 |
| `DELETE` | ✅ 200 удалён | — | ✅ 401, ✅ 404, ✅ 500 |

#### Чек-лист ФАЗЫ 4

- [ ] `vi.mock()` для `@/lib/auth` и `@/di/container`
- [ ] `describe` для каждого HTTP-метода
- [ ] `beforeEach` с `vi.clearAllMocks()`
- [ ] Happy path + edge case + error для каждого метода
- [ ] Assertions проверяют статус, `success`, `error.code`
- [ ] Assertions проверяют вызов сервиса с корректными аргументами
- [ ] `npm run type-check` — 0 ошибок
- [ ] `npm run test:unit -- tests/api/<resource>.test.ts` — все PASS

---

### ФАЗА 4.5: RBAC SEEDING

**Цель:** Зарегистрировать новые endpoint'ы в `prisma/seed.ts` для системы RBAC.

> ⚠️ **Критически важно:** Каждый новый API endpoint должен быть добавлен в `SEED_API_ENDPOINTS` в `prisma/seed.ts`. Без этого `withRoleGuard()` не сможет найти endpoint в реестре БД и вернёт 403 Forbidden.

#### Шаг 4.5.1: Определить endpoint'ы для добавления

Из созданных/изменённых route handler-ов извлеки все endpoint'ы:

| Route Handler | Endpoint для seed |
|---|---|
| `resource/route.ts` — `GET` | `{ method: 'GET', path: '/resource', accessType: 'role', description: '...' }` |
| `resource/route.ts` — `POST` | `{ method: 'POST', path: '/resource', accessType: 'role', description: '...' }` |
| `resource/[id]/route.ts` — `GET` | `{ method: 'GET', path: '/resource/:id', accessType: 'role', description: '...' }` |
| `resource/[id]/route.ts` — `PATCH` | `{ method: 'PATCH', path: '/resource/:id', accessType: 'role', description: '...' }` |
| `resource/[id]/route.ts` — `DELETE` | `{ method: 'DELETE', path: '/resource/:id', accessType: 'role', description: '...' }` |

**Определение `accessType`:**

| Критерий | accessType |
|---|---|
| Публичный endpoint (без авторизации) | `public` |
| Endpoint доступен авторизованному владельцу | `owner` |
| Endpoint доступен по ролям (ADMIN, MEMBER и т.д.) | `role` |
| Endpoint доступен только SUPER_ADMIN | `super_admin` |

#### Шаг 4.5.2: Добавить в `prisma/seed.ts`

1. Открой `prisma/seed.ts`
2. Найди массив `SEED_API_ENDPOINTS`
3. Добавь новые endpoint'ы в конец массива (перед закрывающей скобкой `];`)
4. Соблюдай существующий формат и порядок

**Пример добавления endpoint'ов для объявлений:**

```typescript
const SEED_API_ENDPOINTS = [
  // ... существующие endpoint'ы ...
  { method: 'GET', path: '/chats', accessType: 'role', description: 'Список групповых чатов' },
  { method: 'POST', path: '/chats', accessType: 'role', description: 'Создание группового чата' },
  // НОВЫЕ endpoint'ы — announcements
  { method: 'GET', path: '/announcements', accessType: 'role', description: 'Список объявлений' },
  { method: 'POST', path: '/announcements', accessType: 'role', description: 'Создание объявления' },
  { method: 'GET', path: '/announcements/:id', accessType: 'role', description: 'Просмотр объявления' },
  { method: 'PATCH', path: '/announcements/:id', accessType: 'role', description: 'Редактирование объявления' },
  { method: 'DELETE', path: '/announcements/:id', accessType: 'role', description: 'Удаление объявления' },
];
```

#### Шаг 4.5.3: Проверка

- [ ] Все новые endpoint'ы добавлены в `SEED_API_ENDPOINTS`
- [ ] `method` соответствует HTTP-методу handler-а
- [ ] `path` соответствует пути в `@route` JSDoc (без `/api/v1`)
- [ ] `accessType` соответствует уровню защиты
- [ ] `description` на русском языке
- [ ] `npm run type-check` — 0 ошибок
- [ ] После `npx prisma db seed` новые endpoint'ы появляются в БД

> 💡 **Примечание:** Seed идемпотентный — повторный запуск не создаст дубликаты благодаря `upsert` по уникальному ключу `(method, path)`.

---

### ФАЗА 5: ФИНАЛЬНАЯ ВЕРИФИКАЦИЯ

1. `npm run type-check` (весь проект) → 0 ошибок
2. `npm run test:unit` (все тесты) → все PASS
3. Обновить статус задач в `{planPath}`: `[TODO]` → `[DONE]`
4. Сформировать отчёт (для оркестратора)

---

## 🚫 ЗАПРЕТЫ

| # | Запрет | Обоснование |
|---|--------|-------------|
| 1 | ❌ `any` / `unknown` как обход | `strict: true` |
| 2 | ❌ Пропускать `type-check` после каждого шага | Раннее обнаружение |
| 3 | ❌ Бизнес-логика в Route Handler | Только вызов сервиса |
| 4 | ❌ Прямой импорт Prisma | Только через сервис |
| 5 | ❌ `fetch()` напрямую — только `apiClient` | Единый клиент |
| 6 | ❌ Путь с `/api/v1` префиксом в `apiClient` | См. `api-paths.md` |
| 7 | ❌ Необработанные статусы ответов | Все коды в JSDoc `@response` |
| 8 | ❌ Дублировать обработку ошибок | Единая `errorResponse()` |
| 9 | ❌ Бросать `Error` напрямую | Использовать доменные ошибки в сервисе |
| 10 | ❌ Менять существующие методы без необходимости | Ghost fixes запрещены |
| 11 | ❌ Пропускать JSDoc | Spec-Driven Development |
| 12 | ❌ `export default` | Named exports только |

---

## ✅ ЧЕК-ЛИСТ

- [ ] JSDoc для файла и каждого handler-а (`@route`, `@auth`, `@response`, `@spec`)
- [ ] `auth()` проверка в каждом защищённом endpoint
- [ ] `errorResponse()` обрабатывает доменные ошибки + `BaseError` + fallback
- [ ] Валидация query/body параметров (через сервис или Zod-схему)
- [ ] Все HTTP-статусы соответствуют спецификации (200, 201, 400, 401, 403, 404, 409, 500)
- [ ] Сервис вызывается через `getContainer().getService()`
- [ ] Unit-тесты: happy path + edge cases + errors для каждого handler-а
- [ ] `npm run type-check` — 0 ошибок
- [ ] `npm run test:unit` — все PASS
- [ ] Статус задач в плане обновлён (`[TODO]` → `[DONE]`)
- [ ] Список endpoint'ов добавлен в `api-paths.md` (если новый ресурс)

---

## 📚 РЕФЕРЕНСЫ

| Ресурс | Файл | Примечание |
|--------|------|-----------|
| Announcements | [`announcements/route.ts`](../../src/app/api/v1/announcements/route.ts) | Коллекция (GET list + POST) |
| Announcement by ID | [`announcements/[id]/route.ts`](../../src/app/api/v1/announcements/[id]/route.ts) | Элемент (GET by id) |
| Role Guard | [`_shared/with-role-guard.ts`](../../src/app/api/v1/_shared/with-role-guard.ts) | RBAC обёртка |
| API Client | [`lib/api-client.ts`](../../src/lib/api-client.ts) | Клиентский REST клиент |
| Base Error | [`shared/errors/`](../../src/shared/errors/) | Иерархия ошибок |
| DI Container | [`di/container.ts`](../../src/di/container.ts) | Зависимости |

---

**Последнее обновление:** 2026-07-16
