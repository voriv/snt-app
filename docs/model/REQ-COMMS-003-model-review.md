# Аудит модели данных для REQ-COMMS-003

## Метаданные

| Поле | Значение |
|------|----------|
| **Требование** | [REQ-COMMS-003](../requirements/REQ-COMMS-003.md) — Отметка прочитанных сообщений и статусы прочтения |
| **Задача** | B-026 |
| **Дата аудита** | 2026-08-03 |
| **Агент** | data-architect |
| **Вердикт** | ✅ **МОДЕЛЬ НЕ ТРЕБУЕТ ИЗМЕНЕНИЙ** |

---

## 1. Требуемые данные по User Stories

### US-39-01: Автоматическая отметка прочитанных

| Данные | Источник | Нужны для |
|--------|----------|-----------|
| `participant.lastReadAt` | ConversationParticipant | Отметка времени последнего прочтения участником |
| `message.createdAt` | Message | Сравнение: сообщение прочитано если `createdAt <= lastReadAt` |
| `message.senderId` | Message | Исключение собственных сообщений из счётчика |
| `participant.userId` | ConversationParticipant | Привязка lastReadAt к конкретному участнику |
| `participant.conversationId` | ConversationParticipant | Привязка lastReadAt к конкретному диалогу/чату |

### US-39-02: Read Receipts

| Данные | Источник | Нужны для |
|--------|----------|-----------|
| `participant.lastReadAt` | ConversationParticipant | Вычисление: сообщение прочитано если `lastReadAt >= message.createdAt` |
| `conversation.type` | Conversation | Различение DIRECT (галочки) и GROUP (счётчик N/M) |
| `participant.userId` (все участники) | ConversationParticipant | Подсчёт M — общее число участников кроме автора |

### US-21-37: Счётчики непрочитанных на вкладках

| Данные | Источник | Нужны для |
|--------|----------|-----------|
| `participant.lastReadAt` | ConversationParticipant | Вычисление непрочитанных |
| `message.createdAt` | Message | Сравнение с lastReadAt |
| `message.senderId` | Message | Фильтрация `senderId != userId` |
| `conversation.type` | Conversation | Разделение counts по DIRECT (messages) и GROUP (chats) |

---

## 2. Существующая модель (фактическое состояние)

### Сущность `ConversationParticipant` ([`prisma/schema.prisma:233`](prisma/schema.prisma:233))

```prisma
model ConversationParticipant {
  id             String          @id @default(cuid())
  conversationId String          @map("conversation_id")
  userId         String          @map("user_id")
  role           ParticipantRole @default(MEMBER) @map("role")
  joinedAt       DateTime        @default(now()) @map("joined_at")
  lastReadAt     DateTime?       @map("last_read_at")       // ✅ КЛЮЧЕВОЕ ПОЛЕ

  conversation Conversation @relation(fields: [conversationId], references: [id], onDelete: Cascade)
  user         User         @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([conversationId, userId])
  @@index([userId])
  @@map("conversation_participants")
}
```

**Поле `lastReadAt`** — `DateTime?`, nullable, с `@map("last_read_at")`. Соответствует конвенциям проекта.

### Сущность `Message` ([`prisma/schema.prisma:250`](prisma/schema.prisma:250))

```prisma
model Message {
  id             String    @id @default(cuid())
  conversationId String    @map("conversation_id")
  senderId       String    @map("sender_id")           // ✅ Для фильтрации своих сообщений
  content        String    @map("content")
  replyToId      String?   @map("reply_to_id")
  isDeleted      Boolean   @default(false) @map("is_deleted")
  deletedBy      String?   @map("deleted_by")
  deletedAt      DateTime? @map("deleted_at")
  createdAt      DateTime  @default(now()) @map("created_at")  // ✅ Для сравнения с lastReadAt
  updatedAt      DateTime  @updatedAt @map("updated_at")

  conversation Conversation @relation(fields: [conversationId], references: [id], onDelete: Cascade)
  sender User @relation(fields: [senderId], references: [id], onDelete: Cascade)

  @@index([conversationId, createdAt])
  @@map("messages")
}
```

