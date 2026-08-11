# Аудит модели данных: REQ-COMMS-001 (Система общения в СНТ)

> **Дата аудита:** 2026-07-26
> **Аудитор:** ИИ-архитектор данных (data-architect)
> **Задача:** B-014 — Аудит домена «Общение» (шаг 2/7)
> **Предыдущий шаг:** REQ-COMMS-001-audit.md (business-analyst)
> **Вердикт:** ❌ FAIL — критические пробелы в модели данных

---

## 1. Общая информация

| Параметр | Значение |
|----------|----------|
| Требования | REQ-COMMS-001: Система общения в СНТ |
| Prisma-схема | prisma/schema.prisma (строки 197-300) |
| DBML-схема | docs/model/schema.dbml (строки 148-282) |
| Entity-документы | docs/model/entities/conversation.md, message.md, announcement.md |
| Сущности REQ (§8) | 12 новых + 2 изменения существующих |
| Сущности в Prisma | 4 (Conversation, ConversationParticipant, Message, Announcement) |
| Сущности в DBML | 4 (conversations, conversation_participants, messages, announcements) |
| **Реализовано из 12** | **4 / 12 (33%)** |

---

## 2. Матрица покрытия: REQ-сущность → Prisma → DBML → Статус

### Основные сущности

| REQ-сущность (§8) | Prisma-модель | DBML-таблица | Entity-doc | Статус | Примечание |
|-------------------|---------------|--------------|------------|--------|------------|
| `conversations` | ✅ `Conversation` (L216) | ✅ `conversations` (L163) | ✅ conversation.md | ✅ | Базовые поля соответствуют |
| `conversation_participants` | ✅ `ConversationParticipant` (L233) | ✅ `conversation_participants` (L182) | ✅ conversation.md | ✅ | Полное соответствие |
| `messages` | ✅ `Message` (L250) | ✅ `messages` (L205) | ✅ message.md | ⚠️ | Отсутствуют поля is_pinned, mentions |
| `announcements` | ✅ `Announcement` (L282) | ✅ `announcements` (L231) | ✅ announcement.md | ⚠️ | Отсутствуют поля category, discussion_enabled, file_attachments |
| `notifications` | ❌ нет | ❌ нет | ❌ нет | ❌ | **КРИТИЧЕСКИЙ ПРОБЕЛ** |
| `notification_settings` | ❌ нет | ❌ нет | ❌ нет | ❌ | **КРИТИЧЕСКИЙ ПРОБЕЛ** |
| `chat_categories` | ❌ нет | ❌ нет | ❌ нет | ❌ | **КРИТИЧЕСКИЙ ПРОБЕЛ** |
| `personal_chat_folders` | ❌ нет | ❌ нет | ❌ нет | ❌ | **КРИТИЧЕСКИЙ ПРОБЕЛ** |
| `conversation_category_mapping` | ❌ нет | ❌ нет | ❌ нет | ❌ | **КРИТИЧЕСКИЙ ПРОБЕЛ** |
| `conversation_folder_mapping` | ❌ нет | ❌ нет | ❌ нет | ❌ | **КРИТИЧЕСКИЙ ПРОБЕЛ** |
| `reports` | ❌ нет | ❌ нет | ❌ нет | ❌ | **КРИТИЧЕСКИЙ ПРОБЕЛ** |
| `moderation_actions` | ❌ нет | ❌ нет | ❌ нет | ❌ | **КРИТИЧЕСКИЙ ПРОБЕЛ** |
| `user_blocks` | ❌ нет | ❌ нет | ❌ нет | ❌ | **КРИТИЧЕСКИЙ ПРОБЕЛ** |

### Изменения существующих сущностей (REQ §8, таблица 2)

| Сущность | REQ-изменение | В Prisma | В DBML | Статус |
|----------|---------------|----------|--------|--------|
| `user_profiles` | +notification_email_enabled | ❌ | ❌ | ❌ |
| `user_profiles` | +notification_email_frequency | ❌ | ❌ | ❌ |
| `user_profiles` | +is_blocked | ❌ | ❌ | ❌ |
| `user_profiles` | +blocked_at | ❌ | ❌ | ❌ |
| `user_profiles` | +warnings_count | ❌ | ❌ | ❌ |
| `messages` | +is_deleted | ✅ `isDeleted` | ✅ `is_deleted` | ✅ |
| `messages` | +deleted_by | ✅ `deletedBy` | ✅ `deleted_by` | ✅ |
| `messages` | +deleted_at | ✅ `deletedAt` | ✅ `deleted_at` | ✅ |

