# Спецификация компонент: Отметка прочитанных и Read Receipts (B-026)

> **Назначение:** Спецификация компонент и скелетов кода для [B-026](../../plans/REQ-COMMS-003-realization-plan.md)  
> **Создано:** `component-spec` режим  
> **Статус:** `[DRAFT]`

---

## 1. 📋 Метаданные

| Параметр | Значение |
|---|---|
| **Feature** | `comms-read-receipts` |
| **План реализации** | [`docs/plans/REQ-COMMS-003-realization-plan.md`](../../plans/REQ-COMMS-003-realization-plan.md) |
| **User Stories** | [US-39-01](../../user-stories/US-39-01-автоматическая-отметка-прочитанных.md), [US-39-02](../../user-stories/US-39-02-read-receipts.md), [US-21-37](../../user-stories/US-21-37-счетчики-непрочитанных-на-вкладках.md) |
| **Требования** | REQ-COMMS-003 |
| **Модель данных** | Без изменений (`ConversationParticipant.lastReadAt` уже существует) |
| **Предыдущая спецификация** | [`docs/specs/comms/B-025-component-spec.md`](./B-025-component-spec.md) |
| **Макет** | [`docs/design/layouts/comms/read-receipts-layout.md`](../../design/layouts/comms/read-receipts-layout.md) |
| **Версия** | `v1.0` |
| **Дата** | `2026-08-03` |
| **Статус** | `[DRAFT]` |

---

## 2. 📊 Матрица трассировки

> Каждая строка связывает компонент с требованиями.  
> Действия: 🆕 — создать файл, ✏️ — добавить в существующий, 🔧 — изменить существующее.

| # | Компонент | Слой | Действие | US | AC | Задача | Статус |
|---|---|---|---|---|---|---|---|
| 1 | `MessageWithReadStatus` | Domain/Types | ✏️ | US-39-02 | AC-1, AC-2, AC-3, AC-6 | B-026-T1-1 | `[TODO]` |
| 2 | `ParticipantNotFoundError` | Domain/Errors | ✏️ | US-39-01 | AC-4 | B-026-T1-2 | `[TODO]` |
| 3 | `markAsReadSchema` | Domain/Validators | ✏️ | US-39-01 | AC-4 | B-026-T3-1 | `[TODO]` |
| 4 | `markAsRead()` в `ICommsRepository` | Domain/Repository | ✏️ | US-39-01 | AC-1, AC-2, AC-4 | B-026-T2-1 | `[TODO]` |
| 5 | `getMessagesWithReadStatus()` в `ICommsRepository` | Domain/Repository | ✏️ | US-39-02 | AC-1, AC-2, AC-3, AC-6 | B-026-T2-1 | `[TODO]` |
| 6 | `markAsRead()` в `CommsRepositoryPrisma` | Domain/Repository | ✏️ | US-39-01 | AC-1, AC-2, AC-4 | B-026-T2-2 | `[TODO]` |
| 7 | `getMessagesWithReadStatus()` в `CommsRepositoryPrisma` | Domain/Repository | ✏️ | US-39-02 | AC-1, AC-2, AC-3, AC-6 | B-026-T2-2 | `[TODO]` |
| 8 | `markConversationAsRead()` в `CommsService` | Domain/Service | ✏️ | US-39-01 | AC-1, AC-2, AC-4 | B-026-T3-2 | `[TODO]` |
| 9 | `getMessagesWithReadStatus()` в `CommsService` | Domain/Service | ✏️ | US-39-02 | AC-1, AC-2, AC-3, AC-6 | B-026-T3-2 | `[TODO]` |
| 10 | `PATCH /conversations/:id/read` | API | 🆕 | US-39-01 | AC-1, AC-4 | B-026-T4-1 | `[TODO]` |
| 11 | `PATCH /chats/:id/read` | API | 🆕 | US-39-01 | AC-2, AC-4 | B-026-T4-2 | `[TODO]` |
| 12 | `GET /conversations/:id/messages` с read status | API | 🔧 | US-39-02 | AC-1, AC-2, AC-3, AC-6 | B-026-T4-3 | `[TODO]` |
| 13 | `useMarkAsRead` | Hook | 🆕 | US-39-01 | AC-1, AC-2, AC-4, AC-5, AC-6 | B-026-T5-1 | `[TODO]` |
| 14 | `ReadReceiptIcon` | UI | 🆕 | US-39-02 | AC-1, AC-2, AC-3, AC-6, AC-7 | B-026-T5-2 | `[TODO]` |
| 15 | `MessageItem` — добавить read receipts | UI | 🔧 | US-39-02 | AC-1, AC-2, AC-3, AC-5, AC-6 | B-026-T5-3 | `[TODO]` |
| 16 | `ConversationMessagesList` — проброс read status | UI | 🔧 | US-39-02 | AC-1, AC-2, AC-3, AC-6 | B-026-T5-4 | `[TODO]` |
| 17 | `CommsTabs` — refetch механизм | UI | 🔧 | US-21-37 | AC-5, AC-7 | B-026-T5-5 | `[TODO]` |
| 18 | `messages/[conversationId]/page.tsx` — markAsRead | Page | 🔧 | US-39-01 | AC-1, AC-4, AC-5 | B-026-T6-1 | `[TODO]` |
| 19 | `chats/[chatId]/page.tsx` — markAsRead | Page | 🔧 | US-39-01 | AC-2 | B-026-T6-2 | `[TODO]` |
| 20 | Refetch счётчиков в страницах | Page | 🔧 | US-21-37 | AC-5, AC-7 | B-026-T6-3 | `[TODO]` |

