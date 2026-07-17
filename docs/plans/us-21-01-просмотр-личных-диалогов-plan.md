# План реализации: US-21-01: Просмотр списка личных диалогов

> **Шаблон используется для декомпозиции User Story на технические задачи по слоям архитектуры.**
> Шаблон создаётся на этапе PLAN (Спецификация) и передаётся в Code-режим для выполнения.
> Статусы задач: `[TODO]` → `[IN PROGRESS]` → `[DONE]`

---

## 📋 Метаданные

| Параметр         | Значение                                        |
| ---------------- | ----------------------------------------------- |
| **US-ID**        | `US-21-01`                                      |
| **Название**     | Просмотр списка личных диалогов                 |
| **Версия плана** | `v1.0`                                          |
| **Дата создания**| `2026-07-13`                                    |
| **Статус**       | `[DONE]`                                        |
| **Зависит от**   | Нет (фундаментальная US — создаёт домен `comms`) |

---

## 📎 Ссылки

- **User Story:** [`docs/user-stories/US-21-01-просмотр-личных-диалогов.md`](../user-stories/US-21-01-просмотр-личных-диалогов.md)
- **Требования (REQ):** [`docs/requirements/REQ-COMMS-001.md`](../requirements/REQ-COMMS-001.md)
- **Модель данных:** `docs/model/entities/conversation.md` (создать)

---

## 📁 Дерево файлов

```
src/
├── domains/
│   └── comms/                                    🆕 Новый домен
│       ├── index.ts                              🆕 Публичный API домена
│       ├── comms.types.ts                        🆕 Типы сущностей
│       ├── comms.validators.ts                   🆕 Zod-схемы валидации
│       ├── comms.errors.ts                       🆕 Классы доменных ошибок
│       ├── comms.repository.interface.ts         🆕 Интерфейс репозитория
│       ├── comms.repository.prisma.ts            🆕 Реализация Prisma
│       └── comms.service.ts                      🆕 Бизнес-логика
│
├── app/
│   ├── api/v1/
│   │   └── conversations/                        🆕
│   │       └── route.ts                          🆕 GET /api/v1/conversations
│   │
│   └── dashboard/
│       └── messages/                             🆕
│           └── page.tsx                          🆕 Страница списка диалогов
│
├── components/
│   └── features/
│       └── comms/                                🆕
│           ├── ConversationList/
│           │   ├── ConversationList.tsx           🆕 Список диалогов
│           │   └── index.ts                      🆕
│           ├── ConversationCard/
│           │   ├── ConversationCard.tsx           🆕 Карточка диалога
│           │   └── index.ts                      🆕
│           └── index.ts                          🆕
│
└── di/
    └── container.ts                              ✏️ Добавить createCommsService()

Документация:
docs/model/entities/conversation.md                🆕 Описание сущности
docs/model/entities/message.md                    🆕 Описание сущности
docs/model/schema.dbml                            ✏️ Добавить таблицы
```

---

## 📦 Задачи по слоям

---

### 1. Модель данных (Prisma + DBML)

#### Задача 1: Создать сущности Conversation, ConversationParticipant, Message

| Параметр    | Значение                                                                     |
| ----------- | ---------------------------------------------------------------------------- |
| **ID**      | `US-21-01-T1`                                                                |
| **Статус**  | `[DONE]`                                                                     |
| **Файлы**   | `docs/model/schema.dbml`, `docs/model/entities/conversation.md`, `docs/model/entities/message.md`, `prisma/schema.prisma` |
| **Действие**| Создать                                                                      |

**Целевое состояние:**

- Созданы три сущности в модели данных: `conversations`, `conversation_participants`, `messages`
- Сущности описаны в DBML и Prisma-схеме
- Созданы markdown-описания сущностей
- Создана и применена миграция

**Сущность `conversations`:**

```prisma
model Conversation {
  id          String                      @id @default(cuid())
  type        ConversationType            @default(DIRECT)
  title       String?                     @map("title")
  plotId      String?                     @map("plot_id")
  createdBy   String                      @map("created_by")
  createdAt   DateTime                    @default(now()) @map("created_at")
  updatedAt  DateTime                    @updatedAt @map("updated_at")

  participants ConversationParticipant[]
  messages     Message[]

  @@map("conversations")
}

enum ConversationType {
  DIRECT        // Личный диалог
  GROUP         // Групповой чат
  ANNOUNCEMENT  // Чат обсуждения объявления
}
```

