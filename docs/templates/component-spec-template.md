# Спецификация компонент: {Feature Name}

> **Назначение:** Спецификация компонент и скелетов кода для [{Feature}](../../plans/{realization-plan}.md)
> **Создано:** `component-spec` режим
> **Статус:** `[DRAFT]` → `[REVIEW]` → `[APPROVED]`

---

## 1. 📋 Метаданные

| Параметр | Значение |
|---|---|
| **Feature** | `{feature-name}` |
| **План реализации** | [`docs/plans/{plan}.md`](../../plans/{plan}.md) |
| **User Stories** | US-XX, US-YY |
| **Требования** | REQ-{SVC}-NNN |
| **Модель данных** | [`docs/model/entities/`](../../model/entities/) |
| **Версия** | `v1.0` |
| **Дата** | `{YYYY-MM-DD}` |
| **Статус** | `[DRAFT]` |

---

## 2. 📊 Матрица трассировки

> Каждая строка связывает компонент с требованиями. Без строки в матрице — нет компонента.
> Действия: 🆕 — создать файл, ✏️ — добавить в существующий, 🔧 — изменить существующее.

| # | Компонент | Слой | Действие | US | AC | Задача | Статус |
|---|---|---|---|---|---|---|---|
| 1 | `{Entity}Types` | Domain | 🆕 | US-XX | AC-1..3 | `{TASK-ID}` | `[TODO]` |
| 2 | `{Entity}Validators` | Domain | 🆕 | US-XX | AC-1 | `{TASK-ID}` | `[TODO]` |
| 3 | `{Entity}Errors` | Domain | 🆕 | US-XX | EC-1 | `{TASK-ID}` | `[TODO]` |
| 4 | `I{Entity}Repository` | Domain | 🆕 | US-XX | AC-1..5 | `{TASK-ID}` | `[TODO]` |
| 5 | `{Entity}RepositoryPrisma` | Domain | 🆕 | US-XX | AC-1..5 | `{TASK-ID}` | `[TODO]` |
| 6 | `{Entity}Service` | Domain | 🆕 | US-XX | AC-1..5 | `{TASK-ID}` | `[TODO]` |
| 7 | `{Resource}Route` | API | 🆕 | US-XX | AC-1, AC-2 | `{TASK-ID}` | `[TODO]` |
| 8 | `{Component}` | UI | 🆕 | US-XX | AC-3 | `{TASK-ID}` | `[TODO]` |
| 9 | `use{Hook}` | Hook | 🆕 | US-XX | AC-3 | `{TASK-ID}` | `[TODO]` |
| 10 | `{Page}` | Page | 🆕 | US-XX | AC-3 | `{TASK-ID}` | `[TODO]` |

---

## 3. 🏗️ Спецификация по слоям

> Каждый раздел описывает компонент: файл, интерфейсы, инварианты, поведение.
> Скелеты кода создаются в соответствующих `src/` файлах (см. матрицу трассировки).

---

### 3.1 Domain Layer

---

#### 3.1.1 `{Entity}Types`

| Параметр | Значение |
|---|---|
| **Файл** | `src/domains/{domain}/{entity}.types.ts` |
| **Действие** | 🆕 Создать |
| **Задача** | `{TASK-ID}` |
| **Трассировка** | US-XX AC-1..3 → FR-01 |

**Интерфейсы:**

| Интерфейс | Описание | Поля |
|---|---|---|
| `{Entity}` | Полная сущность | `id, ..., createdAt, updatedAt` |
| `Create{Entity}Data` | Данные для создания | `{обязательные поля}` |
| `Update{Entity}Data` | Данные для обновления | `partial<{Entity}>` |
| `{Entity}Filter` | Фильтры поиска | `{фильтруемые поля}?` |
| `{Entity}WithDetails` | Сущность с relation | `{Entity} + related[]` |

**Типы (enum/union):**

| Тип | Значения | Описание |
|---|---|---|
| `{Entity}Status` | `'draft' \| 'published' \| 'archived'` | Статус {entity} |

