# 📐 Правила создания компонент-спецификаций

> **Назначение:** Правила и конвенции для режима `component-spec`
> **Статус:** `[ACTIVE]`

---

## 1. Общие принципы

| Принцип | Описание |
|---|---|
| **Spec-First** | Сначала спецификация, потом код. Без spec — нет code |
| **Трассируемость** | Каждый компонент ссылается на AC → US → FR → задачу |
| **Атомарность** | Один файл — одна ответственность |
| **Консистентность** | Следовать существующим паттернам проекта |

---

## 2. Гранулярность скелетов (L2 + гибрид)

### 2.1 Уровни детализации по слоям

| Слой | Уровень | Что включает |
|---|---|---|
| Domain (types, validators, errors, repo, service) | **L2** | Полные интерфейсы, все методы с `throw new Error('[TODO] TASK-ID')` |
| API (route handlers) | **L2** | Сигнатуры + JSDoc + `throw new Error('[TODO] TASK-ID')` |
| UI (компоненты) | **L2** | Props + состояния (`loading, error, data, empty`) + guard-clauses + TODO |
| Hooks | **L2** | Возвращаемые поля + `useState` + `useCallback` с TODO |
| Pages | **L1** | Только базовая структура и импорты |

### 2.2 Что входит в скелет (L2)

| Элемент | Входит |
|---|---|
| Imports | ✅ Все необходимые импорты |
| Interfaces/Types | ✅ Полные определения с JSDoc |
| Enum/Union types | ✅ Полные определения |
| Функции-скелеты | ✅ Сигнатура + `throw new Error('[TODO] TASK-ID')` |
| Class constructor | ✅ С DI-параметрами |
| State declarations | ✅ `useState` с типами |
| Бизнес-логика | ❌ (реализуется в code-режиме) |
| JSX разметка | ❌ (только `return <div role="region" aria-label="...">{/* [TODO] */}</div>`) |
| Event handlers | ✅ Сигнатура + TODO |

### 2.3 Формат TODO-комментариев

```typescript
// В методах:
throw new Error('[TODO] Описание задачи — TASK-ID');

// В JSX:
return (
  <div role="region" aria-label="Список">
    {/* [TODO] Описание задачи — TASK-ID */}
  </div>
);

// В комментариях:
// [TODO] Описание задачи — TASK-ID
```

---

## 3. Правила JSDoc-аннотаций

### 3.1 Обязательные аннотации

| Аннотация | Слой | Пример |
|---|---|---|
| `@component` | UI | `@component DocumentList` |
| `@type` | Domain | `@type Document` |
| `@domain` | Все | `@domain documents` |
| `@schema` | Validators | `@schema createDocumentSchema` |
| `@error` | Errors | `@error DocumentNotFoundError` |
| `@interface` | Repository | `@interface IDocumentRepository` |
| `@service` | Service | `@service DocumentService` |
| `@route` | API | `@route GET /documents` |
| `@hook` | Hooks | `@hook useDocuments` |
| `@spec` | Все | Список правил поведения |
| `@traces` | Все | `US-22-05 AC-1` |
| `@task` | Все | `DOCS-T9.1` |

### 3.2 Пример JSDoc для компонента

```typescript
/**
 * @component DocumentList
 * @category documents
 * @description Компонент списка документов с фильтрацией и пагинацией
 *
 * @example
 * ```tsx
 * <DocumentList filter={{ categoryId: 'cat-1' }} onCardClick={(id) => ...} />
 * ```
 *
 * @spec
 * - Загружает данные при mount через useDocuments(filter)
 * - Обработаны состояния: loading, error, empty, data
 * - Клик по карточке → onCardClick(doc.id)
 * - Сортировка по createdAt DESC
 *
 * @traces US-22-05 AC-1, AC-9
 * @task DOCS-T9.1
 *
 * @see docs/user-stories/US-22-05.md
 */
```

### 3.3 Пример JSDoc для доменного метода

```typescript
/**
 * Создать {entity}
 *
 * @param data - Валидированные данные для создания
 * @returns Созданная сущность
 * @throws {Entity}ConflictError — если уже существует с таким name
 * @throws {Entity}ValidationError — если данные невалидны
 *
 * @traces US-XX AC-1
 * @task TASK-ID
 */
async create(data: Create{Entity}Data): Promise<{Entity}>;
```

---

## 4. Матрица трассировки (V2 — компактная)

### 4.1 Формат

```markdown
| # | Компонент | Слой | Действие | US | AC | Задача | Статус |

# где Действие: 🆕 Создать | ✏️ Добавить | 🔧 Изменить
```

### 4.2 Правила заполнения

1. Каждая строка — один компонент/метод
2. В колонке `AC` перечислить все покрываемые критерии (через запятую или диапазоном: `AC-1..5`)
3. После заполнения — проверить что каждый AC из US имеет строку в матрице
4. Если AC не покрыт — добавить компонент или расширить существующий

### 4.3 Правила действий

| Действие | Когда использовать |
|---|---|
| 🆕 Создать | Новый файл (компонент, тип, route) |
| ✏️ Добавить | Новый метод/интерфейс в существующий файл |
| 🔧 Изменить | Изменение существующего элемента (enum, interface) |

### 4.4 Проверка покрытия

```markdown
### Проверка покрытия AC

| US | AC | Покрыт в строке | Статус |
|---|---|---|---|
| US-XX | AC-1 | #1, #5 | ✅ |
| US-XX | AC-8 | — | ❌ `[MISSING]` |
```

---

## 5. Правило 50 строк (V2 — предупреждение)

### 5.1 Формулировка

Если по оценочному объёму компонент >50 строк бизнес-логики, spec должна содержать предупреждение и рекомендацию по разбиению на подкомпоненты.