---

## 3. Детальный анализ существующих сущностей

### 3.1 Conversation

| Поле REQ | Тип REQ | В Prisma | Тип Prisma | Соответствие |
|----------|---------|----------|------------|--------------|
| id | — | ✅ id | String @cuid | ✅ |
| type | enum | ✅ type | ConversationType | ✅ |
| title | String? | ✅ title | String? | ✅ |
| plot_id | String? | ✅ plotId | String? | ✅ |
| created_by | String | ✅ createdBy | String | ✅ |
| created_at | DateTime | ✅ createdAt | DateTime | ✅ |
| updated_at | DateTime | ✅ updatedAt | DateTime | ✅ |
| ~~description~~ | — | ✅ description | String? @db.Text | ⚠️ **Сверх REQ** — поле добавлено, но не в REQ |

**Проблемы:**
- ❌ `plot_id` не является FK — отсутствует `@relation(fields: [plotId], references: [id])` и `Plot` модель. Это просто String? без ссылочной целостности.
- ❌ `created_by` не является FK — отсутствует `@relation` на User. Просто String.
- ⚠️ `description` добавлено сверх REQ (не в разделе 8).

### 3.2 ConversationParticipant

| Поле REQ | В Prisma | Соответствие |
|----------|----------|--------------|
| conversation_id | ✅ conversationId | ✅ |
| user_id | ✅ userId | ✅ |
| role | ✅ role (ParticipantRole) | ✅ |
| joined_at | ✅ joinedAt | ✅ |
| last_read_at | ✅ lastReadAt | ✅ |

**Статус:** ✅ Полное соответствие REQ.

**Проблемы:**
- ✅ FK корректно определены с `onDelete: Cascade`.
- ✅ Composite unique `(conversationId, userId)` реализован.

### 3.3 Message

| Поле REQ | В Prisma | Соответствие |
|----------|----------|--------------|
| id | ✅ | ✅ |
| conversation_id | ✅ | ✅ |
| sender_id | ✅ | ✅ |
| content | ✅ | ✅ |
| is_pinned | ❌ **ОТСУТСТВУЕТ** | ❌ |
| mentions (JSON) | ❌ **ОТСУТСТВУЕТ** | ❌ |
| reply_to_id | ✅ | ✅ |
| is_deleted | ✅ | ✅ |
| deleted_by | ✅ | ✅ |
| deleted_at | ✅ | ✅ |
| created_at | ✅ | ✅ |
| updated_at | ✅ | ✅ |

**Критические пробелы:**
- ❌ `is_pinned` (Boolean) — требуется для FR-REQ-COMMS-001-12 (закрепление сообщений). Нет даже US.
- ❌ `mentions` (Json) — требуется для BR-11 (упоминания @username). US-21-09 описывает упоминания, но поле в БД отсутствует.

**Проблемы целостности:**
- ❌ `reply_to_id` не является FK на Message — нет `@relation`. В DBML указано `ref: > messages.id`, но в Prisma — просто `String?`.
- ❌ `sender_id` имеет FK `@relation(fields: [senderId], references: [id], onDelete: Cascade)` — это означает, что при удалении User все его Messages будут каскадно удалены. Но BR-10 REQ гласит: "При удалении пользователя его сообщения сохраняются". **КОНФЛИКТ С БИЗНЕС-ПРАВИЛОМ!**

### 3.4 Announcement