### Проверка покрытия AC

#### US-39-01 (Автоматическая отметка прочитанных)

| AC | Описание | Покрыт в строке | Статус |
|---|---|---|---|
| AC-1 | Отметка при открытии личного диалога | #4, #6, #8, #10, #13, #18 | ✅ |
| AC-2 | Отметка при открытии группового чата | #4, #6, #8, #11, #13, #19 | ✅ |
| AC-3 | Свои сообщения не влияют на счётчик | ✅ Уже реализовано | ✅ |
| AC-4 | Идемпотентность вызова API | #2, #3, #4, #6, #8, #10, #11, #13 | ✅ |
| AC-5 | Обновление счётчиков на вкладках | #13, #17, #20 | ✅ |
| AC-6 | Ошибка сети не блокирует интерфейс | #13 (silent fail) | ✅ |

#### US-39-02 (Read Receipts)

| AC | Описание | Покрыт в строке | Статус |
|---|---|---|---|
| AC-1 | Одна галочка — доставлено | #1, #5, #7, #9, #12, #14, #15 | ✅ |
| AC-2 | Две галочки — прочитано | #1, #5, #7, #9, #12, #14, #15 | ✅ |
| AC-3 | Счётчик прочитавших в GROUP | #1, #5, #7, #9, #12, #14, #15 | ✅ |
| AC-4 | Статус обновляется при перезагрузке | #5, #7, #9, #12 | ✅ |
| AC-5 | Сообщения собеседника без индикатора | #15, #16 | ✅ |
| AC-6 | Нулевой счётчик прочитавших в GROUP | #1, #5, #7, #14, #15 | ✅ |
| AC-7 | aria-label для скринридеров | #14 | ✅ |

#### US-21-37 (Счётчики на вкладках) — часть, затрагиваемая B-026

| AC | Описание | Покрыт в строке | Статус |
|---|---|---|---|
| AC-1 | Бейдж на «Личные сообщения» | ✅ Уже реализовано | ✅ |
| AC-2 | Бейдж на «Групповые чаты» | ✅ Уже реализовано | ✅ |
| AC-3 | Скрытие бейджа при 0 | ✅ Уже реализовано | ✅ |
| AC-4 | Нет бейджа на «Объявления» | ✅ Уже реализовано | ✅ |
| AC-5 | Обновление счётчика после прочтения | #13, #17, #20 | ✅ |
| AC-5a | Обновление бейджа карточки | #13, #20 | ✅ |
| AC-5b | Обновление счётчика GROUP после прочтения | #13, #20 | ✅ |
| AC-5c | Скрытие бейджа при достижении нуля | #13, #17, #20 | ✅ |
| AC-6 | Загрузка счётчиков при открытии | ✅ Уже реализовано | ✅ |
| AC-7 | Refetch после markAsRead | #13, #17, #20 | ✅ |
| AC-8 | «99+» при > 99 | ✅ Уже реализовано | ✅ |

**Все AC покрыты.** Нет непокрытых критериев приёмки.

---

## 3. 🏗️ Спецификация по слоям

---

### 3.1 Domain Layer

---

#### 3.1.1 `MessageWithReadStatus` — тип сообщения со статусом прочтения

| Параметр | Значение |
|---|---|
| **Файл** | [`src/domains/comms/comms.types.ts`](../../../src/domains/comms/comms.types.ts) |
| **Действие** | ✏️ Добавить тип |
| **Задача** | B-026-T1-1 |
| **Трассировка** | US-39-02 AC-1, AC-2, AC-3, AC-6 → T1-1 |

**Интерфейс:**

| Интерфейс | Описание | Поля (дополнительно к Message) |
|---|---|---|
| `MessageWithReadStatus` | Сообщение с информацией о статусе прочтения | `isReadByRecipient`, `readByCount?`, `totalParticipants?` |

**Полное определение типа:**

```typescript
/**
 * @type MessageWithReadStatus
 * @domain comms
 * @description Сообщение с информацией о статусе прочтения
 *
 * Для DIRECT:
 *   - isReadByRecipient: boolean — прочитал ли собеседник
 *
 * Для GROUP:
 *   - readByCount: number — количество прочитавших
 *   - totalParticipants: number — общее число получателей кроме автора
 *
 * @spec
 * - isReadByRecipient вычисляется как participant.lastReadAt >= message.createdAt
 * - readByCount = COUNT(participants WHERE lastReadAt >= createdAt AND userId != senderId)
 * - totalParticipants = COUNT(participants WHERE userId != senderId)
 * - Автор исключён из totalParticipants (BR-07)
 *
 * @traces US-39-02 AC-1, AC-2, AC-3, AC-6
 * @task B-026-T1-1
 *
 * @see docs/user-stories/US-39-02-read-receipts.md
 */
export interface MessageWithReadStatus {
  id: string;
  conversationId: string;
  senderId: string;
  senderName?: string;
  senderEmail?: string;
  senderAvatarUrl?: string | null;
  content: string;
  replyToId: string | null;
  isDeleted: boolean;
  deletedBy: string | null;
  deletedAt: Date | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  /** Сообщение прочитано получателем (для DIRECT) */
  isReadByRecipient: boolean;
  /** Количество прочитавших (для GROUP) */
  readByCount?: number;
  /** Общее число получателей кроме автора (для GROUP) */
  totalParticipants?: number;
}
```