**Сущность `conversation_participants`:**

```prisma
model ConversationParticipant {
  id              String       @id @default(cuid())
  conversationId  String       @map("conversation_id")
  userId          String       @map("user_id")
  role            ParticipantRole @default(MEMBER)
  joinedAt        DateTime     @default(now()) @map("joined_at")
  lastReadAt      DateTime?    @map("last_read_at")

  conversation   Conversation @relation(fields: [conversationId], references: [id], onDelete: Cascade)

  @@unique([conversationId, userId])
  @@index([userId])
  @@map("conversation_participants")
}

enum ParticipantRole {
  OWNER
  ADMIN
  MEMBER
}
```

**Сущность `messages`:**

```prisma
model Message {
  id              String       @id @default(cuid())
  conversationId  String       @map("conversation_id")
  senderId        String       @map("sender_id")
  content         String       @map("content")
  replyToId      String?      @map("reply_to_id")
  isDeleted       Boolean      @default(false) @map("is_deleted")
  deletedBy       String?      @map("deleted_by")
  deletedAt       DateTime?    @map("deleted_at")
  createdAt       DateTime     @default(now()) @map("created_at")
  updatedAt       DateTime     @updatedAt @map("updated_at")

  conversation    Conversation @relation(fields: [conversationId], references: [id], onDelete: Cascade)

  @@index([conversationId, createdAt])
  @@map("messages")
}
```

**Чек-лист:**

- [ ] Обновлён `docs/model/schema.dbml` — добавлены таблицы `conversations`, `conversation_participants`, `messages`
- [ ] Создан `docs/model/entities/conversation.md` — описание сущности
- [ ] Создан `docs/model/entities/message.md` — описание сущности
- [ ] Обновлён `prisma/schema.prisma` с использованием `@map()` для snake_case
- [ ] Создана миграция: `npx prisma migrate dev --name "create-conversations-messages"`

---

### 2. Types (Доменные типы)

#### Задача 1: Определить типы для домена comms

| Параметр    | Значение                                  |
| ----------- | ----------------------------------------- |
| **ID**      | `US-21-01-T2-1`                           |
| **Статус**  | `[DONE]`                                  |
| **Файл**    | `src/domains/comms/comms.types.ts`        |
| **Действие**| Создать                                   |

**Целевое состояние:**

- Определены типы: `Conversation`, `ConversationParticipant`, `Message`, `ConversationListItem`
- `ConversationListItem` — DTO для отображения в списке диалогов

**Чек-лист:**

- [ ] Тип `Conversation` определён с JSDoc (`@type`, `@domain`, `@description`, `@spec`, `@see`)
- [ ] Тип `ConversationParticipant` определён с JSDoc
- [ ] Тип `Message` определён с JSDoc
- [ ] Тип `ConversationListItem` определён:
  ```typescript
  export interface ConversationListItem {
    conversationId: string;
    participantId: string;
    participantName: string;
    participantAvatar?: string;
    lastMessagePreview?: string;
    lastMessageAt: Date;
    unreadCount: number;
  }
  ```
- [ ] Все поля описаны с комментариями
- [ ] Указаны инварианты в `@spec`

---

### 3. Validators (Zod-схемы)

#### Задача 1: Создать Zod-схемы для запросов

| Параметр    | Значение                                      |
| ----------- | --------------------------------------------- |
| **ID**      | `US-21-01-T3-1`                               |
| **Статус**  | `[DONE]`                                      |
| **Файл**    | `src/domains/comms/comms.validators.ts`      |
| **Действие**| Создать                                       |

**Целевое состояние:**

- Создана Zod-схема `getConversationsQuerySchema` для валидации query-параметров
- Создана Zod-схема `conversationListItemSchema` для валидации ответов

**Чек-лист:**

- [ ] `getConversationsQuerySchema` — валидирует опциональные параметры: `search?: string`, `limit?: number`
- [ ] `conversationListItemSchema` — валидирует структуру `ConversationListItem`
- [ ] Сообщения об ошибках на русском языке
- [ ] JSDoc: `@schema`, `@domain`, `@spec`

---

### 4. Errors (Доменные ошибки)

#### Задача 1: Создать классы доменных ошибок

| Параметр    | Значение                                  |
| ----------- | ----------------------------------------- |
| **ID**      | `US-21-01-T4-1`                           |
| **Статус**  | `[DONE]`                           |
| **Файл**    | `src/domains/comms/comms.errors.ts`       |
| **Действие**| Создать                                    |