| Поле REQ | В Prisma | Соответствие |
|----------|----------|--------------|
| id | ✅ | ✅ |
| title | ✅ | ✅ |
| content | ✅ | ✅ |
| author_id | ✅ | ✅ |
| category | ❌ **ОТСУТСТВУЕТ** | ❌ |
| status | ✅ | ✅ |
| discussion_enabled | ❌ **ОТСУТСТВУЕТ** | ❌ |
| file_attachments (JSON) | ❌ **ОТСУТСТВУЕТ** | ❌ |
| published_at | ✅ | ✅ |
| archived_at | ✅ | ✅ |
| is_important | ✅ | ✅ |
| view_count | ✅ | ✅ |
| created_at | ✅ | ✅ |
| updated_at | ✅ | ✅ |

**Критические пробелы:**
- ❌ `category` (String) — требуется для FR-REQ-COMMS-001-42 (категории: важное, плановое, техническое, информационное).
- ❌ `discussion_enabled` (Boolean) — требуется для FR-REQ-COMMS-001-43 (обсуждение с авто-созданием чата).
- ❌ `file_attachments` (Json) — требуется для FR-REQ-COMMS-001-44 (файлы к объявлениям).

**Проблемы целостности:**
- ❌ `author_id` имеет FK `@relation(fields: [authorId], references: [id], onDelete: Cascade)` — при удалении автора все объявления удаляются. REQ не описывает это явно, но BR-10 аналогично требует сохранения контента.

---

## 4. Отсутствующие сущности (8 из 12 REQ-сущностей)

### 4.1 notifications — Внутренние уведомления

**Требуется для:** FR-48..56 (уведомления при сообщениях, упоминаниях, объявлениях, предупреждениях, блокировках).

**REQ-поля (§8):**
```
id, user_id, type, title, content, is_read, related_type, related_id, created_at
```

**Рекомендуемая модель:**
```prisma
model Notification {
  id          String   @id @default(cuid())
  userId      String   @map("user_id")
  type        String   @map("type")             // message, mention, announcement, warning, block
  title       String   @map("title")
  content     String?  @map("content") @db.Text
  isRead      Boolean  @default(false) @map("is_read")
  relatedType String?  @map("related_type")     // message, announcement, etc.
  relatedId   String?  @map("related_id")
  createdAt   DateTime @default(now()) @map("created_at")
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@index([userId, isRead])
  @@index([userId, createdAt])
  @@map("notifications")
}
```

### 4.2 notification_settings — Настройки email-уведомлений

**Требуется для:** FR-57..59 (email-уведомления с настройкой частоты).

**REQ-поля (§8):**
```
user_id, email_enabled, email_frequency, email_announcements, updated_at
```

**Рекомендуемая модель (через UserProfile):**
```
// Вариант A: отдельные поля в UserProfile (предпочтительно)
notification_email_enabled   Boolean  @default(true) @map("notification_email_enabled")
notification_email_frequency String   @default("immediately") @map("notification_email_frequency")

// Вариант B: отдельная таблица notification_settings
```

### 4.3 chat_categories — Системные категории чатов

**Требуется для:** FR-15..20, BR-14..24 (двухуровневая модель категорий).

**REQ-поля (§8):**
```
id, name, description, parent_id (nullable), sort_order, is_active, created_by, created_at, updated_at
```

**Рекомендуемая модель:**
```prisma
model ChatCategory {
  id          String   @id @default(cuid())
  name        String   @map("name") @db.VarChar(100)
  description String?  @map("description") @db.VarChar(500)
  parentId    String?  @map("parent_id")
  sortOrder   Int      @default(0) @map("sort_order")
  isActive    Boolean  @default(true) @map("is_active")
  createdBy   String   @map("created_by")
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")
  parent      ChatCategory? @relation("CategoryParent", fields: [parentId], references: [id], onDelete: SetNull)
  children    ChatCategory[] @relation("CategoryParent")
  mappings    ConversationCategoryMapping[]
  @@unique([name, parentId])
  @@map("chat_categories")
}
```

### 4.4 personal_chat_folders — Персональные папки

**Требуется для:** FR-21..25, BR-17..23 (персональная организация чатов).

**REQ-поля (§8):**
```
id, user_id, name, sort_order, is_active, created_at, updated_at
```

**Рекомендуемая модель:**
```prisma
model PersonalChatFolder {
  id          String   @id @default(cuid())
  userId      String   @map("user_id")
  name        String   @map("name") @db.VarChar(100)
  sortOrder   Int      @default(0) @map("sort_order")
  isActive    Boolean  @default(true) @map("is_active")
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  mappings    ConversationFolderMapping[]
  @@map("personal_chat_folders")
}
```