**Инварианты:**

- `isReadByRecipient` всегда определён (для DIRECT и GROUP)
- `readByCount` / `totalParticipants` определены только для GROUP
- `totalParticipants` не включает автора сообщения (BR-07)

---

#### 3.1.2 `ParticipantNotFoundError` — ошибка отсутствия участника

| Параметр | Значение |
|---|---|
| **Файл** | [`src/domains/comms/comms.errors.ts`](../../../src/domains/comms/comms.errors.ts) |
| **Действие** | ✏️ Добавить класс |
| **Задача** | B-026-T1-2 |
| **Трассировка** | US-39-01 AC-4 → T1-2 |

**Класс ошибки:**

| Класс | Наследуется от | Сценарий | HTTP Status | Сообщение |
|---|---|---|---|---|
| `ParticipantNotFoundError` | `NotFoundError` | Пользователь не является участником диалога/чата | 404 | `"Участник не найден в диалоге {conversationId} для пользователя {userId}"` |

```typescript
/**
 * @error ParticipantNotFoundError
 * @domain comms
 * @description Участник диалога не найден — пользователь не является участником
 *
 * @traces US-39-01 AC-4
 * @task B-026-T1-2
 */
export class ParticipantNotFoundError extends NotFoundError {
  constructor(conversationId: string, userId: string) {
    super(`Участник не найден в диалоге ${conversationId} для пользователя ${userId}`);
    this.name = 'ParticipantNotFoundError';
  }
}
```

---

#### 3.1.3 `markAsReadSchema` — Zod-схема валидации

| Параметр | Значение |
|---|---|
| **Файл** | [`src/domains/comms/comms.validators.ts`](../../../src/domains/comms/comms.validators.ts) |
| **Действие** | ✏️ Добавить схему |
| **Задача** | B-026-T3-1 |
| **Трассировка** | US-39-01 AC-4 → T3-1 |

```typescript
/**
 * @schema markAsReadSchema
 * @domain comms
 * @description Валидация ID диалога для отметки прочитанных
 *
 * @traces US-39-01 AC-4
 * @task B-026-T3-1
 */
export const markAsReadSchema = z.object({
  id: z.string().uuid('Некорректный ID диалога'),
});
```

---

#### 3.1.4 `ICommsRepository` — новые методы

| Параметр | Значение |
|---|---|
| **Файл** | [`src/domains/comms/comms.repository.interface.ts`](../../../src/domains/comms/comms.repository.interface.ts) |
| **Действие** | ✏️ Добавить методы |
| **Задача** | B-026-T2-1 |
| **Трассировка** | US-39-01 AC-1, AC-2, AC-4; US-39-02 AC-1..3, AC-6 |

**Методы:**

| Метод | Параметры | Возврат | Описание |
|---|---|---|---|
| `markAsRead` | `conversationId: string, userId: string` | `Promise<void>` | Отметить все сообщения как прочитанные для пользователя. Бросает `ParticipantNotFoundError` если пользователь не участник |
| `getMessagesWithReadStatus` | `conversationId: string, userId: string` | `Promise<MessageWithReadStatus[]>` | Получить сообщения со статусом прочтения. Для DIRECT: `isReadByRecipient`. Для GROUP: `readByCount` / `totalParticipants` |

**Интерфейсные декларации:**

```typescript
/**
 * Отметить все сообщения в диалоге как прочитанные для пользователя
 *
 * @param conversationId - ID диалога
 * @param userId - ID пользователя
 * @throws ParticipantNotFoundError если пользователь не участник
 *
 * @spec
 * - Проверка существования participant (conversationId, userId)
 * - UPDATE conversation_participants SET last_read_at = now()
 * - Идемпотентно: повторный вызов не ошибается (AC-4)
 *
 * @traces US-39-01 AC-1, AC-2, AC-4
 * @task B-026-T2-1
 */
markAsRead(conversationId: string, userId: string): Promise<void>;

/**
 * Получить сообщения диалога со статусом прочтения
 *
 * @param conversationId - ID диалога
 * @param userId - ID текущего пользователя
 *
 * @spec
 * - Для DIRECT: isReadByRecipient = recipient.lastReadAt >= message.createdAt
 * - Для GROUP: readByCount = COUNT(participants WHERE lastReadAt >= createdAt)
 * - Для GROUP: totalParticipants = COUNT(participants WHERE userId != senderId)
 * - Фильтр is_deleted = false
 * - Сортировка по createdAt ASC
 *
 * @traces US-39-02 AC-1, AC-2, AC-3, AC-6
 * @task B-026-T2-1
 */
getMessagesWithReadStatus(conversationId: string, userId: string): Promise<MessageWithReadStatus[]>;
```

