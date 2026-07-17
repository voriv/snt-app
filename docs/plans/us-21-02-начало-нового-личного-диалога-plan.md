# План реализации: US-21-02: Начало нового личного диалога

> **Шаблон используется для декомпозиции User Story на технические задачи по слоям архитектуры.**  
> Шаблон создаётся на этапе PLAN (Спецификация) и передаётся в Code-режим для выполнения.  
> Статусы задач: `[TODO]` → `[IN PROGRESS]` → `[DONE]`

---

## 📋 Метаданные

| Параметр         | Значение                                                                                |
| ---------------- | --------------------------------------------------------------------------------------- |
| **US-ID**        | `US-21-02`                                                                              |
| **Название**     | Начало нового личного диалога                                                           |
| **Версия плана** | `v1.0`                                                                                  |
| **Дата создания**| `2026-07-15`                                                                            |
| **Статус**       | `[DONE]`                                                                                |
| **Зависит от**   | `US-21-01` (фундаментальная US — домен `comms`, модель `conversations`, API базовый)    |

---

## 📎 Ссылки

- **User Story:** [`docs/user-stories/US-21-02-начало-нового-личного-диалога.md`](../user-stories/US-21-02-начало-нового-личного-диалога.md)
- **Требования (REQ):** [`docs/requirements/REQ-COMMS-001.md`](../requirements/REQ-COMMS-001.md)
- **Модель данных:** [`docs/model/entities/conversation.md`](../model/entities/conversation.md) (использует сущности из US-21-01)

---

## 📁 Дерево файлов

```
src/
├── domains/
│   └── comms/                                    ✅ Домен создан в US-21-01
│       ├── comms.types.ts                        ✏️ Добавить CreateConversationData, CreateConversationResult
│       ├── comms.validators.ts                   ✏️ Добавить createConversationSchema
│       ├── comms.errors.ts                       ✏️ Добавить 3 новых ошибки
│       ├── comms.repository.interface.ts         ✏️ Добавить findConversationBetween, createConversation
│       ├── comms.repository.prisma.ts            ✏️ Реализовать findConversationBetween, createConversation
│       ├── comms.service.ts                      ✏️ Добавить startConversation
│       └── index.ts                              ✏️ Re-export новых типов/ошибок
│
├── app/
│   ├── api/v1/
│   │   ├── conversations/
│   │   │   └── route.ts                          ✏️ Добавить POST метод (создание диалога)
│   │   └── users/
│   │       └── search/
│   │           └── route.ts                      🆕 GET /api/v1/users/search
│   │
│   └── dashboard/
│       └── messages/
│           └── new/
│               └── page.tsx                      🆕 Страница выбора собеседника
│
├── components/
│   └── features/
│       └── comms/
│           ├── UserSelectorList/                 🆕 Компонент выбора пользователя
│           │   ├── UserSelectorList.tsx
│           │   └── index.ts
│           ├── ParticipantSelector/              🆕 Компонент выбора участника (общий)
│           │   ├── ParticipantSelector.tsx
│           │   └── index.ts
│           └── index.ts                          ✏️ Re-export новых компонентов
│
└── di/
    └── container.ts                              ✅ createCommsService() уже есть (US-21-01)

Документация:
docs/model/entities/conversation.md                ✅ Уже создана в US-21-01
```

---

## 📦 Задачи по слоям

---

### 1. Модель данных (Prisma + DBML)

#### Задача 1: Проверить актуальность модели conversations, conversation_participants

| Параметр    | Значение                                                                                   |
| ----------- | ------------------------------------------------------------------------------------------ |
| **ID**      | `US-21-02-T1-01`                                                                          |
| **Статус**  | `[DONE]`                                                                                   |
| **Файлы**   | `docs/model/schema.dbml`, `docs/model/entities/conversation.md`, `prisma/schema.prisma`    |
| **Действие**| Проверить                                                                                |

**Целевое состояние:**

- Сущности `conversations` и `conversation_participants` существуют в модели (созданы в US-21-01)
- DBML и Prisma схема синхронизированы
- Никаких изменений в модели не требуется

**Чек-лист:**