### 4.5 conversation_category_mapping — Связь чата с категорией

**REQ-поля (§8):**
```
conversation_id, chat_category_id, assigned_by, created_at
```

**Рекомендуемая модель:**
```prisma
model ConversationCategoryMapping {
  conversationId   String   @map("conversation_id")
  chatCategoryId   String   @map("chat_category_id")
  assignedBy       String   @map("assigned_by")
  createdAt        DateTime @default(now()) @map("created_at")
  conversation     Conversation @relation(fields: [conversationId], references: [id], onDelete: Cascade)
  chatCategory     ChatCategory @relation(fields: [chatCategoryId], references: [id], onDelete: Cascade)
  @@id([conversationId, chatCategoryId])
  @@map("conversation_category_mapping")
}
```

### 4.6 conversation_folder_mapping — Связь чата с персональной папкой

**REQ-поля (§8):**
```
conversation_id, personal_chat_folder_id, created_at
```

**Рекомендуемая модель:**
```prisma
model ConversationFolderMapping {
  conversationId       String   @map("conversation_id")
  personalChatFolderId String   @map("personal_chat_folder_id")
  createdAt            DateTime @default(now()) @map("created_at")
  conversation         Conversation @relation(fields: [conversationId], references: [id], onDelete: Cascade)
  personalChatFolder   PersonalChatFolder @relation(fields: [personalChatFolderId], references: [id], onDelete: Cascade)
  @@id([conversationId, personalChatFolderId])
  @@map("conversation_folder_mapping")
}
```

### 4.7 reports — Жалобы на сообщения (MessageReport)

**Требуется для:** FR-26..36, BR-32..34 (подача и рассмотрение жалоб).

**REQ-поля (§8):**
```
id, reporter_id, message_id, reason, comment, status (pending/resolved/dismissed), reviewed_by, reviewed_at, created_at
```

**Рекомендуемая модель:**
```prisma
model MessageReport {
  id          String          @id @default(cuid())
  reporterId  String          @map("reporter_id")
  messageId   String          @map("message_id")
  reason      String          @map("reason")         // insult, spam, advertising, other
  comment     String?         @map("comment") @db.Text
  status      ReportStatus    @default(PENDING) @map("status")
  reviewedBy  String?         @map("reviewed_by")
  reviewedAt  DateTime?       @map("reviewed_at")
  createdAt   DateTime        @default(now()) @map("created_at")
  reporter    User            @relation("ReportReporter", fields: [reporterId], references: [id], onDelete: Cascade)
  message     Message         @relation(fields: [messageId], references: [id], onDelete: Cascade)
  reviewer    User?           @relation("ReportReviewer", fields: [reviewedBy], references: [id], onDelete: SetNull)
  @@unique([reporterId, messageId])
  @@index([status])
  @@index([createdAt])
  @@map("message_reports")
}

enum ReportStatus {
  PENDING
  RESOLVED
  DISMISSED
}
```

### 4.8 moderation_actions — История действий модератора

**Требуется для:** FR-36..40, BR-30 (история модерации).

**REQ-поля (§8):**
```
id, moderator_id, target_user_id, action_type, reason, target_message_id, target_conversation_id, created_at
```

**Рекомендуемая модель:**
```prisma
model ModerationAction {
  id                    String            @id @default(cuid())
  moderatorId           String            @map("moderator_id")
  targetUserId          String            @map("target_user_id")
  actionType            ModerationActionType @map("action_type")
  reason                String?           @map("reason") @db.Text
  targetMessageId       String?           @map("target_message_id")
  targetConversationId  String?           @map("target_conversation_id")
  createdAt             DateTime          @default(now()) @map("created_at")
  @@index([moderatorId])
  @@index([targetUserId])
  @@index([createdAt])
  @@map("moderation_actions")
}

enum ModerationActionType {
  DELETE_MESSAGE
  REMOVE_FROM_CHAT
  BLOCK
  UNBLOCK
  WARN
  RESOLVE_REPORT
}
```