---

#### 3.1.5 `CommsRepositoryPrisma` — реализация новых методов

| Параметр | Значение |
|---|---|
| **Файл** | [`src/domains/comms/comms.repository.prisma.ts`](../../../src/domains/comms/comms.repository.prisma.ts) |
| **Действие** | ✏️ Добавить методы |
| **Задача** | B-026-T2-2 |
| **Трассировка** | US-39-01 AC-1, AC-2, AC-4; US-39-02 AC-1..3, AC-6 |

```typescript
/**
 * @traces US-39-01 AC-1, AC-2, AC-4
 * @task B-026-T2-2
 */
async markAsRead(conversationId: string, userId: string): Promise<void> {
  throw new Error('[TODO] markAsRead — реализовать через Prisma: проверить participant + UPDATE lastReadAt — B-026-T2-2');
}

/**
 * @traces US-39-02 AC-1, AC-2, AC-3, AC-6
 * @task B-026-T2-2
 */
async getMessagesWithReadStatus(conversationId: string, userId: string): Promise<MessageWithReadStatus[]> {
  throw new Error('[TODO] getMessagesWithReadStatus — реализовать через Prisma: SELECT messages + JOIN participants для статуса — B-026-T2-2');
}
```

---

#### 3.1.6 `CommsService` — новые методы

| Параметр | Значение |
|---|---|
| **Файл** | [`src/domains/comms/comms.service.ts`](../../../src/domains/comms/comms.service.ts) |
| **Действие** | ✏️ Добавить методы |
| **Задача** | B-026-T3-2 |
| **Трассировка** | US-39-01 AC-1, AC-2, AC-4; US-39-02 AC-1..3, AC-6 |

**Методы:**

```typescript
/**
 * Отметить диалог как прочитанный для пользователя
 *
 * @param conversationId - ID диалога
 * @param userId - ID пользователя
 *
 * @spec
 * - Валидация conversationId через markAsReadSchema
 * - Вызов repository.markAsRead
 * - ParticipantNotFoundError → HTTP 404
 *
 * @traces US-39-01 AC-1, AC-2, AC-4
 * @task B-026-T3-2
 */
async markConversationAsRead(conversationId: string, userId: string): Promise<void> {
  throw new Error('[TODO] markConversationAsRead — валидация + repository.markAsRead — B-026-T3-2');
}

/**
 * Получить сообщения со статусом прочтения
 *
 * @param conversationId - ID диалога
 * @param userId - ID пользователя
 *
 * @spec
 * - Вызов repository.getMessagesWithReadStatus
 *
 * @traces US-39-02 AC-1, AC-2, AC-3, AC-6
 * @task B-026-T3-2
 */
async getMessagesWithReadStatus(conversationId: string, userId: string): Promise<MessageWithReadStatus[]> {
  throw new Error('[TODO] getMessagesWithReadStatus — repository.getMessagesWithReadStatus — B-026-T3-2');
}
```

---

### 3.2 API Layer

---

#### 3.2.1 `PATCH /conversations/:id/read` — отметка личного диалога

| Параметр | Значение |
|---|---|
| **Файл** | `src/app/api/v1/conversations/[id]/read/route.ts` |
| **Действие** | 🆕 Создать |
| **Задача** | B-026-T4-1 |
| **Трассировка** | US-39-01 AC-1, AC-4 → T4-1 |

**Endpoints:**

| Метод | Путь | Auth | Request | Response | Ошибки |
|---|---|---|---|---|---|
| `PATCH` | `/conversations/:id/read` | ✅ | — | `200: { success: true }` | `401, 404, 500` |

**Поведение:**

- Авторизация через `auth()`
- Вызов `CommsService.markConversationAsRead(conversationId, userId)`
- Идемпотентно: повторный вызов не ошибается
- `ParticipantNotFoundError` → `NextResponse.json({ success: false, error: '...' }, { status: 404 })`

---

#### 3.2.2 `PATCH /chats/:id/read` — отметка группового чата

| Параметр | Значение |
|---|---|
| **Файл** | `src/app/api/v1/chats/[id]/read/route.ts` |
| **Действие** | 🆕 Создать |
| **Задача** | B-026-T4-2 |
| **Трассировка** | US-39-01 AC-2, AC-4 → T4-2 |

**Endpoints:**

| Метод | Путь | Auth | Request | Response | Ошибки |
|---|---|---|---|---|---|
| `PATCH` | `/chats/:id/read` | ✅ | — | `200: { success: true }` | `401, 404, 500` |

**Поведение:**

- Аналогично T4-1, но для групповых чатов
- Использует тот же `markAsRead` в repository (единая модель `Conversation`)

---

#### 3.2.3 `GET /conversations/:id/messages` — расширение read status

| Параметр | Значение |
|---|---|
| **Файл** | [`src/app/api/v1/conversations/[id]/messages/route.ts`](../../../src/app/api/v1/conversations/[id]/messages/route.ts) |
| **Действие** | 🔧 Изменить |
| **Задача** | B-026-T4-3, B-026-T4-4 |
| **Трассировка** | US-39-02 AC-1..3, AC-6 → T4-3, T4-4 |