### Сущность `Conversation` ([`prisma/schema.prisma:216`](prisma/schema.prisma:216))

```prisma
model Conversation {
  id          String           @id @default(cuid())
  type        ConversationType @default(DIRECT) @map("type")  // ✅ DIRECT | GROUP | ANNOUNCEMENT
  title       String?          @map("title")
  description String?          @map("description") @db.Text
  plotId      String?          @map("plot_id")
  createdBy   String           @map("created_by")
  createdAt   DateTime         @default(now()) @map("created_at")
  updatedAt   DateTime         @updatedAt @map("updated_at")

  participants ConversationParticipant[]
  messages     Message[]

  @@map("conversations")
}
```

### Enum `ConversationType` ([`prisma/schema.prisma:202`](prisma/schema.prisma:202))

```prisma
enum ConversationType {
  DIRECT
  GROUP
  ANNOUNCEMENT
}
```

---

## 3. Матрица покрытия требований

| Требование | Поле/Сущность | Покрытие |
|------------|---------------|----------|
| `lastReadAt` для личных диалогов | `ConversationParticipant.lastReadAt` | ✅ Полное |
| `lastReadAt` для групповых чатов | `ConversationParticipant.lastReadAt` (через `Conversation.type == GROUP`) | ✅ Полное |
| Сравнение `message.createdAt <= lastReadAt` | `Message.createdAt` + `ConversationParticipant.lastReadAt` | ✅ Полное |
| Исключение своих сообщений | `Message.senderId != userId` | ✅ Полное |
| Различение DIRECT vs GROUP | `Conversation.type` (enum) | ✅ Полное |
| Счётчик N/M для групповых чатов | COUNT participants WHERE `lastReadAt >= message.createdAt` / COUNT все participants | ✅ Полное |
| Агрегация по вкладкам (messages/chats) | GROUP BY `Conversation.type` | ✅ Полное |

---

## 4. Выявленные несоответствия в документации

### Несоответствие #1: Ссылки на `ChatParticipant` и `ChatMessage` в User Stories

**Где:** [`US-39-01:33`](docs/user-stories/US-39-01-автоматическая-отметка-прочитанных.md:33), [`US-39-02:38`](docs/user-stories/US-39-02-read-receipts.md:38), [`US-21-37:157`](docs/user-stories/US-21-37-счетчики-непрочитанных-на-вкладках.md:157)

**Проблема:** User Stories упоминают `ChatParticipant` и `ChatMessage` как отдельные сущности. В реальной схеме используется единая модель `Conversation` + `ConversationParticipant` + `Message`, различаемая через `Conversation.type`.

**Влияние:** Только на документацию. Реальная схема корректна и покрывает все требования.

**Рекомендация:** Обновить разделы «Модель данных» в US-39-01 и US-39-02, заменив упоминание `ChatParticipant` на `ConversationParticipant` с уточнением `WHERE Conversation.type == GROUP`.

---

## 5. SQL-запросы для типовых операций

### Отметка прочитанных (markAsRead)

```sql
UPDATE conversation_participants
SET last_read_at = NOW()
WHERE conversation_id = :conversationId
  AND user_id = :userId;
```

### Подсчёт непрочитанных для конкретного диалога/чата

```sql
SELECT COUNT(*) AS unread_count
FROM messages m
JOIN conversation_participants cp ON cp.conversation_id = m.conversation_id
WHERE m.conversation_id = :conversationId
  AND cp.user_id = :userId
  AND m.sender_id != :userId
  AND (
    cp.last_read_at IS NULL
    OR m.created_at > cp.last_read_at
  )
  AND m.is_deleted = false;
```

### Общие счётчики по вкладкам