### 4.9 user_blocks — Блокировки пользователей

**Требуется для:** FR-32..33, BR-26..38 (блокировка/разблокировка).

**REQ-поля (§8):**
```
id, user_id (заблокированный), blocked_by, reason, blocked_at, unblocked_by, unblocked_at
```

**Рекомендуемая модель:**
```prisma
model UserBlock {
  id           String    @id @default(cuid())
  userId       String    @map("user_id")          // заблокированный
  blockedBy    String    @map("blocked_by")
  reason       String    @map("reason") @db.Text
  blockedAt    DateTime  @default(now()) @map("blocked_at")
  unblockedBy  String?   @map("unblocked_by")
  unblockedAt  DateTime? @map("unblocked_at")
  @@unique([userId])
  @@index([blockedAt])
  @@map("user_blocks")
}
```

---

## 5. Проблемы целостности (индексы, FK, каскады)

### 5.1 Критические проблемы

| # | Проблема | Локация | Влияние | Приоритет |
|---|----------|---------|---------|-----------|
| **IC-01** | `Message.senderId` — FK с `onDelete: Cascade` | schema.prisma L264 | При удалении User все его сообщения удаляются CASCADE. **Нарушает BR-10**: "При удалении пользователя его сообщения сохраняются". | 🔴 КРИТИЧЕСКИЙ |
| **IC-02** | `Announcement.authorId` — FK с `onDelete: Cascade` | schema.prisma L295 | При удалении автора объявления оно удаляется. | 🟡 СРЕДНИЙ |
| **IC-03** | `Conversation.plotId` — нет FK | schema.prisma L221 | plot_id просто String? без relation на Plot. Нарушение ссылочной целостности. | 🟡 СРЕДНИЙ |
| **IC-04** | `Conversation.createdBy` — нет FK | schema.prisma L222 | createdBy просто String без relation на User. | 🟡 СРЕДНИЙ |
| **IC-05** | `Message.replyToId` — нет FK на Message | schema.prisma L255 | reply_to_id просто String? без self-relation. DBML указывает `ref: > messages.id`, но Prisma не реализует. | 🟡 СРЕДНИЙ |

### 5.2 Рекомендации по исправлению каскадов

**IC-01 — Исправление onDelete для Message.sender:**
```prisma
// Было:
sender User @relation(fields: [senderId], references: [id], onDelete: Cascade)

// Нужно (два варианта):
// Вариант A — SetNull (сохраняем сообщение, обнуляем отправителя):
senderId String? @map("sender_id")
sender User? @relation(fields: [senderId], references: [id], onDelete: SetNull)

// Вариант B — без FK (просто строка, как createdBy):
senderId String @map("sender_id") // без relation
```

> **Рекомендация:** Вариант A (SetNull) — соответствует BR-10 и позволяет определить "Удалённый пользователь" через null-значения.

### 5.3 Индексы

| Сущность | REQ-индекс | В Prisma | Статус |
|----------|-----------|----------|--------|
| Conversation | — | нет явных индексов | ⚠️ Рекомендуется index(type) |
| ConversationParticipant | (conversation_id, user_id) unique | ✅ @@unique | ✅ |
| ConversationParticipant | user_id | ✅ @@index([userId]) | ✅ |
| Message | (conversation_id, created_at) | ✅ @@index([conversationId, createdAt]) | ✅ |
| Announcement | (status, published_at) | ✅ @@index([status, publishedAt]) | ✅ |
| Announcement | author_id | ✅ @@index([authorId]) | ✅ |

---

## 6. Рассинхронизация Prisma ↔ DBML

### 6.1 DBML опережает Prisma (DBML есть, Prisma нет)

| Поле/Сущность | DBML | Prisma | Статус |
|---------------|------|--------|--------|
| messages.reply_to_id FK | `ref: > messages.id` | просто String? | ⚠️ DBML точнее |
| messages.deleted_by FK | `ref: > users.id` | отсутствует relation | ⚠️ DBML точнее |

### 6.2 Prisma опережает DBML (Prisma есть, DBML нет)