**Изменение:**

- Вместо вызова `getConversationMessages()` вызывать `getMessagesWithReadStatus()`
- Ответ расширяется полями `isReadByRecipient` / `readByCount` / `totalParticipants`
- Работает для DIRECT и GROUP (тип определяется через `conversation.type`)

**Важно:** НЕ создавать отдельный маршрут `chats/[id]/messages` — GROUP-чат — это Conversation с `type: 'GROUP'` (T4-4).

---

### 3.3 UI Layer

---

#### 3.3.1 `ReadReceiptIcon` — индикатор статуса прочтения

| Параметр | Значение |
|---|---|
| **Файл** | `src/components/features/comms/ReadReceiptIcon/ReadReceiptIcon.tsx` |
| **Файл** | `src/components/features/comms/ReadReceiptIcon/index.ts` |
| **Тип** | Client Component (`'use client'`) |
| **Действие** | 🆕 Создать |
| **Задача** | B-026-T5-2 |
| **Трассировка** | US-39-02 AC-1, AC-2, AC-3, AC-6, AC-7 → T5-2 |

**Props Interface:**

| Пропс | Тип | Обязательный | По умолчанию | Описание |
|---|---|---|---|---|
| `isRead` | `boolean` | ✅ | `false` | Прочитано ли сообщение (для DIRECT) |
| `readByCount` | `number?` | ❌ | — | Количество прочитавших (для GROUP) |
| `totalParticipants` | `number?` | ❌ | — | Всего получателей кроме автора (для GROUP) |
| `conversationType` | `'DIRECT' \| 'GROUP'` | ✅ | `'DIRECT'` | Тип беседы |
| `className` | `string?` | ❌ | — | Дополнительные CSS-классы |

**Состояния отображения:**

| Состояние | Тип беседы | Условие | Визуал | aria-label | role |
|---|---|---|---|---|---|
| **S-1: Доставлено** | DIRECT | `!isRead` | одна ✓, серый | `Доставлено` | `img` |
| **S-2: Прочитано** | DIRECT | `isRead` | две ✓✓, акцентный | `Прочитано` | `img` |
| **S-3: Счётчик** | GROUP | — | «Прочитано: N из M» | `Прочитано: N из M` | `img` |

**Цветовые токены:**

| Состояние | Токен | Tailwind-класс |
|---|---|---|
| S-1 (непрочитано) | `var(--theme-text-secondary)` | `text-[var(--theme-text-secondary)]` |
| S-2 (прочитано) | `var(--theme-accent)` | `text-[var(--theme-accent)]` |
| S-3 (счётчик) | `var(--theme-text-secondary)` | `text-[var(--theme-text-secondary)]` |

**Размеры:**

| Элемент | Размер |
|---|---|
| SVG галочка | `w-3 h-3` (12px) |
| Текст счётчика | `text-xs leading-tight` |
| Отступ от контента | `mt-1` |

**Поведение:**

- inline SVG (без lucide)
- Внутренние SVG — `aria-hidden="true"`
- Внешний контейнер — `role="img"` + `aria-label`
- Темо-агностично через `var(--theme-*)`

**⚠️ Оценка:** ~45 строк — в пределах 50

**JSDoc:**

```tsx
/**
 * @component ReadReceiptIcon
 * @category features/comms
 * @description Индикатор статуса прочтения под отправленными сообщениями
 *
 * Состояния:
 *   - S-1: Одна серая галочка (доставлено) — DIRECT, !isRead
 *   - S-2: Две акцентные галочки (прочитано) — DIRECT, isRead
 *   - S-3: Текст "Прочитано: N из M" — GROUP
 *
 * @prop isRead — прочитано ли сообщение (для DIRECT)
 * @prop readByCount — количество прочитавших (для GROUP)
 * @prop totalParticipants — всего получателей кроме автора (для GROUP)
 * @prop conversationType — тип беседы
 * @prop className — дополнительные CSS-классы
 *
 * @spec
 * - inline SVG (без lucide), w-3 h-3
 * - aria-label для скринридеров (AC-7)
 * - role="img" на контейнере, aria-hidden на SVG
 * - Цвета через CSS-переменные var(--theme-*)
 * - Отображается только под сообщениями текущего пользователя
 *
 * @traces US-39-02 AC-1, AC-2, AC-3, AC-6, AC-7
 * @task B-026-T5-2
 *
 * @see docs/design/layouts/comms/read-receipts-layout.md
 * @see docs/user-stories/US-39-02-read-receipts.md
 */
```

---

#### 3.3.2 `MessageItem` — добавление read receipts

| Параметр | Значение |
|---|---|
| **Файл** | [`src/components/features/comms/MessageItem/MessageItem.tsx`](../../../src/components/features/comms/MessageItem/MessageItem.tsx) |
| **Действие** | 🔧 Изменить |
| **Задача** | B-026-T5-3 |
| **Трассировка** | US-39-02 AC-1..3, AC-5, AC-6 → T5-3 |

**Текущие пропсы (без изменений):**