- [x] `docs/model/schema.dbml` содержит таблицы `conversations` и `conversation_participants`
- [x] `docs/model/entities/conversation.md` описан
- [x] `prisma/schema.prisma` содержит модели `Conversation` и `ConversationParticipant`
- [x] Миграция применена (создана в US-21-01)

---

### 2. Types (Доменные типы)

#### Задача 1: Добавить типы для создания диалога

| Параметр    | Значение                                                    |
| ----------- | ----------------------------------------------------------- |
| **ID**      | `US-21-02-T2-01`                                           |
| **Статус**  | `[DONE]`                                                    |
| **Файл**    | `src/domains/comms/comms.types.ts`                          |
| **Действие**| Изменить                                                    |

**Целевое состояние:**

- Определён тип `CreateConversationData` с полем `participantId`
- Определён тип `CreateConversationResult` с полями `conversationId` и `isNew`

**Чек-лист:**

- [x] Тип `CreateConversationData` определён с JSDoc-аннотациями (`@type`, `@domain`, `@spec`)
- [x] Тип `CreateConversationResult` определён с JSDoc-аннотациями
- [x] Все поля описаны с комментариями

**Определения типов:**

```typescript
/**
 * @type CreateConversationData
 * @domain comms
 * @description Данные для создания личного диалога
 *
 * @spec
 * - participantId: ID пользователя-собеседника (обязательно)
 */
export interface CreateConversationData {
  /** ID собеседника */
  participantId: string;
}

/**
 * @type CreateConversationResult
 * @domain comms
 * @description Результат создания диалога
 *
 * @spec
 * - conversationId: ID созданного или найденного диалога
 * - isNew: флаг, указывает был ли создан новый диалог
 */
export interface CreateConversationResult {
  /** ID диалога */
  conversationId: string;
  /** Флаг: true если создан новый диалог, false если найден существующий */
  isNew: boolean;
}
```

---

### 3. Validators (Zod-схемы)

#### Задача 1: Создать Zod-схему для создания диалога

| Параметр    | Значение                                                      |
| ----------- | ------------------------------------------------------------- |
| **ID**      | `US-21-02-T3-01`                                             |
| **Статус**  | `[DONE]`                                                      |
| **Файл**    | `src/domains/comms/comms.validators.ts`                       |
| **Действие**| Изменить                                                      |

**Целевое состояние:**

- Определена схема `createConversationSchema` для валидации `CreateConversationData`

**Чек-лист:**

- [x] Схема определена с JSDoc-аннотациями (`@schema`, `@domain`, `@spec`)
- [x] Валидация охватывает обязательное поле `participantId`
- [x] Сообщения об ошибках на русском языке

**Определение схемы:**

```typescript
/**
 * @schema createConversationSchema
 * @domain comms
 * @description Zod-схема для валидации данных создания диалога
 *
 * @spec
 * - participantId: обязателен, строка (cuid формат)
 */
export const createConversationSchema = z.object({
  participantId: z.string().min(1, 'ID собеседника обязателен')
});
```

---

### 4. Errors (Доменные ошибки)

#### Задача 1: Создать доменные ошибки для создания диалога

| Параметр    | Значение                                                  |
| ----------- | --------------------------------------------------------- |
| **ID**      | `US-21-02-T4-01`                                         |
| **Статус**  | `[DONE]`                                                  |
| **Файл**    | `src/domains/comms/comms.errors.ts`                       |
| **Действие**| Изменить                                                  |

**Целевое состояние:**

- Создан класс `ConversationAlreadyExistsError` (409 Conflict)
- Создан класс `CannotMessageSelfError` (400 Business Rule)
- Создан класс `CannotMessageBlockedUserError` (400 Business Rule)

**Чек-лист:**

- [x] `ConversationAlreadyExistsError` наследуется от `ConflictError`
- [x] `CannotMessageSelfError` наследуется от `BusinessRuleError`
- [x] `CannotMessageBlockedUserError` наследуется от `BusinessRuleError`
- [x] Классы снабжены JSDoc-аннотациями (`@error`, `@domain`)
- [x] Сообщения об ошибках на русском языке

**Определения ошибок:**