| Поле/Сущность | DBML | Prisma | Статус |
|---------------|------|--------|--------|
| Conversation.description | отсутствует | ✅ String? @db.Text | ⚠️ DBML не обновлён |

### 6.3 DBML устарел (общая схема, не COMMS)

| Элемент | DBML | Присма | Статус |
|---------|------|--------|--------|
| users.role | varchar [ref: > roles] | отсутствует (RBAC) | ❌ DBML устарел |
| users.avatar | varchar | отсутствует (в UserProfile) | ❌ DBML устарел |
| Enum roles | GUEST/MEMBER/ADMIN | нет (Roles table) | ❌ DBML устарел |
| plot_users unique index | (user_id, plot_id, status) | (userId, plotId, role) | ⚠️ рассинхронизация |
| plot_user_history | без old_values/new_values | ✅ Json? | ⚠️ DBML не обновлён |
| document_categories | ✅ | ✅ | ✅ |
| documents | ✅ | ✅ | ✅ |
| document_tags | ✅ | ✅ | ✅ |
| document_tag_links | ✅ | ✅ | ✅ |

> **Итог:** DBML-схема частично устарела и не отражает текущую Prisma-схему RBAC-системы. COMMS-часть DBML в основном соответствует, но отсутствует описание 8 сущностей.

---

## 7. Соответствие конвенциям (conventions.md)

| Правило | Статус | Детали |
|---------|--------|--------|
| snake_case в БД | ✅ | Все поля используют `@map("snake_case")` |
| camelCase в Prisma | ✅ | Все поля camelCase |
| UUID/cuid как PK | ✅ | Все модели используют `@id @default(cuid())` |
| created_at/updated_at с @map() | ✅ | Корректно |
| Внешние ключи с @map() | ✅ | Корректно |

---

## 8. Избыточные элементы (не описаны в REQ)

| Элемент | Локация | REQ | Примечание |
|---------|---------|-----|------------|
| Conversation.description | Prisma L220, DBML нет | Нет | Добавлено сверх REQ. Возможно для групповых чатов. |

> **Вердикт:** Минимальная сверх-функциональность. Поле `description` в Conversation оправданно для групповых чатов (FR-08).

---

## 9. Анализ 8 пробелов из шага 1 (FR без US) и влияние на модель

| FR из шага 1 | Влияние на модель | Текущее состояние |
|--------------|-------------------|-------------------|
| FR-07: Авто-создание чата участка | Conversation.plotId + авто-логика | plotId есть, но без FK на Plot. Логика авто-создания — на уровне service. |
| FR-12: Закрепление сообщений | Message.is_pinned (Boolean) | ❌ Поле отсутствует |
| FR-26..29: Подача жалобы пользователем | MessageReport таблица | ❌ Сущность отсутствует |
| FR-39: Список заблокированных | UserBlock таблица | ❌ Сущность отсутствует |
| FR-44: Файлы к объявлениям | Announcement.file_attachments (Json) | ❌ Поле отсутствует |

---

## 10. Рекомендации по исправлению

### 10.1 Критические (требуют немедленного исправления)

1. **Исправить IC-01:** Изменить `Message.sender` FK с `onDelete: Cascade` на `onDelete: SetNull` + сделать `senderId` nullable. Это критическое нарушение BR-10.

2. **Создать 8 отсутствующих сущностей** (в порядке приоритета):
   - P1: `Notification` — без неё уведомления (FR-48..56) невозможны
   - P1: `MessageReport` — без неё модерация жалоб (FR-26..36) невозможна
   - P1: `UserBlock` — без неё блокировка (FR-32..33) невозможна
   - P1: `ModerationAction` — без неё история модерации (FR-36..40) невозможна
   - P2: `ChatCategory` — без неё категории чатов (FR-15..20) невозможны
   - P2: `PersonalChatFolder` + `ConversationFolderMapping` — без них персональные папки (FR-21..25) невозможны
   - P2: `ConversationCategoryMapping` — связь чатов с категориями
   - P3: `notification_settings` поля в `UserProfile`