| Пропс | Тип | Описание |
|---|---|---|
| `message` | `MessageWithSender` | Данные сообщения |
| `currentUserId` | `string` | ID текущего пользователя |
| `isLastMessage` | `boolean?` | Последнее ли сообщение |
| `onDelete` | `(messageId: string) => void` | Callback удаления |

**Новые пропсы:**

| Пропс | Тип | Обязательный | Описание |
|---|---|---|---|
| `readStatus` | `{ isReadByRecipient: boolean; readByCount?: number; totalParticipants?: number }?` | ❌ | Статус прочтения сообщения |
| `conversationType` | `'DIRECT' \| 'GROUP'` | ❌ | Тип беседы (для определения визуала) |

**Изменения в JSX:**

- **Заменить** блок «Статус сообщения» (line 142-150) с одиночной SVG-галочкой на `<ReadReceiptIcon>`
- **Условие рендера:** только для `isCurrentUser && readStatus`
- **Передача пропсов:**

```tsx
{isCurrentUser && readStatus && (
  <ReadReceiptIcon
    isRead={readStatus.isReadByRecipient}
    readByCount={readStatus.readByCount}
    totalParticipants={readStatus.totalParticipants}
    conversationType={conversationType}
  />
)}
```

**Позиционирование:**

- `mt-1` от контента
- `self-end` (правый край своих сообщений)

**Чек-лист:**

- [ ] Добавить пропсы `readStatus` и `conversationType` в `MessageItemProps`
- [ ] Заменить SVG-галочку статуса на `<ReadReceiptIcon>`
- [ ] Условие рендера: только `isCurrentUser && readStatus`
- [ ] Цвет: `text-[var(--theme-text-secondary)]` → `text-[var(--theme-accent)]` вместо `color.info`

---

#### 3.3.3 `ConversationMessagesList` — проброс read status

| Параметр | Значение |
|---|---|
| **Файл** | [`src/components/features/comms/ConversationMessagesList/ConversationMessagesList.tsx`](../../../src/components/features/comms/ConversationMessagesList/ConversationMessagesList.tsx) |
| **Действие** | 🔧 Изменить |
| **Задача** | B-026-T5-4 |
| **Трассировка** | US-39-02 AC-1..3, AC-6 → T5-4 |

**Изменения:**

| Элемент | Текущее значение | Целевое значение |
|---|---|---|
| Тип `messages` | `MessageWithSender[]` | `MessageWithReadStatus[]` |
| Новый пропс | — | `conversationType?: 'DIRECT' \| 'GROUP'` |
| Проброс в `MessageItem` | — | `readStatus` + `conversationType` |

**Обновлённый интерфейс:**

```typescript
export interface ConversationMessagesListProps {
  messages: MessageWithReadStatus[];  /* было: MessageWithSender[] */
  currentUserId: string;
  isLoading?: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
  lastMessageId?: string;
  onDelete?: (messageId: string) => void;
  /** Тип беседы для ReadReceiptIcon */
  conversationType?: 'DIRECT' | 'GROUP';
}
```

**Проброс в `MessageItem` (в рендере):**

```tsx
<MessageItem
  key={msg.id}
  message={msg}
  currentUserId={currentUserId}
  isLastMessage={msg.id === lastMessageId}
  onDelete={onDelete}
  readStatus={{
    isReadByRecipient: msg.isReadByRecipient,
    readByCount: msg.readByCount,
    totalParticipants: msg.totalParticipants,
  }}
  conversationType={conversationType}
/>
```

---

#### 3.3.4 `CommsTabs` — refetch механизма счётчиков

| Параметр | Значение |
|---|---|
| **Файл** | [`src/components/features/comms/CommsTabs/CommsTabs.tsx`](../../../src/components/features/comms/CommsTabs/CommsTabs.tsx) |
| **Действие** | 🔧 Изменить |
| **Задача** | B-026-T5-5 |
| **Трассировка** | US-21-37 AC-5, AC-7 → T5-5 |

**Изменения:**

| Элемент | Описание |
|---|---|
| Новый пропс | `onRefetchCounts?: () => void` — callback для внешнего триггера refetch |
| Экспорт | Сделать `loadCounts()` доступным через `useImperativeHandle` или callback |

**Альтернативный подход (предпочтительный):**

Добавить проп `refetchTrigger` (number) — при изменении значения компонент refetch-ит счётчики:

```typescript
interface CommsTabsProps {
  activeTab: 'messages' | 'chats' | 'announcements' | 'moderation';
  userRoles: string[];
  /** Триггер повторной загрузки счётчиков (инкрементируется извне) */
  refetchTrigger?: number;
}
```

```typescript
// Добавить в зависимости useEffect:
useEffect(() => {
  // loadCounts()...
}, [activeTab, refetchTrigger]);  /* было: [activeTab] */
```

**Чек-лист:**

- [ ] Добавить проп `refetchTrigger?: number` в `CommsTabsProps`
- [ ] Добавить `refetchTrigger` в зависимости `useEffect`
- [ ] Экспортировать тип `CommsTabsProps`

---

### 3.4 Hooks

---

#### 3.4.1 `useMarkAsRead` — хук отметки прочитанных