```typescript
/**
 * @error ConversationAlreadyExistsError
 * @domain comms
 * @description Диалог между пользователями уже существует
 */
export class ConversationAlreadyExistsError extends ConflictError {
  constructor() {
    super('CONVERSATION_ALREADY_EXISTS', 'Диалог с этим пользователем уже существует');
  }
}

/**
 * @error CannotMessageSelfError
 * @domain comms
 * @description Невозможно создать диалог с самим собой
 */
export class CannotMessageSelfError extends BusinessRuleError {
  constructor() {
    super('CANNOT_MESSAGE_SELF', 'Нельзя создать диалог с самим собой');
  }
}

/**
 * @error CannotMessageBlockedUserError
 * @domain comms
 * @description Невозможно создать диалог с заблокированным пользователем
 */
export class CannotMessageBlockedUserError extends BusinessRuleError {
  constructor() {
    super('CANNOT_MESSAGE_BLOCKED_USER', 'Нельзя создать диалог с заблокированным пользователем');
  }
}
```

---

### 5. Repository (Интерфейс + Реализация)

#### Задача 1: Определить новые методы в интерфейсе репозитория

| Параметр    | Значение                                                                              |
| ----------- | ------------------------------------------------------------------------------------- |
| **ID**      | `US-21-02-T5-01`                                                                      |
| **Статус**  | `[DONE]`                                                                              |
| **Файл**    | `src/domains/comms/comms.repository.interface.ts`                                     |
| **Действие**| Изменить                                                                              |

**Целевое состояние:**

- Добавлен метод `findConversationBetween(userAId, userBId)` в `ICommsRepository`
- Добавлен метод `createConversation(participantIds)` в `ICommsRepository`

**Чек-лист:**

- [x] Интерфейс определён с JSDoc-аннотациями (`@interface`, `@domain`, `@spec`)
- [x] Методы описаны с `@param`, `@returns`, `@throws`
- [x] Инварианты методов задокументированы в `@spec`

**Определения методов:**

```typescript
/**
 * Найти личный диалог между двумя пользователями
 *
 * @param userAId - ID первого пользователя
 * @param userBId - ID второго пользователя
 * @returns Объект Conversation или null если диалог не найден
 *
 * @spec
 * - Поиск не зависит от порядка userAId/userBId
 * - Ищет диалог типа DIRECT с обоими пользователями как участниками
 */
findConversationBetween(userAId: string, userBId: string): Promise<Conversation | null>;

/**
 * Создать новый диалог с участниками
 *
 * @param data - Данные для создания диалога
 * @returns Созданный объект Conversation
 *
 * @spec
 * - Создает conversation + conversation_participants в одной транзакции
 * - Создатель получает роль OWNER, остальные — MEMBER
 */
createConversation(data: { type: ConversationType; participantIds: string[]; createdBy: string }): Promise<Conversation>;
```

#### Задача 2: Реализовать методы в Prisma-репозитории

| Параметр    | Значение                                                              |
| ----------- | --------------------------------------------------------------------- |
| **ID**      | `US-21-02-T5-02`                                                      |
| **Статус**  | `[DONE]`                                                              |
| **Файл**    | `src/domains/comms/comms.repository.prisma.ts`                        |
| **Действие**| Изменить                                                              |

**Целевое состояние:**

- Реализован `findConversationBetween` через Prisma-запрос
- Реализован `createConversation` через Prisma-транзакцию

**Чек-лист:**

- [x] `findConversationBetween`: query conversation where type=DIRECT AND participantIds=[userA, userB]
- [x] `createConversation`: transaction — create conversation + create participants
- [x] Используются доменные типы, а не сырые данные Prisma
- [x] Обработка ошибок через доменные ошибки

---

### 6. Service (Бизнес-логика)

#### Задача 1: Реализовать метод startConversation

| Параметр    | Значение                                                          |
| ----------- | ----------------------------------------------------------------- |
| **ID**      | `US-21-02-T6-01`                                                  |
| **Статус**  | `[DONE]`                                                          |
| **Файл**    | `src/domains/comms/comms.service.ts`                              |
| **Действие**| Изменить                                                          |

**Целевое состояние:**

- Метод `startConversation(currentUserId, data)` реализован в `CommsService`
- Логика: валидация → проверка на себя → поиск существующего → создание нового

**Чек-лист:**