3. **Добавить недостающие поля:**
   - `Message.isPinned Boolean @default(false)` — для FR-12
   - `Message.mentions Json?` — для BR-11 (упоминания)
   - `Announcement.category String?` — для FR-42
   - `Announcement.discussionEnabled Boolean @default(false)` — для FR-43
   - `Announcement.fileAttachments Json?` — для FR-44

4. **Добавить недостающие поля в UserProfile:**
   - `notificationEmailEnabled Boolean @default(true)`
   - `notificationEmailFrequency String @default("immediately")`

### 10.2 Средние (рекомендовано исправить)

5. **IC-02:** Изменить `Announcement.author` FK на `onDelete: SetNull` + `authorId` nullable.
6. **IC-03:** Добавить FK для `Conversation.plotId` на Plot с `onDelete: SetNull`.
7. **IC-04:** Добавить FK для `Conversation.createdBy` на User (без каскадного удаления).
8. **IC-05:** Добавить self-relation для `Message.replyToId` на Message с `onDelete: SetNull`.

### 10.3 Низкие

9. **Обновить DBML** — привести в соответствие с Prisma (RBAC, description в Conversation).
10. **Добавить index(type)** для Conversation.

---

## 11. Предлагаемая миграция (без применения)

```sql
-- M1: Исправление каскадного удаления для сообщений
ALTER TABLE messages DROP CONSTRAINT messages_senderId_fkey;
ALTER TABLE messages ALTER COLUMN sender_id DROP NOT NULL;
ALTER TABLE messages ADD CONSTRAINT messages_senderId_fkey
  FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE SET NULL;

-- M2: Добавление полей в messages
ALTER TABLE messages ADD COLUMN is_pinned BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE messages ADD COLUMN mentions JSONB;

-- M3: Добавление полей в announcements
ALTER TABLE announcements ADD COLUMN category VARCHAR(50);
ALTER TABLE announcements ADD COLUMN discussion_enabled BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE announcements ADD COLUMN file_attachments JSONB;

-- M4: Добавление полей в user_profiles
ALTER TABLE user_profiles ADD COLUMN notification_email_enabled BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE user_profiles ADD COLUMN notification_email_frequency VARCHAR(20) NOT NULL DEFAULT 'immediately';

-- M5: Создание таблицы notifications
CREATE TABLE notifications (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR NOT NULL,
  title VARCHAR NOT NULL,
  content TEXT,
  is_read BOOLEAN NOT NULL DEFAULT false,
  related_type VARCHAR,
  related_id VARCHAR,
  created_at TIMESTAMP NOT NULL DEFAULT now()
);
CREATE INDEX idx_notifications_user_read ON notifications(user_id, is_read);
CREATE INDEX idx_notifications_user_created ON notifications(user_id, created_at);

-- M6: Создание таблицы chat_categories
CREATE TABLE chat_categories (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name VARCHAR(100) NOT NULL,
  description VARCHAR(500),
  parent_id VARCHAR REFERENCES chat_categories(id) ON DELETE SET NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by VARCHAR NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now(),
  UNIQUE (name, parent_id)
);

-- M7: Создание таблицы personal_chat_folders
CREATE TABLE personal_chat_folders (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now()
);

-- M8: Создание таблицы conversation_category_mapping
CREATE TABLE conversation_category_mapping (
  conversation_id VARCHAR NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  chat_category_id VARCHAR NOT NULL REFERENCES chat_categories(id) ON DELETE CASCADE,
  assigned_by VARCHAR NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  PRIMARY KEY (conversation_id, chat_category_id)
);

-- M9: Создание таблицы conversation_folder_mapping
CREATE TABLE conversation_folder_mapping (
  conversation_id VARCHAR NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  personal_chat_folder_id VARCHAR NOT NULL REFERENCES personal_chat_folders(id) ON DELETE CASCADE,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  PRIMARY KEY (conversation_id, personal_chat_folder_id)
);

-- M10: Создание таблицы message_reports
CREATE TABLE message_reports (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
  reporter_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  message_id VARCHAR NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  reason VARCHAR NOT NULL,
  comment TEXT,
  status VARCHAR NOT NULL DEFAULT 'PENDING',
  reviewed_by VARCHAR REFERENCES users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  UNIQUE (reporter_id, message_id)
);
CREATE INDEX idx_message_reports_status ON message_reports(status);

-- M11: Создание таблицы moderation_actions
CREATE TABLE moderation_actions (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
  moderator_id VARCHAR NOT NULL,
  target_user_id VARCHAR NOT NULL,
  action_type VARCHAR NOT NULL,
  reason TEXT,
  target_message_id VARCHAR,
  target_conversation_id VARCHAR,
  created_at TIMESTAMP NOT NULL DEFAULT now()
);
CREATE INDEX idx_moderation_actions_moderator ON moderation_actions(moderator_id);
CREATE INDEX idx_moderation_actions_target ON moderation_actions(target_user_id);

-- M12: Создание таблицы user_blocks
CREATE TABLE user_blocks (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id VARCHAR NOT NULL UNIQUE,
  blocked_by VARCHAR NOT NULL,
  reason TEXT NOT NULL,
  blocked_at TIMESTAMP NOT NULL DEFAULT now(),
  unblocked_by VARCHAR,
  unblocked_at TIMESTAMP
);

-- M13: Добавление FK для reply_to_id (self-referencing)
ALTER TABLE messages ADD CONSTRAINT messages_replyToId_fkey
  FOREIGN KEY (reply_to_id) REFERENCES messages(id) ON DELETE SET NULL;

-- M14: Исправление каскада для announcements
ALTER TABLE announcements DROP CONSTRAINT announcements_authorId_fkey;
ALTER TABLE announcements ALTER COLUMN author_id DROP NOT NULL;
ALTER TABLE announcements ADD CONSTRAINT announcements_authorId_fkey
  FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE SET NULL;

-- M15: Добавление FK для conversation.plot_id
ALTER TABLE conversations ADD CONSTRAINT conversations_plotId_fkey
  FOREIGN KEY (plot_id) REFERENCES plots(id) ON DELETE SET NULL;
```