| Параметр | Значение |
|---|---|
| **Файл** | `src/hooks/useMarkAsRead.ts` |
| **Действие** | 🆕 Создать |
| **Задача** | B-026-T5-1 |
| **Трассировка** | US-39-01 AC-1, AC-2, AC-4, AC-5, AC-6 → T5-1 |

**Возвращает:**

| Поле | Тип | Описание |
|---|---|---|
| `markAsRead` | `(conversationId: string, type: 'DIRECT' \| 'GROUP') => Promise<void>` | Функция отметки прочитанных |
| `isMarking` | `boolean` | Флаг выполнения запроса (для предотвращения дублей) |

**Поведение:**

- `markAsRead(conversationId, 'DIRECT')` → `PATCH /api/v1/conversations/:id/read`
- `markAsRead(conversationId, 'GROUP')` → `PATCH /api/v1/chats/:id/read`
- После успеха: refetch `GET /api/v1/comms/unread-counts`
- Silent fail при ошибке сети (try/catch, не выбрасывает наружу — AC-6)
- `isMarking` flag для предотвращения дублирующихся вызовов
- Debounce не требуется (isMarking достаточно)

**JSDoc:**

```typescript
/**
 * @hook useMarkAsRead
 * @domain comms
 * @description Хук для автоматической отметки сообщений как прочитанных при открытии диалога/чата
 *
 * @returns { markAsRead, isMarking }
 *
 * @spec
 * - markAsRead(conversationId, type) вызывает PATCH /read endpoint
 * - type='DIRECT' → PATCH /conversations/:id/read
 * - type='GROUP' → PATCH /chats/:id/read
 * - После успеха — refetch GET /comms/unread-counts
 * - Silent fail при ошибке сети (AC-6)
 * - isMarking предотвращает дублирующиеся вызовы
 *
 * @traces US-39-01 AC-1, AC-2, AC-4, AC-5, AC-6
 * @task B-026-T5-1
 *
 * @see docs/user-stories/US-39-01-автоматическая-отметка-прочитанных.md
 */
```

---

### 3.5 Pages

---

#### 3.5.1 `messages/[conversationId]/page.tsx` — markAsRead при mount

| Параметр | Значение |
|---|---|
| **Файл** | `src/app/dashboard/comms/messages/[conversationId]/page.tsx` |
| **Действие** | 🔧 Изменить |
| **Задача** | B-026-T6-1 |
| **Трассировка** | US-39-01 AC-1, AC-4, AC-5 → T6-1 |

**Изменения (L1):**

```typescript
// Добавить:
import { useMarkAsRead } from '@/hooks/useMarkAsRead';

// Внутри страницы (или компонента страницы):
const { markAsRead, isMarking } = useMarkAsRead();

useEffect(() => {
  markAsRead(conversationId, 'DIRECT');
}, [conversationId]);
```

**Чек-лист:**

- [ ] Подключить `useMarkAsRead`
- [ ] Вызов `markAsRead(conversationId, 'DIRECT')` при mount / change `conversationId`
- [ ] `isMarking` флаг защищает от дублей при быстром переключении

---

#### 3.5.2 `chats/[chatId]/page.tsx` — markAsRead при mount

| Параметр | Значение |
|---|---|
| **Файл** | `src/app/dashboard/comms/chats/[chatId]/page.tsx` |
| **Действие** | 🔧 Изменить |
| **Задача** | B-026-T6-2 |
| **Трассировка** | US-39-01 AC-2 → T6-2 |

**Изменения (L1):**

```typescript
const { markAsRead } = useMarkAsRead();

useEffect(() => {
  markAsRead(chatId, 'GROUP');
}, [chatId]);
```

---

#### 3.5.3 Refetch счётчиков в страницах

| Параметр | Значение |
|---|---|
| **Файл** | Страницы `/dashboard/comms/messages/[conversationId]` и `/dashboard/comms/chats/[chatId]` |
| **Действие** | 🔧 Изменить |
| **Задача** | B-026-T6-3 |
| **Трассировка** | US-21-37 AC-5, AC-7 → T6-3 |

**Изменения:**

- Страницы используют `refetchTrigger` проп `CommsTabs` или другой механизм
- После успешного `markAsRead()` счётчики обновляются автоматически через `useMarkAsRead` (внутри хука refetch unread-counts)

---

## 4. 🧪 Граничные случаи

| # | Ситуация | Ожидаемое поведение | AC | Компонент |
|---|----------|---------------------|---|---|
| 1 | В групповом чате >100 участников | «Прочитано: 47 из 123» без ограничения | US-39-02 EC-1 | `ReadReceiptIcon` (S-3) |
| 2 | Быстрое переключение между диалогами (EC-02 US-39-01) | `isMarking` flag предотвращает дубли | US-39-01 EC-02 | `useMarkAsRead` |
| 3 | Ошибка загрузки read status (сеть/API) | Индикатор скрыт, сообщения видны (silent fail) | US-39-02 EC-6 | `ReadReceiptIcon` не рендерится |
| 4 | Пользователь отправляет сообщение сам себе | Автор исключён из `totalParticipants` | US-39-02 EC-3 | Repository (BR-07) |
| 5 | Новый участник добавлен после отправки | `M` увеличивается, `N` не меняется | US-39-02 EC-4 | Repository |
| 6 | ParticipantNotFound при markAsRead | HTTP 404, silent fail в хуке | US-39-01 AC-4 | API + `useMarkAsRead` |