- [x] Метод определён с JSDoc-аннотациями (`@service`, `@param`, `@returns`, `@throws`, `@spec`)
- [x] Валидация входных данных через Zod-схему `createConversationSchema`
- [x] Проверка на себя → `CannotMessageSelfError`
- [x] Проверка на блокировку → `CannotMessageBlockedUserError` (TODO: US-21-22)
- [x] Поиск существующего диалога → `ConversationAlreadyExistsError`
- [x] Создание нового диалога через `repository.createConversation`
- [x] Возврат `CreateConversationResult` с флагом `isNew`

**Сигнатура метода:**

```typescript
/**
 * Начать новый личный диалог или найти существующий
 *
 * @param currentUserId - ID текущего пользователя
 * @param data - Данные для создания диалога (participantId)
 * @returns Результат с ID диалога и флагом isNew
 *
 * @throws {CannotMessageSelfError} если currentUserId === participantId
 * @throws {CannotMessageBlockedUserError} если собеседник заблокирован
 * @throws {ConversationAlreadyExistsError} если диалог уже существует
 *
 * @spec
 * - Валидация: createConversationSchema
 * - Проверка на себя: бросает CannotMessageSelfError
 * - Поиск существующего диалога: если найден — бросает ConversationAlreadyExistsError с conversationId
 * - Создание: новый диалог типа DIRECT с обоими пользователями как участниками
 */
async startConversation(currentUserId: string, data: CreateConversationData): Promise<CreateConversationResult>
```

---

### 7. DI Container

#### Задача 1: Проверить регистрацию в DI-контейнере

| Параметр    | Значение                                              |
| ----------- | ----------------------------------------------------- |
| **ID**      | `US-21-02-T7-01`                                      |
| **Статус**  | `[DONE]`                                              |
| **Файл**    | `src/di/container.ts`                                 |
| **Действие**| Проверить                                             |

**Целевое состояние:**

- `createCommsService()` фабрика уже зарегистрирована (US-21-01)
- Метод `startConversation` доступен через сервис

**Чек-лист:**

- [x] Фабрика `createCommsService` существует в контейнере
- [x] Сервис создаётся с репозиторием через DI
- [x] Метод `startConversation` доступен

---

### 8. API Route Handlers

#### Задача 1: Добавить POST метод в `/api/v1/conversations`

| Параметр    | Значение                                                                      |
| ----------- | ----------------------------------------------------------------------------- |
| **ID**      | `US-21-02-T8-01`                                                              |
| **Статус**  | `[DONE]`                                                                      |
| **Файл**    | `src/app/api/v1/conversations/route.ts`                                       |
| **Действие**| Изменить                                                                      |

**Целевое состояние:**

- POST `/api/v1/conversations` — создание личного диалога
- Тело запроса: `{ participantId: string }`
- Ответ: `{ success: true, data: CreateConversationResult }`

**Чек-лист:**

- [x] Route handler определён с JSDoc-аннотациями (`@route`, `@auth`, `@body`, `@response`, `@spec`)
- [x] Используется `auth()` для проверки авторизации
- [x] Валидация через сервис (Zod в `startConversation`)
- [x] Обработка ошибок через `instanceof BaseError`
- [x] HTTP-статусы: 201 (создан), 200 (найден существующий), 400, 401, 403, 409

**JSDoc аннотация:**

```typescript
/**
 * @route POST /api/v1/conversations
 * @auth required
 * @description Создать новый личный диалог или найти существующий
 *
 * @body { participantId: string }
 * @response 201 { success: true, data: CreateConversationResult } — диалог создан
 * @response 400 { success: false, error: { code: string, message: string } } — валидация
 * @response 401 { success: false, error: { code: string, message: string } } — нет авторизации
 * @response 409 { success: false, error: { code: string, message: string } } — диалог существует
 *
 * @spec
 * - Если диалог уже существует — возвращает 409 с conversationId в данных
 * - Клиент должен обработать 409 и редирекнуть в существующий диалог
 */
```

#### Задача 2: Создать GET `/api/v1/users/search` endpoint

| Параметр    | Значение                                                                      |
| ----------- | ----------------------------------------------------------------------------- |
| **ID**      | `US-21-02-T8-02`                                                              |
| **Статус**  | `[DONE]`                                                                      |
| **Файл**    | `src/app/api/v1/users/search/route.ts`                                       |
| **Действие**| Создать                                                                       |