---

## 12. Сводка

| Метрика | Значение |
|---------|----------|
| REQ-сущностей (§8) | 12 новых + 2 изменения |
| Реализовано в Prisma | 4 базовых сущности |
| Отсутствует в Prisma | **8 сущностей + 10 полей** |
| Критических проблем целостности | 1 (IC-01: CASCADE на Message.sender) |
| Средних проблем целостности | 4 (IC-02..IC-05) |
| Рассинхронизация Prisma↔DBML | 7 элементов |
| Избыточные элементы | 1 (Conversation.description) |
| Соответствие конвенциям | ✅ Полное |

### Вердикт: ❌ FAIL

Модель данных домена COMMS **не покрывает требования REQ-COMMS-001**:

1. **8 из 12 требуемых сущностей отсутствуют** (67% модели не реализовано)
2. **10 полей отсутствуют** в реализованных сущностях
3. **Критическое нарушение бизнес-правила BR-10** — каскадное удаление сообщений при удалении пользователя
4. **4 проблемы ссылочной целостности** — FK не определены для plot_id, created_by, reply_to_id, deleted_by
5. **DBML частично устарел** и не отражает текущую схему RBAC

Без исправлений модель данных не поддерживает ключевые функции: уведомления, модерацию, категории чатов, персональные папки, жалобы, блокировки.

### Приоритетные действия

| Приоритет | Действие | Оценка |
|-----------|----------|--------|
| P0 | Исправить IC-01 (CASCADE → SET NULL для Message.sender) | 15 мин |
| P1 | Создать таблицы Notification, MessageReport, UserBlock, ModerationAction | 2-3 часа |
| P2 | Создать таблицы ChatCategory, PersonalChatFolder + mapping таблицы | 1-2 часа |
| P2 | Добавить недостающие поля (is_pinned, mentions, category, discussion_enabled, file_attachments) | 30 мин |
| P3 | Добавить поля настроек уведомлений в UserProfile | 15 мин |
| P3 | Исправить FK целостность (IC-02..IC-05) | 30 мин |
| P4 | Обновить DBML | 1 час |

**Общий объём работ:** ~5-6 часов (включая миграции, seed, тесты).

---

**Последнее обновление:** 2026-07-26
**Статус:** Аудит завершён — требует исправлений