---

## 5. 📐 Влияние на архитектуру

### Изменённые файлы

| Файл | Действие | Слой | Задача |
|---|---|---|---|
| [`src/domains/comms/comms.types.ts`](../../../src/domains/comms/comms.types.ts) | ✏️ + `MessageWithReadStatus` | Domain/Types | T1-1 |
| [`src/domains/comms/comms.errors.ts`](../../../src/domains/comms/comms.errors.ts) | ✏️ + `ParticipantNotFoundError` | Domain/Errors | T1-2 |
| [`src/domains/comms/comms.validators.ts`](../../../src/domains/comms/comms.validators.ts) | ✏️ + `markAsReadSchema` | Domain/Validators | T3-1 |
| [`src/domains/comms/comms.repository.interface.ts`](../../../src/domains/comms/comms.repository.interface.ts) | ✏️ + 2 метода | Domain/Repository | T2-1 |
| [`src/domains/comms/comms.repository.prisma.ts`](../../../src/domains/comms/comms.repository.prisma.ts) | ✏️ + 2 методов | Domain/Repository | T2-2 |
| [`src/domains/comms/comms.service.ts`](../../../src/domains/comms/comms.service.ts) | ✏️ + 2 метода | Domain/Service | T3-2 |
| `src/app/api/v1/conversations/[id]/read/route.ts` | 🆕 Создать | API | T4-1 |
| `src/app/api/v1/chats/[id]/read/route.ts` | 🆕 Создать | API | T4-2 |
| [`src/app/api/v1/conversations/[id]/messages/route.ts`](../../../src/app/api/v1/conversations/[id]/messages/route.ts) | 🔧 Изменить | API | T4-3, T4-4 |
| `src/hooks/useMarkAsRead.ts` | 🆕 Создать | Hook | T5-1 |
| `src/components/features/comms/ReadReceiptIcon/ReadReceiptIcon.tsx` | 🆕 Создать | UI | T5-2 |
| `src/components/features/comms/ReadReceiptIcon/index.ts` | 🆕 Создать | UI | T5-2 |
| [`src/components/features/comms/MessageItem/MessageItem.tsx`](../../../src/components/features/comms/MessageItem/MessageItem.tsx) | 🔧 + read receipts | UI | T5-3 |
| [`src/components/features/comms/ConversationMessagesList/ConversationMessagesList.tsx`](../../../src/components/features/comms/ConversationMessagesList/ConversationMessagesList.tsx) | 🔧 + read status | UI | T5-4 |
| [`src/components/features/comms/CommsTabs/CommsTabs.tsx`](../../../src/components/features/comms/CommsTabs/CommsTabs.tsx) | 🔧 + refetchTrigger | UI | T5-5 |
| `src/app/dashboard/comms/messages/[conversationId]/page.tsx` | 🔧 + markAsRead | Page | T6-1 |
| `src/app/dashboard/comms/chats/[chatId]/page.tsx` | 🔧 + markAsRead | Page | T6-2 |

### Связь с предыдущими задачами

| Задача | Связь |
|---|---|
| B-024 (US-38-01/02) | Базовые компоненты чата (MessageItem, ConversationMessagesList и т.д.) |
| B-025 (US-38-03) | ChatLayout centring — не затрагивается |

---

## 6. ✅ Чек-лист валидации

### Spec-файл

- [x] Матрица трассировки покрывает все AC из всех US (20 строк)
- [x] Каждый компонент имеет TASK-ID из плана
- [x] Проверка покрытия AC — все AC покрыты ✅

### Перед передачей в Code-режим

- [x] Domain-слой: типы, ошибки, валидаторы, repository interface/service
- [x] API-слой: 2 новых route + 1 изменённый route
- [x] UI-слой: 1 новый компонент (ReadReceiptIcon), 3 изменённых
- [x] Hook-слой: 1 новый хук (useMarkAsRead)
- [x] Page-слой: 2 изменённых страницы
- [x] Все AC из US-39-01, US-39-02, US-21-37 покрыты
- [x] Model без изменений
- [x] Цвета через CSS-переменные `var(--theme-*)`
- [x] ARIA: `role="img"` + `aria-label`

---

## 7. 📝 История изменений

| Дата | Версия | Автор | Изменение |
|---|---|---|---|
| 2026-08-03 | v1.0 | Component Spec | Создание спецификации для B-026 |

---

## 📖 Референсные примеры

> При создании скелетов ориентироваться на существующие паттерны:
>
> - **Доменный слой:** [`src/domains/comms/`](../../../src/domains/comms/)
> - **API route:** [`src/app/api/v1/comms/unread-counts/route.ts`](../../../src/app/api/v1/comms/unread-counts/route.ts)
> - **Компонент:** [`src/components/features/comms/MessageItem/MessageItem.tsx`](../../../src/components/features/comms/MessageItem/MessageItem.tsx)
> - **Правила JSDoc:** [`docs/rules/component-spec-rules.md`](../../rules/component-spec-rules.md)