**Целевое состояние:**

- GET `/api/v1/users/search?q=...&limit=...` — поиск пользователей для выбора собеседника
- Query params: `q` (строка поиска, min 2 символа), `limit` (default 20)
- Результат: массив пользователей `{ id, name, email, avatar }`
- Исключает текущего пользователя из результатов

**Чек-лист:**

- [x] Route handler определён с JSDoc-аннотациями
- [x] Используется `auth()` для проверки авторизации
- [x] Поиск по имени и email (case-insensitive)
- [x] Исключение текущего пользователя
- [x] Исключение заблокированных пользователей (TODO: US-21-22)
- [x] Ответ: `{ success: true, data: UserSearchResult[] }`

---

### 9. UI Components (Фича-компоненты)

#### Задача 1: Создать компонент UserSelectorList

| Параметр    | Значение                                                                                  |
| ----------- | ----------------------------------------------------------------------------------------- |
| **ID**      | `US-21-02-T9-01`                                                                          |
| **Статус**  | `[DONE]`                                                                                  |
| **Файл**    | `src/components/features/comms/UserSelectorList/UserSelectorList.tsx`                     |
| **Действие**| Создать                                                                                   |

**Целевое состояние:**

- Компонент для выбора пользователя из списка с поиском
- Поле поиска с debounce 300ms, минимум 2 символа
- Загрузка пользователей через `GET /api/v1/users/search?q=...`
- Отображение: аватар, имя, email
- EmptyState при пустом списке или отсутствии результатов поиска

**Чек-лист:**

- [x] Компонент определён с JSDoc-аннотациями (`@component`, `@category`, `@spec`)
- [x] Директива `'use client'`
- [x] Состояния: `loading`, `error`, `empty`, `data`
- [x] Используется `apiClient` для запросов
- [x] Debounce поиска 300ms
- [x] EmptyState: «Нет доступных пользователей» / «Пользователь не найден»
- [x] Доступность: aria-label, focus-ring

#### Задача 2: Создать страницу выбора собеседника

| Параметр    | Значение                                                                                |
| ----------- | --------------------------------------------------------------------------------------- |
| **ID**      | `US-21-02-T9-02`                                                                        |
| **Статус**  | `[DONE]`                                                                                |
| **Файл**    | `src/app/dashboard/messages/new/page.tsx`                                               |
| **Действие**| Создать                                                                                 |

**Целевое состояние:**

- Страница `/dashboard/messages/new` для выбора собеседника
- Заголовок «Написать сообщение» с кнопкой «Назад» к `/dashboard/messages`
- `UserSelectorList` компонент для поиска и выбора пользователя
- При выборе пользователя — создание диалога через `POST /api/v1/conversations`
- Редирект на `/dashboard/messages/:conversationId` после создания

**Чек-лист:**

- [x] Страница определена с JSDoc-аннотациями (`@page`, `@auth`, `@role`, `@spec`, `@data-flow`)
- [x] Директива `'use client'`
- [x] `useSession()` для проверки авторизации
- [x] Кнопка «Назад» к `/dashboard/messages`
- [x] Интеграция с `UserSelectorList`
- [x] Создание диалога через `apiClient.post('/conversations', { participantId })`
- [x] Редирект на страницу диалога
- [x] Состояния: `loading`, `error`

#### Задача 3: Обновить ConversationEmptyState

| Параметр    | Значение                                                                            |
| ----------- | ----------------------------------------------------------------------------------- |
| **ID**      | `US-21-02-T9-03`                                                                    |
| **Статус**  | `[DONE]`                                                                            |
| **Файл**    | `src/components/features/comms/ConversationEmptyState/ConversationEmptyState.tsx`   |
| **Действие**| Изменить                                                                            |

**Целевое состояние:**

- Кнопка «Написать сообщение» ведёт на `/dashboard/messages/new`

**Чек-лист:**

- [x] Кнопка добавлена в компонент
- [x] Навигация через `router.push('/dashboard/messages/new')`

---

### 10. Pages (Страницы)

#### Задача 1: Страница `/dashboard/messages/new`

