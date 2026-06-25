# Модель данных

> 📌 Контекстный сегмент. Полная версия: [`04-database-core.md`](../architecture/structure/04-database-core.md), [`05-database-social.md`](../architecture/structure/05-database-social.md)

---

## Обзор

19 сущностей в 5 доменах. ORM: Prisma 6, БД: PostgreSQL 16.

---

## Core (ядро СНТ)

| Сущность | Ключевые поля | Enum | Связи |
|----------|---------------|------|-------|
| `User` | id, email, passwordHash, role, name, phone, isActive | `UserRole`: ADMIN, MEMBER, GUEST | 1:1 Member, 1:N Notifications/ForumPosts/ChatMessages/VoteResponses/Documents/Announcements |
| `Member` | id, userId, surname, firstName, patronymic, address, snn | — | N:N Plot (через PlotMembership), 1:N Payment |
| `Plot` | id, number, area, address, cadastralNum, status | `PlotStatus`: ACTIVE, INACTIVE, ABANDONED | N:N Member, 1:N Charge |
| `PlotMembership` | id, plotId, memberId, role, share, since, until | `MembershipRole`: OWNER, CO_OWNER, TENANT, FAMILY | N:1 Plot, N:1 Member |

**Ограничения:** `User.email` — unique, `Plot.number` — unique, `PlotMembership` — unique(plotId, memberId, since)

---

## Бухгалтерия

| Сущность | Ключевые поля | Enum | Связи |
|----------|---------------|------|-------|
| `Charge` | id, plotId, type, amount, description, period, dueDate, status | `ChargeType`: MEMBERSHIP_FEE, TARGET_FEE, ELECTRICITY, WATER, LAND_TAX, OTHER. `ChargeStatus`: PENDING, PARTIALLY_PAID, PAID, CANCELLED | N:1 Plot, 1:N Payment |
| `Payment` | id, memberId, chargeId, amount, method, receiptNum, paidAt | `PaymentMethod`: CASH, CARD, TRANSFER, SBERPAY, OTHER | N:1 Member, N:1 Charge (опционально) |

**Бизнес-правило:** `Charge.amount` — Decimal(12,2), `Payment.amount` — Decimal(12,2)

---

## Публикации

| Сущность | Ключевые поля | Enum | Связи |
|----------|---------------|------|-------|
| `File` | id, originalName, mimeType, size, content (bytea), isDeleted | — | 1:N Document |
| `Document` | id, title, description, category, isPublic, uploadedById, fileId | `DocCategory`: CHARTER, PROTOCOL, RULE, REPORT, CONTRACT, INVOICE, OTHER | N:1 User, N:1 File |
| `Announcement` | id, title, content, isPinned, isPublic, authorId | — | N:1 User |
| `InfoPage` | id, slug, title, content, isPublic | — | — |

**Хранение файлов:** PostgreSQL bytea (не файловая система). `InfoPage.slug` — unique.

---

## Голосования

| Сущность | Ключевые поля | Enum | Связи |
|----------|---------------|------|-------|
| `Vote` | id, title, description, type, status, isAnonymous, startedAt, endedAt | `VoteType`: SINGLE_CHOICE, MULTIPLE_CHOICE. `VoteStatus`: DRAFT, ACTIVE, CLOSED | 1:N VoteOption, 1:N VoteResponse |
| `VoteOption` | id, voteId, text, sortOrder | — | N:1 Vote, 1:N VoteResponse |
| `VoteResponse` | id, voteId, optionId, userId | — | N:1 Vote, N:1 VoteOption, N:1 User |

**Ограничение:** `VoteResponse` — unique(userId, voteId, optionId)

---

## Общение

| Сущность | Ключевые поля | Enum | Связи |
|----------|---------------|------|-------|
| `ForumTopic` | id, title, isPinned, isLocked, authorId | — | 1:N ForumPost |
| `ForumPost` | id, topicId, authorId, content, parentId | — | N:1 ForumTopic, N:1 User, self-referencing (replies) |
| `Chat` | id, type, name | `ChatType`: PRIVATE, GROUP | 1:N ChatMessage, N:M User (через ChatParticipant) |
| `ChatParticipant` | id, chatId, userId, lastReadAt | — | N:1 Chat, N:1 User |
| `ChatMessage` | id, chatId, senderId, content | — | N:1 Chat, N:1 User |
| `Notification` | id, userId, type, title, content, link, isRead | `NotificationType`: ANNOUNCEMENT, VOTE_STARTED, VOTE_ENDED, CHARGE_CREATED, PAYMENT_RECEIVED, DOCUMENT_UPLOADED, CHAT_MESSAGE, FORUM_REPLY, SYSTEM | N:1 User |

**Ограничение:** `ChatParticipant` — unique(chatId, userId)

---

## Индексы

| Таблица | Индекс | Назначение |
|---------|--------|-----------|
| charges | (plotId, period) | Начисления по участку за период |
| charges | (status) | Фильтр по статусу |
| payments | (memberId) | Платежи садовода |
| payments | (chargeId) | Платежи по начислению |
| notifications | (userId, isRead) | Непрочитанные уведомления |
| chat_messages | (chatId, createdAt) | Сообщения чата по порядку |
| vote_responses | (userId, voteId) | Проверка: голосовал ли |
| documents | (category) | Фильтр по категории |
| forum_posts | (topicId) | Посты темы |

---

## ER-диаграмма (ключевые связи)

```
User 1:1 Member
Member N:N Plot (через PlotMembership)
Plot 1:N Charge
Member 1:N Payment
Charge 1:N Payment
User 1:N Document/Announcement/ForumPost/ChatMessage/Notification/VoteResponse
Vote 1:N VoteOption 1:N VoteResponse
ForumTopic 1:N ForumPost
Chat 1:N ChatMessage, N:M User (через ChatParticipant)
```

---

📄 Полная схема: [`prisma/schema.prisma`](../../prisma/schema.prisma)
📄 Core модели: [`04-database-core.md`](../architecture/structure/04-database-core.md)
📄 Social модели: [`05-database-social.md`](../architecture/structure/05-database-social.md)