**Целевое состояние:**

- Создан `CommsAccessForbiddenError` — наследуется от `ForbiddenError`, код `COMMS_ACCESS_FORBIDDEN`

**Чек-лист:**

- [ ] Класс ошибки наследуется от `ForbiddenError`
- [ ] Класс снабжён JSDoc (`@error`, `@domain`, `@description`)
- [ ] Сообщение об ошибке на русском языке
- [ ] HTTP-статус указан в конструкторе (403)

---

### 5. Repository (Интерфейс + Реализация)

#### Задача 1: Определить интерфейс репозитория

| Параметр    | Значение                                              |
| ----------- | ----------------------------------------------------- |
| **ID**      | `US-21-01-T5-1`                                       |
| **Статус**  | `[DONE]`                                               |
| **Файл**    | `src/domains/comms/comms.repository.interface.ts`     |
| **Действие**| Создать                                                |

**Целевое состояние:**

- Определён интерфейс `ICommsRepository` с методом `getUserConversations`

**Чек-лист:**

- [ ] Интерфейс определён с JSDoc (`@interface`, `@domain`, `@spec`)
- [ ] Метод `getUserConversations(userId: string)` описан с `@param`, `@returns`, `@throws`
- [ ] Инвариант: возвращает только диалоги, где пользователь является участником

#### Задача 2: Реализовать репозиторий на Prisma

| Параметр    | Значение                                          |
| ----------- | ------------------------------------------------- |
| **ID**      | `US-21-01-T5-2`                                   |
| **Статус**  | `[DONE]`                                           |
| **Файл**    | `src/domains/comms/comms.repository.prisma.ts`    |
| **Действие**| Создать                                            |

**Целевое состояние:**

- Реализован метод `getUserConversations(userId)` — Prisma-запрос с JOIN:
  - `conversations` + `conversation_participants` + `messages` (последнее) + `users` (собеседник)
  - Фильтр: `type = 'DIRECT'` и `userId` в participants
  - Сортировка: по `lastMessageAt DESC`
  - Вычисление `unreadCount`: количество сообщений после `lastReadAt`

**Чек-лист:**

- [ ] Метод реализован с Prisma `findMany` + `include`
- [ ] Используются доменные типы, а не сырые данные Prisma
- [ ] `unreadCount` вычисляется через подсчёт сообщений после `lastReadAt`
- [ ] `lastMessagePreview` обрезается до 60 символов
- [ ] Обработка ошибок через доменные ошибки

---

### 6. Service (Бизнес-логика)

#### Задача 1: Реализовать CommsService

| Параметр    | Значение                              |
| ----------- | ------------------------------------- |
| **ID**      | `US-21-01-T6-1`                       |
| **Статус**  | `[DONE]`                               |
| **Файл**    | `src/domains/comms/comms.service.ts`  |
| **Действие**| Создать                                |

**Целевое состояние:**

- Реализован метод `getUserConversations(userId: string): Promise<ConversationListItem[]>`
- Сервис получает репозиторий через DI

**Чек-лист:**

- [ ] Класс `CommsService` определён с JSDoc (`@service`, `@domain`, `@spec`)
- [ ] Метод `getUserConversations` имеет JSDoc (`@param`, `@returns`, `@throws`, `@spec`)
- [ ] Конструктор принимает `ICommsRepository` через DI
- [ ] Метод не превышает 50 строк
- [ ] Валидация `userId` через Zod (cuid)
- [ ] Скелет: `throw new Error('Not implemented')` заменён на реальную логику

---

### 7. DI Container

#### Задача 1: Зарегистрировать CommsService в DI-контейнере

| Параметр    | Значение                    |
| ----------- | --------------------------- |
| **ID**      | `US-21-01-T7-1`             |
| **Статус**  | `[DONE]`                     |
| **Файл**    | `src/di/container.ts`       |
| **Действие**| Изменить                     |

**Целевое состояние:**

- Фабрика `createCommsService()` зарегистрирована в контейнере
- Используется singleton-паттерн

**Чек-лист:**

- [ ] Фабрика `createCommsService()` создана
- [ ] Используется singleton-паттерн
- [ ] Репозиторий создаётся внутри фабрики и передаётся в сервис
- [ ] Фабрика экспортирована

---

### 8. API Route Handlers

#### Задача 1: Создать GET /api/v1/conversations