### 5.2 Формат предупреждения

```markdown
**⚠️ Оценка:** ~80 строк — превышает 50 — рекомендуется разбиение

**Рекомендация по разбиению:**

| Подкомпонент | Ответственность |
|---|---|
| `{Parent}` | Координация, состояния |
| `{Parent}/{Sub1}` | Подответственность 1 |
| `{Parent}/{Sub2}` | Подответственность 2 |
```

---

## 6. Обработка существующего кода (Вариант B)

### 6.1 Принцип

Если меняется один файл — проверить и обновить все зависимые. Полная консистентность.

### 6.2 Алгоритм для существующего домена

```
При добавлении нового функционала в существующий домен:

1. Определить какие файлы будут затронуты (types, validators, errors, repo, service)
2. Для каждого затронутого файла:
   a. Если файл существует → ✏️ Добавить новый элемент (метод/тип/схему)
   b. Если файл не существует → 🆕 Создать файл
3. Проверить что все зависимости покрыты (неиспользуемые импорты/типы)
4. Убедиться что tsc --noEmit проходит
```

### 6.3 Пример

```
Задача: Добавить архивацию документов в существующий domain documents

Обновляется всё что затронуто:

✅ document.types.ts          → ✏️ +DocumentStatus 'archived' +ArchiveDocumentData
✅ document.validators.ts     → ✏️ +archiveDocumentSchema
✅ document.errors.ts         → ✏️ +DocumentArchivedError
✅ document.repository.interface.ts → ✏️ +updateStatus()
✅ document.repository.prisma.ts    → ✏️ +updateStatus() { throw new Error('[TODO]') }
✅ document.service.ts        → ✏️ +archiveDocument() { throw new Error('[TODO]') }
✅ [id]/archive/route.ts      → 🆕 новый route-скелет
✅ ArchiveButton.tsx          → 🆕 новый компонент-скелет
```

---

## 7. Структура файлов проекта

### 7.1 Domain Layer

```
src/domains/{domain}/
├── index.ts                        # Re-export публичного API
├── {entity}.types.ts               # Типы и интерфейсы
├── {entity}.validators.ts          # Zod-схемы
├── {entity}.errors.ts              # Классы ошибок
├── {entity}.repository.interface.ts # Интерфейс репозитория
├── {entity}.repository.prisma.ts    # Prisma-реализация
└── {entity}.service.ts             # Бизнес-логика
```

### 7.2 API Layer

```
src/app/api/v1/{resource}/
├── route.ts                        # Collection endpoints (GET, POST)
└── [id]/
    └── route.ts                    # Detail endpoints (GET, PUT, DELETE)
```

### 7.3 UI Layer

```
src/components/features/{domain}/
├── index.ts                        # Re-export фичи
├── {Component}/
│   ├── {Component}.tsx             # Компонент
│   └── index.ts                    # Re-export
└── ...
```

### 7.4 Hooks

```
src/hooks/
└── use{Hook}.ts                    # Кастомный хук
```

### 7.5 Pages

```
src/app/dashboard/
└── {resource}/
    ├── page.tsx                    # Страница списка
    └── [id]/
        └── page.tsx                # Страница детали
```

---

## 8. Конвенции кода

### 8.1 API Routes

- Использовать относительные пути (без `/api/v1`) согласно [`docs/rules/api-endpoint-rules.md`](api-endpoint-rules.md)
- `auth()` для проверки авторизации
- Ответ: `{ success: true/false, data?, error? }`
- Обработка ошибок через `instanceof BaseError`

### 8.2 UI Components

- `'use client'` наверху файла
- Props interface с JSDoc
- Состояния: `loading`, `error`, `data`, `empty`
- `apiClient` для запросов (не `fetch()` напрямую)
- `useSession()` для авторизации
- Кнопки блокируются при `isLoading`
- `EmptyState` для пустых состояний
- aria-label, focus-ring, role для доступности

### 8.3 Service

- DI через интерфейсы (не реализации Prisma)
- Валидация через Zod-схемы
- Бизнес-валидация через доменные ошибки

### 8.4 Errors

- Наследование от `BaseError` и подклассов (`NotFoundError`, `ValidationError`, `ConflictError`, `ForbiddenError`)
- Сообщения об ошибках на русском языке

---

## 9. Чек-лист проверки (G2)

### Spec-файл

- [ ] Матрица трассировки покрывает все AC из всех US
- [ ] Каждый компонент имеет TASK-ID из плана

### Скелеты кода

- [ ] Все файлы созданы по матрице трассировки
- [ ] JSDoc с `@spec`, `@traces`, `@task` на каждом элементе
- [ ] TypeScript компилируется (`tsc --noEmit`)
- [ ] index.ts файлы содержат правильные re-export

### Архитектура

- [ ] DDD-архитектура соблюдена (слои не пересекаются)
- [ ] DI через интерфейсы (не реализации Prisma)
- [ ] API пути относительные (без `/api/v1`)
- [ ] `'use client'` наверху клиентских компонентов
- [ ] `apiClient` для запросов, `useSession()` для авторизации

---

## 10. Связанные артефакты

| Артефакт | Описание |
|---|---|
| [`docs/templates/component-spec-template.md`](../templates/component-spec-template.md) | Шаблон spec.md |
| [`docs/skills/create-component-spec.md`](../skills/create-component-spec.md) | Skill для оркестратора |
| [`docs/rules/api-endpoint-rules.md`](api-endpoint-rules.md) | Правила API путей |
| `.roomodes` | Режим `component-spec` |

---

**Последнее обновление:** 2026-07-22
**Автор:** System Architect
**Статус:** `[ACTIVE]`