```sql
SELECT
  COALESCE(SUM(CASE WHEN c.type = 'DIRECT' THEN sub.unread ELSE 0 END), 0) AS messages,
  COALESCE(SUM(CASE WHEN c.type = 'GROUP' THEN sub.unread ELSE 0 END), 0) AS chats
FROM (
  SELECT
    m.conversation_id,
    COUNT(*) AS unread
  FROM messages m
  JOIN conversation_participants cp ON cp.conversation_id = m.conversation_id
  WHERE cp.user_id = :userId
    AND m.sender_id != :userId
    AND (cp.last_read_at IS NULL OR m.created_at > cp.last_read_at)
    AND m.is_deleted = false
  GROUP BY m.conversation_id
) sub
JOIN conversations c ON c.id = sub.conversation_id;
```

### Read Receipts — личный диалог

```sql
SELECT
  m.id,
  m.content,
  m.sender_id,
  m.created_at,
  CASE
    WHEN recipient.last_read_at >= m.created_at THEN true
    ELSE false
  END AS is_read_by_recipient
FROM messages m
JOIN conversation_participants recipient
  ON recipient.conversation_id = m.conversation_id
  AND recipient.user_id != m.sender_id
WHERE m.conversation_id = :conversationId
  AND m.sender_id = :currentUserId;
```

### Read Receipts — групповой чат (N из M)

```sql
SELECT
  m.id,
  COUNT(CASE WHEN cp.last_read_at >= m.created_at THEN 1 END) AS read_count,
  COUNT(CASE WHEN cp.user_id != m.sender_id THEN 1 END) AS total_count
FROM messages m
LEFT JOIN conversation_participants cp
  ON cp.conversation_id = m.conversation_id
  AND cp.user_id != m.sender_id
WHERE m.conversation_id = :conversationId
  AND m.id = :messageId
GROUP BY m.id;
```

---

## 6. Заключение

### Вердикт: ✅ МОДЕЛЬ НЕ ТРЕБУЕТ ИЗМЕНЕНИЙ

**Обоснование:**

1. **`ConversationParticipant.lastReadAt`** — поле уже существует в схеме, имеет корректный тип `DateTime?` и соответствует всем требованиям REQ-COMMS-003.

2. **Единая модель Conversation** — использование `Conversation.type` (DIRECT/GROUP/ANNOUNCEMENT) вместо отдельных таблиц для личных диалогов и групповых чатов является архитектурно корректным решением и покрывает все сценарии:
   - Отметка прочитанных работает через `lastReadAt` независимо от типа
   - Различение типа для read receipts (галочки vs счётчик N/M) осуществляется через `Conversation.type`
   - Агрегация счётчиков по вкладкам — через `GROUP BY Conversation.type`

3. **Все инварианты сохраняются:**
   - `lastReadAt IS NULL` → все входящие сообщения непрочитаны (BR-04)
   - `message.createdAt > participant.lastReadAt` → сообщение непрочитано (BR-03)
   - `message.senderId != userId` → исключение собственных сообщений (BR-02)
   - Обновление `lastReadAt` идемпотентно (AC-4)

4. **Конвенции соблюдены:**
   - snake_case в БД: `last_read_at`, `conversation_id`, `user_id`, `sender_id`, `created_at`
   - camelCase в Prisma: `lastReadAt`, `conversationId`, `userId`, `senderId`, `createdAt`
   - `@map()` для всех внешних ключей и timestamp-полей
   - `@unique([conversationId, userId])` в ConversationParticipant

### Миграция не требуется

Существующая схема полностью покрывает функциональные требования REQ-COMMS-003. Никаких изменений в `prisma/schema.prisma` не необходимо.

### Рекомендации

1. **Документация:** Обновить US-39-01 и US-39-02 — исправить ссылки на `ChatParticipant` → `ConversationParticipant`
2. **Реализация:** Repository-слой должен использовать `ConversationParticipant.lastReadAt` для обоих типов бесед (DIRECT и GROUP), различая их через `Conversation.type`