**Инварианты:**

- {Инвариант 1}: {описание}
- {Инвариант 2}: {описание}

---

#### 3.1.2 `{Entity}Validators`

| Параметр | Значение |
|---|---|
| **Файл** | `src/domains/{domain}/{entity}.validators.ts` |
| **Действие** | 🆕 Создать |
| **Задача** | `{TASK-ID}` |
| **Трассировка** | US-XX AC-1 → FR-01, BR-01 |

**Схемы:**

| Схема | Валидирует | Правила |
|---|---|---|
| `create{Entity}Schema` | `Create{Entity}Data` | BR-01, BR-02 |
| `update{Entity}Schema` | `Update{Entity}Data` | BR-01 |
| `{Entity}FilterSchema` | `{Entity}Filter` | max length, regex |

**Правила валидации:**

| Поле | Правило | Сообщение об ошибке |
|---|---|---|
| `name` | min 2, max 255, обязательное | "Имя должно содержать минимум 2 символа" |
| `description` | max 2000, опционально | "Описание не может превышать 2000 символов" |

---

#### 3.1.3 `{Entity}Errors`

| Параметр | Значение |
|---|---|
| **Файл** | `src/domains/{domain}/{entity}.errors.ts` |
| **Действие** | 🆕 Создать |
| **Задача** | `{TASK-ID}` |
| **Трассировка** | US-XX EC-1 → FR-01 |

**Классы ошибок:**

| Класс | Наследуется от | Сценарий | HTTP Status | Сообщение |
|---|---|---|---|---|
| `{Entity}NotFoundError` | `NotFoundError` | Сущность не найдена по ID | 404 | `"{Entity} с id {id} не найден"` |
| `{Entity}ConflictError` | `ConflictError` | Дублирующее имя/поля | 409 | `"{Entity} с таким именем уже существует"` |
| `{Entity}ValidationError` | `ValidationError` | Неверные входные данные | 400 | `"Некорректные данные для {entity}"` |
| `{Entity}AccessDeniedError` | `ForbiddenError` | Нет прав доступа | 403 | `"Доступ к {entity} запрещён"` |

---

#### 3.1.4 `I{Entity}Repository`

| Параметр | Значение |
|---|---|
| **Файл** | `src/domains/{domain}/{entity}.repository.interface.ts` |
| **Действие** | 🆕 Создать |
| **Задача** | `{TASK-ID}` |
| **Трассировка** | US-XX AC-1..5 → FR-01 |

**Методы:**

| Метод | Параметры | Возврат | Описание |
|---|---|---|---|
| `findById` | `id: string` | `Promise<{Entity} \| null>` | Найти по ID |
| `findByFilter` | `filter: {Entity}Filter` | `Promise<{Entity}[]>` | Найти по фильтру с пагинацией |
| `create` | `data: Create{Entity}Data` | `Promise<{Entity}>` | Создать новую сущность |
| `update` | `id: string, data: Update{Entity}Data` | `Promise<{Entity}>` | Обновить существующую |
| `delete` | `id: string` | `Promise<void>` | Удалить по ID |

**Инварианты методов:**

- `findById`: возвращает `null` если не найдено (не кидает ошибку)
- `create`: генерирует `id` автоматически через cuid
- `update`: кидает `{Entity}NotFoundError` если ID не существует
- `delete`: кидает `{Entity}NotFoundError` если ID не существует

---

#### 3.1.5 `{Entity}RepositoryPrisma`

| Параметр | Значение |
|---|---|
| **Файл** | `src/domains/{domain}/{entity}.repository.prisma.ts` |
| **Действие** | 🆕 Создать |
| **Задача** | `{TASK-ID}` |
| **Трассировка** | US-XX AC-1..5 → FR-01 |

**Описание:** Prisma-реализация интерфейса `I{Entity}Repository`.

**Зависимости (DI):**