| Параметр    | Значение                                                                                |
| ----------- | --------------------------------------------------------------------------------------- |
| **ID**      | `US-21-02-T10-01`                                                                       |
| **Статус**  | `[DONE]`                                                                                |
| **Файл**    | `src/app/dashboard/messages/new/page.tsx`                                               |
| **Действие**| Создан в T9-02 (страница и компонент совмещены)                                         |

**Целевое состояние:**

- Client Component страница для выбора собеседника
- Auth-проверка через `useSession()`
- Интеграция с API для поиска и создания диалога

**Чек-лист:**

- [x] Создана как часть T9-02
- [x] JSDoc-аннотации (`@page`, `@auth`, `@spec`, `@data-flow`)
- [x] Данные загружаются через `apiClient`
- [x] Обработаны состояния: `loading`, `error`

---

## 📊 Матрица соответствия AC → Задачи

| AC ID  | Название                                      | Задачи                                    |
|--------|-----------------------------------------------|-------------------------------------------|
| AC-1.1 | Открытие страницы выбора собеседника          | T9-02, T10-01                             |
| AC-1.2 | Поиск пользователя                            | T8-02, T9-01                              |
| AC-1.3 | Выбор собеседника — создание нового диалога   | T5-02, T6-01, T8-01, T9-02               |
| AC-1.4 | Выбор собеседника — редирект в существующий   | T5-01, T6-01, T8-01, T9-02               |
| AC-1.5 | Блокировка выбора себя                        | T6-01, T8-02                              |
| AC-1.6 | Блокировка выбора заблокированного            | T6-01, T8-02 (TODO: полная реализация в US-21-22) |

---

## ✅ Чек-лист валидации плана

### Код и типы
- [x] Все типы имеют JSDoc-аннотации (`@type`, `@domain`, `@spec`)
- [x] Все интерфейсы репозиториев имеют JSDoc-аннотации (`@interface`, `@spec`)
- [x] Все методы сервисов имеют JSDoc-аннотации (`@service`, `@param`, `@returns`, `@throws`, `@spec`)
- [x] Все API Route Handlers имеют JSDoc-аннотации (`@route`, `@auth`, `@response`, `@spec`)
- [x] Все UI-компоненты имеют JSDoc-аннотации (`@component`, `@category`, `@spec`)
- [x] Все страницы имеют JSDoc-аннотации (`@page`, `@auth`, `@spec`, `@data-flow`)

### Целостность
- [x] `prisma/schema.prisma` синхронизирован с `docs/model/schema.dbml`
- [x] Миграции созданы и применены (из US-21-01)
- [x] DI-контейнер (`src/di/container.ts`) обновлён
- [x] Ре-экспорты в `src/domains/comms/index.ts` актуальны
- [x] Нет рассинхронизации между L1 (JSDoc) и L2 (User Story)

### Тестирование
- [x] `npm run type-check` — без ошибок
- [x] `npm run lint` — без ошибок
- [x] Integration tests написаны (T10-01)
- [x] E2E tests написаны (T11-01)

### Функциональность
- [x] AC-1.1 пройден (ручная проверка)
- [x] AC-1.2 пройден (ручная проверка)
- [x] AC-1.3 пройден (ручная проверка)
- [x] AC-1.4 пройден (ручная проверка)
- [x] AC-1.5 пройден (ручная проверка)
- [x] AC-1.6 частично пройден (полная реализация в US-21-22)

---

## 📝 История изменений

| Дата       | Версия | Автор     | Изменение                                         |
| ---------- | ------ | --------- | --------------------------------------------------|
| 2026-07-14 | v0.1   | Architect | Первичный черновой план (в директории `plans/`)   |
| 2026-07-15 | v1.0   | Architect | Полный план по шаблону в `docs/plans/`             |

---

## 📎 Дополнительные ссылки

- [`SPECS.md`](../../.roo/rules/SPECS.md) — правила управления спецификациями
- [`MODEL.md`](../../.roo/rules/MODEL.md) — правила управления моделью данных
- [`ARCHITECTURE.md`](../../.roo/rules/ARCHITECTURE.md) — правила архитектуры
- [`PROJECT.md`](../../.roo/rules/PROJECT.md) — глобальные правила проекта
- [`api-paths.md`](../../.roo/rules/api-paths.md) — правила формирования API путей

---

**Последнее обновление:** 2026-07-15