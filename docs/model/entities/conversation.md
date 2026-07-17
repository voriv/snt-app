# Conversation

## Описание

Диалог (разговор) между пользователями системы. Может быть личным (DIRECT), групповым (GROUP) или чатом обсуждения объявления (ANNOUNCEMENT). Каждый диалог имеет набор участников (через `conversation_participants`) и поток сообщений (через `messages`).

## Поля

| Поле | Тип | Обязательное | Описание | Бизнес-правила |
|------|-----|-------------|----------|----------------|
| `id` | String | Да | Уникальный идентификатор | Генерируется автоматически (cuid) |
| `type` | ConversationType | Да | Тип диалога (DIRECT, GROUP, ANNOUNCEMENT) | По умолчанию: DIRECT |
| `title` | String? | Нет | Название диалога | Используется для групповых чатов |
| `plot_id` | String? | Нет | Ссылка на участок СНТ | Опциональная связь с участком |
| `created_by` | String | Да | ID создателя диалога | Внешний ключ на users.id |
| `created_at` | DateTime | Да | Дата создания диалога | Генерируется автоматически |
| `updated_at` | DateTime | Да | Дата последнего обновления | Обновляется при каждом изменении |

## Связи

| Сущность | Тип связи | Описание |
|----------|-----------|----------|
| User (created_by) | belongs_to | Создатель диалога |
| Plot | belongs_to (опционально) | Связанный участок СНТ |
| ConversationParticipant | has_many | Участники диалога |
| Message | has_many | Сообщения в диалоге |

## Индексы

| Поля | Тип | Описание |
|------|-----|----------|
| `type` | index | Для фильтрации по типу диалога |

## Бизнес-инварианты

- Личный диалог (DIRECT) создаётся между двумя пользователями
- Тип диалога определяется при создании и не изменяется
- Создатель диалога автоматически становится участником с ролью OWNER
- При удалении диалога удаляются все его участники и сообщения (CASCADE)

## Конвенции именования

- **БД (PostgreSQL):** `conversations`, `id`, `type`, `title`, `plot_id`, `created_by`, `created_at`, `updated_at`
- **Prisma:** `Conversation`, `id`, `type`, `title`, `plotId`, `createdBy`, `createdAt`, `updatedAt`
- **TypeScript домен:** `Conversation`, `id: string`, `type: ConversationType`, `title: string | null`, `plotId: string | null`, `createdBy: string`, `createdAt: Date`, `updatedAt: Date`

---

# ConversationParticipant

## Описание

Связь между пользователем и диалогом. Определяет роль пользователя в диалоге и отслеживает время присоединения и последнего прочтения.

## Поля

| Поле | Тип | Обязательное | Описание | Бизнес-правила |
|------|-----|-------------|----------|----------------|
| `id` | String | Да | Уникальный идентификатор | Генерируется автоматически (cuid) |
| `conversation_id` | String | Да | ID диалога | Внешний ключ на conversations.id |
| `user_id` | String | Да | ID пользователя | Внешний ключ на users.id |
| `role` | ParticipantRole | Да | Роль в диалоге (OWNER, ADMIN, MEMBER) | По умолчанию: MEMBER |
| `joined_at` | DateTime | Да | Дата присоединения | Генерируется автоматически |
| `last_read_at` | DateTime? | Нет | Дата последнего прочтения | Используется для подсчёта непрочитанных |

## Связи

| Сущность | Тип связи | Описание |
|----------|-----------|----------|
| Conversation | belongs_to | Диалог, участником которого является пользователь |
| User | belongs_to | Пользователь-участник |

## Индексы

| Поля | Тип | Описание |
|------|-----|----------|
| `(conversation_id, user_id)` | unique | Уникальная комбинация |
| `user_id` | index | Для поиска всех диалогов пользователя |

## Бизнес-инварианты

- Один пользователь может быть участником диалога только один раз
- Создатель диалога автоматически получает роль OWNER
- Роль OWNER не может быть изменена на другую
- last_read_at используется для расчёта количества непрочитанных сообщений

## Конвенции именования

- **БД (PostgreSQL):** `conversation_participants`, `conversation_id`, `user_id`, `role`, `joined_at`, `last_read_at`
- **Prisma:** `ConversationParticipant`, `conversationId`, `userId`, `role`, `joinedAt`, `lastReadAt`
- **TypeScript домен:** `ConversationParticipant`, `conversationId: string`, `userId: string`, `role: ParticipantRole`, `joinedAt: Date`, `lastReadAt: Date | null`

@see docs/model/entities/message.md — сущность Message