| Параметр | Тип | Описание |
|---|---|---|
| `prisma` | `PrismaClient` | Prisma-клиент (внедряется через конструктор) |

**Методы:** все методы из интерфейса (см. 3.1.4) с реализациями `throw new Error('[TODO] {TASK-ID}')`.

---

#### 3.1.6 `{Entity}Service`

| Параметр | Значение |
|---|---|
| **Файл** | `src/domains/{domain}/{entity}.service.ts` |
| **Действие** | 🆕 Создать |
| **Задача** | `{TASK-ID}` |
| **Трассировка** | US-XX AC-1..5 → FR-01, BR-01 |

**Интерфейс сервиса:**

| Метод | Параметры | Возврат | Бизнес-правила |
|---|---|---|---|
| `create` | `data: Create{Entity}Data` | `Promise<{Entity}>` | BR-01: name уникально; BR-02: ... |
| `findById` | `id: string` | `Promise<{Entity}>` | Кидает `{Entity}NotFoundError` если не найден |
| `update` | `id: string, data: Update{Entity}Data` | `Promise<{Entity}>` | Валидация через Zod, затем BR |
| `delete` | `id: string` | `Promise<void>` | Проверка existence перед удалением |
| `list` | `filter: {Entity}Filter` | `Promise<PaginatedResult<{Entity}>>` | Фильтрация + пагинация |

**Зависимости (DI):**

| Параметр | Тип (Интерфейс) | Описание |
|---|---|---|
| `repository` | `I{Entity}Repository` | Репозиторий для доступа к данным |
| `{dependency}` | `I{Dependency}` | Дополнительная зависимость |

**Бизнес-валидация:**

| Сценарий | Проверка | Действие при ошибке |
|---|---|---|
| Создание с дублирующим name | `BR-01: name уникально` | `{Entity}ConflictError` |
| Обновление несуществующей | ID существует в БД | `{Entity}NotFoundError` |
| Удаление с зависимостями | Нет связанных сущностей | `{Entity}ConflictError` |

---

### 3.2 API Layer

---

#### 3.2.1 `{Resource}Route` (Collection)

| Параметр | Значение |
|---|---|
| **Файл** | `src/app/api/v1/{resource}/route.ts` |
| **Действие** | 🆕 Создать |
| **Задача** | `{TASK-ID}` |
| **Трассировка** | US-XX AC-1, AC-2 → FR-01 |

**Endpoints:**

| Метод | Путь | Auth | Роль | Request Body | Response | Ошибки |
|---|---|---|---|---|---|---|
| `GET` | `/{resource}` | ✅ | Все | — | `200: { success, data: {Entity}[] }` | `401` |
| `POST` | `/{resource}` | ✅ | ADMIN | `Create{Entity}Data` | `201: { success, data: {Entity} }` | `400, 401, 403, 409` |

**Поведение:**

- `GET`: применяет фильтры из query-параметров, возвращает список с пагинацией
- `POST`: валидирует тело через Zod-схему, возвращает созданную сущность

---

#### 3.2.2 `{Resource}[id]Route` (Detail)

| Параметр | Значение |
|---|---|
| **Файл** | `src/app/api/v1/{resource}/[id]/route.ts` |
| **Действие** | 🆕 Создать |
| **Задача** | `{TASK-ID}` |
| **Трассировка** | US-XX AC-3..5 → FR-01 |

**Endpoints:**

| Метод | Путь | Auth | Роль | Request Body | Response | Ошибки |
|---|---|---|---|---|---|---|
| `GET` | `/{resource}/[id]` | ✅ | Все | — | `200: { success, data: {Entity} }` | `401, 404` |
| `PUT` | `/{resource}/[id]` | ✅ | ADMIN | `Update{Entity}Data` | `200: { success, data: {Entity} }` | `400, 401, 403, 404` |
| `DELETE` | `/{resource}/[id]` | ✅ | ADMIN | — | `200: { success: true }` | `401, 403, 404, 409` |

---

### 3.3 UI Layer

---