| Параметр    | Значение                                       |
| ----------- | ---------------------------------------------- |
| **ID**      | `US-21-01-T8-1`                                |
| **Статус**  | `[DONE]`                                        |
| **Файл**    | `src/app/api/v1/conversations/route.ts`        |
| **Действие**| Создать                                         |

**Целевое состояние:**

- Endpoint `GET /api/v1/conversations` возвращает список личных диалогов текущего пользователя
- Требует авторизации через `auth()`
- Возвращает стандартизированный ответ `{ success: true, data: ConversationListItem[] }`

**Чек-лист:**

- [ ] Route handler определён с JSDoc (`@route`, `@auth`, `@response`, `@spec`)
- [ ] Используется `auth()` для проверки авторизации
- [ ] Получение `userId` из сессии
- [ ] Вызов `CommsService.getUserConversations(userId)` через DI
- [ ] Обработка ошибок через `instanceof BaseError`
- [ ] Возврат стандартизированного ответа: `{ success: true, data: ConversationListItem[] }`
- [ ] HTTP-статусы: 200 (успех), 401 (не авторизован), 500 (внутренняя ошибка)

---

### 9. UI Components (Фича-компоненты)

#### Задача 1: Создать ConversationCard

| Параметр    | Значение                                                          |
| ----------- | ----------------------------------------------------------------- |
| **ID**      | `US-21-01-T9-1`                                                   |
| **Статус**  | `[DONE]`                                                           |
| **Файл**    | `src/components/features/comms/ConversationCard/ConversationCard.tsx` |
| **Действие**| Создать                                                            |

**Целевое состояние:**

- Карточка диалога: аватар собеседника, имя, превью сообщения, время, бейдж непрочитанных
- Кликабельная — переход к диалогу

**Чек-лист:**

- [ ] JSDoc: `@component`, `@category features/comms`, `@spec`
- [ ] Директива `'use client'`
- [ ] Props: `conversation: ConversationListItem`, `onClick: (id: string) => void`
- [ ] Аватар: если нет — заглушка (инициалы)
- [ ] Имя: при длинном имени — `text-ellipsis`
- [ ] Превью: обрезано до 60 символов
- [ ] Время: отформатировано (например, "14:30" или "вчера")
- [ ] Бейдж непрочитанных: только если `unreadCount > 0`
- [ ] `useCallback` для обработчика клика
- [ ] Доступность: `aria-label`, `role="button"`, `tabIndex={0}`

#### Задача 2: Создать ConversationList

| Параметр    | Значение                                                        |
| ----------- | --------------------------------------------------------------- |
| **ID**      | `US-21-01-T9-2`                                                 |
| **Статус**  | `[DONE]`                                                         |
| **Файл**    | `src/components/features/comms/ConversationList/ConversationList.tsx` |
| **Действие**| Создать                                                          |

**Целевое состояние:**

- Список карточек диалогов с полем поиска
- Состояния: loading, error, empty, success
- Клиентский поиск по имени собеседника (debounce 300ms)

**Чек-лист:**

- [ ] JSDoc: `@component`, `@category features/comms`, `@spec`
- [ ] Директива `'use client'`
- [ ] Загрузка через `apiClient.get('/conversations')`
- [ ] Состояния: `isLoading`, `error`, `conversations`
- [ ] `EmptyState` когда список пуст — текст «У вас пока нет диалогов»
- [ ] Индикатор загрузки: «Загрузка диалогов...»
- [ ] Обработка ошибок: сообщение + кнопка «Повторить»
- [ ] Поле поиска: debounce 300ms, фильтрация по имени собеседника
- [ ] `useCallback` для всех обработчиков
- [ ] Сортировка: по `lastMessageAt` DESC
- [ ] Клик по карточке → `router.push('/dashboard/messages/' + conversationId)`

---

### 10. Pages (Страницы)

#### Задача 1: Создать страницу /dashboard/messages

| Параметр    | Значение                                    |
| ----------- | ------------------------------------------- |
| **ID**      | `US-21-01-T10-1`                            |
| **Статус**  | `[DONE]`                                     |
| **Файл**    | `src/app/dashboard/messages/page.tsx`       |
| **Действие**| Создать                                      |

**Целевое состояние:**

- Страница списка личных диалогов
- Использует `ConversationList` компонент
- Проверка авторизации через `useSession()`

**Чек-лист:**