#### 3.3.1 `{Component}`

| Параметр | Значение |
|---|---|
| **Файл** | `src/components/features/{domain}/{Component}/{Component}.tsx` |
| **Действие** | 🆕 Создать |
| **Задача** | `{TASK-ID}` |
| **Трассировка** | US-XX AC-3 → FR-02 |

**Props Interface:**

| Пропс | Тип | Обязательный | Описание |
|---|---|---|---|
| `{prop1}` | `{Type}` | ✅ | {Описание} |
| `{prop2}` | `{Type}` | ❌ | {Описание} |
| `on{Event}` | `(param: Type) => void` | ❌ | Callback при {событии} |

**Состояния:**

| Состояние | Условие | Отображение |
|---|---|---|
| `loading` | Загрузка данных | `role="status" aria-label="Загрузка"` + спиннер |
| `error` | Ошибка загрузки | `role="alert"` + сообщение об ошибке |
| `empty` | Нет данных | `EmptyState` с пояснением |
| `data` | Данные загружены | Основной контент |

**Поведение:**

- Загружает данные при mount через `use{Hook}(params)`
- При изменении фильтров — сброс состояния и повторная загрузка
- Клик по элементу — вызов `on{Event}`
- Кнопки блокируются при `loading === true`

**⚠️ Оценка:** ~{XX} строк — {в пределах 50 / превышает 50 — рекомендуется разбиение}

> **Если >50 строк, рекомендация по разбиению:**
>
> | Подкомпонент | Ответственность |
>
> |---|---|
>
> | `{Parent}` | Координация, состояния |
>
> | `{Parent}/{Part}` | Подответственность |

---

### 3.4 Hooks

---

#### 3.4.1 `use{Hook}`

| Параметр | Значение |
|---|---|
| **Файл** | `src/hooks/use{Hook}.ts` |
| **Действие** | 🆕 Создать |
| **Задача** | `{TASK-ID}` |
| **Трассировка** | US-XX AC-3 → FR-02 |

**Возвращает:**

| Поле | Тип | Описание |
|---|---|---|
| `data` | `{Entity}[]` | Загруженные данные |
| `loading` | `boolean` | Флаг загрузки |
| `error` | `string \| null` | Сообщение об ошибке |
| `refetch` | `() => void` | Функция перезагрузки |
| `pagination` | `{ page, limit, total }?` | Данные пагинации (если применимо) |

**Поведение:**

- Загружает данные при mount через `apiClient.get('{resource}')`
- Обновляет данные при изменении параметров
- Обработка cleanup в `useEffect` (отмена запроса при unmount)
- Debounce для поисковых запросов (300ms)

---

### 3.5 Pages

---

#### 3.5.1 `{Resource}Page`

| Параметр | Значение |
|---|---|
| **Файл** | `src/app/dashboard/{resource}/page.tsx` |
| **Действие** | 🆕 Создать |
| **Задача** | `{TASK-ID}` |
| **Трассировка** | US-XX AC-3 → FR-02 |

**Состав:**

| Компонент | Назначение |
|---|---|
| `<{Header}/>` | Заголовок страницы, действия |
| `<{Filters}/>` | Фильтры поиска (опционально) |
| `<{List}/>` | Список сущностей |
| `<{Detail}/>` | Детали (опционально, модалка/сайдбар) |

---

## 4. ✅ Чек-лист проверки

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

## 📖 Референсные примеры

> При создании скелетов ориентироваться на существующие паттерны:
>
> - **Компонент с JSDoc:** [`src/components/features/auth/LoginForm/LoginForm.tsx`](../../src/components/features/auth/LoginForm/LoginForm.tsx)
> - **Доменный слой:** [`src/domains/auth/`](../../src/domains/auth/)
> - **Правила API путей:** [`docs/rules/api-endpoint-rules.md`](../../docs/rules/api-endpoint-rules.md)
> - **Правило 50 строк:** Если компонент >50 строк логики — разбить на подкомпоненты