- [ ] JSDoc: `@page /dashboard/messages`, `@auth required`, `@role MEMBER, ADMIN, SUPER_ADMIN`, `@spec`, `@data-flow`
- [ ] Директива `'use client'`
- [ ] `useSession()` для проверки авторизации
- [ ] Редирект на `/login` при отсутствии сессии (с задержкой 100ms)
- [ ] Рендер `ConversationList`
- [ ] Заголовок страницы: «Сообщения»

---

## 📊 Матрица соответствия AC → Задачи

| AC | Описание | Задача | Статус |
|----|----------|--------|--------|
| AC-1.1 | Загрузка списка диалогов | US-21-01-T8-1, US-21-01-T9-2 | `[DONE]` |
| AC-1.2 | Структура карточки диалога | US-21-01-T9-1 | `[DONE]` |
| AC-1.3 | Переход к диалогу | US-21-01-T9-1, US-21-01-T9-2 | `[DONE]` |
| AC-1.4 | Сортировка по времени | US-21-01-T5-2, US-21-01-T9-2 | `[DONE]` |
| AC-1.5 | Поиск на клиенте | US-21-01-T9-2 | `[DONE]` |
| AC-1.6 | Бейдж в навбаре | US-21-01-T9-2 (опционально) | `[DONE]` |
| EC-1 | Нет диалогов → EmptyState | US-21-01-T9-2 | `[DONE]` |
| EC-3 | Собеседник удалён → «Удалённый пользователь» | US-21-01-T5-2, US-21-01-T9-1 | `[DONE]` |
| EC-4 | Медленная сеть → индикатор загрузки | US-21-01-T9-2 | `[DONE]` |
| EC-5 | Ошибка загрузки → кнопка «Повторить» | US-21-01-T9-2 | `[DONE]` |

---

## ✅ Чек-лист валидации плана

### Код и типы
- [ ] Все типы имеют JSDoc-аннотации (`@type`, `@domain`, `@spec`)
- [ ] Все интерфейсы репозиториев имеют JSDoc-аннотации (`@interface`, `@spec`)
- [ ] Все методы сервисов имеют JSDoc-аннотации (`@service`, `@param`, `@returns`, `@throws`, `@spec`)
- [ ] Все API Route Handlers имеют JSDoc-аннотации (`@route`, `@auth`, `@response`, `@spec`)
- [ ] Все UI-компоненты имеют JSDoc-аннотации (`@component`, `@category`, `@spec`)
- [ ] Все страницы имеют JSDoc-аннотации (`@page`, `@auth`, `@spec`, `@data-flow`)

### Целостность
- [ ] `prisma/schema.prisma` синхронизирован с `docs/model/schema.dbml`
- [ ] Миграции созданы и применены: `npx prisma migrate dev`
- [ ] DI-контейнер (`src/di/container.ts`) обновлён с новыми фабриками
- [ ] Ре-экспорты в `src/domains/comms/index.ts` актуальны
- [ ] Нет рассинхронизации между L1 (JSDoc) и L2 (User Story)

### Тестирование
- [ ] `npm run type-check` — без ошибок
- [ ] `npm run lint` — без ошибок
- [ ] `npm run test` — все тесты проходят

### Функциональность
- [ ] AC-1.1 пройден (ручная проверка)
- [ ] AC-1.2 пройден (ручная проверка)
- [ ] AC-1.3 пройден (ручная проверка)
- [ ] AC-1.4 пройден (ручная проверка)
- [ ] AC-1.5 пройден (ручная проверка)
- [ ] AC-1.6 пройден (ручная проверка)
- [ ] Нет 500, 404, 400 ошибок в консоли при нормальной работе
- [ ] Ошибки обрабатываются корректно (401, 500 и т.д.)

---

## 📝 История изменений

| Версия | Дата       | Автор     | Изменения                              |
|--------|------------|-----------|----------------------------------------|
| v1.0   | 2026-07-13 | Architect | Создание плана реализации              |
| v1.1   | 2026-07-14 | Architect | Все задачи выполнены, реализация завершена |
| v1.2   | 2026-07-15 | Architect | Проверка спецификации, актуализация US-21-01 |

---

## 📎 Дополнительные ссылки

- [`SPECS.md`](../../.roo/rules/SPECS.md) — правила управления спецификациями
- [`MODEL.md`](../../.roo/rules/MODEL.md) — правила управления моделью данных
- [`ARCHITECTURE.md`](../../.roo/rules/ARCHITECTURE.md) — правила архитектуры
- [`PROJECT.md`](../../.roo/rules/PROJECT.md) — глобальные правила проекта
