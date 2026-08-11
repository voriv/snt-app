/**
 * @type ConversationType
 * @domain comms
 * @description Тип диалога
 *
 * @spec
 * - DIRECT: личный диалог между двумя пользователями
 * - GROUP: групповой чат
 * - ANNOUNCEMENT: чат обсуждения объявления
 */
export type ConversationType = 'DIRECT' | 'GROUP' | 'ANNOUNCEMENT';

/**
 * @type ParticipantRole
 * @domain comms
 * @description Роль участника в диалоге
 *
 * @spec
 * - OWNER: создатель диалога (не может быть изменена)
 * - ADMIN: администратор диалога
 * - MEMBER: обычный участник
 */
export type ParticipantRole = 'OWNER' | 'ADMIN' | 'MEMBER';

/**
 * @type Conversation
 * @domain comms
 * @description Диалог (разговор) между пользователями
 *
 * @spec
 * - Бизнес-ключ: id (cuid)
 * - Жизненный цикл: создаётся администратором или пользователем
 * - Инварианты: type обязателен, createdBy обязателен
 *
 * @see docs/model/entities/conversation.md — концептуальная модель
 */
export interface Conversation {
  /** Уникальный идентификатор. Генерируется автоматически cuid */
  id: string;
  /** Тип диалога */
  type: ConversationType;
  /** Название диалога (для групповых чатов) */
  title: string | null;
  /** Описание диалога (для групповых чатов) */
  description: string | null;
  /** ID связанного участка СНТ */
  plotId: string | null;
  /** ID создателя диалога */
  createdBy: string;
  /** Дата создания диалога */
  createdAt: Date;
  /** Дата последнего обновления диалога */
  updatedAt: Date;
}

/**
 * @type ConversationParticipant
 * @domain comms
 * @description Участник диалога
 *
 * @spec
 * - Бизнес-ключ: (conversationId, userId) — уникальная комбинация
 * - Роль по умолчанию: MEMBER
 * - lastReadAt используется для расчёта непрочитанных сообщений
 *
 * @see docs/model/entities/conversation.md — концептуальная модель
 */
export interface ConversationParticipant {
  /** Уникальный идентификатор. Генерируется автоматически cuid */
  id: string;
  /** ID диалога */
  conversationId: string;
  /** ID пользователя */
  userId: string;
  /** Роль в диалоге */
  role: ParticipantRole;
  /** Дата присоединения */
  joinedAt: Date;
  /** Дата последнего прочтения */
  lastReadAt: Date | null;
}

/**
 * @type Message
 * @domain comms
 * @description Сообщение в диалоге
 *
 * @spec
 * - Бизнес-ключ: id (cuid)
 * - content обязательно, не пустое
 * - replyToId — опциональная ссылка на цитируемое сообщение
 * - isDeleted — флаг мягкого удаления
 *
 * @see docs/model/entities/message.md — концептуальная модель
 */
export interface Message {
  /** Уникальный идентификатор. Генерируется автоматически cuid */
  id: string;
  /** ID диалога */
  conversationId: string;
  /** ID отправителя */
  senderId: string;
  /** Имя отправителя (firstName + lastName). Заполняется в репозитории. Опционально для UI */
  senderName?: string;
  /** Email отправителя. Заполняется в репозитории. Используется как fallback для отображения */
  senderEmail?: string;
  /** URL аватара отправителя. Заполняется в репозитории */
  senderAvatarUrl?: string | null;
  /** Текст сообщения */
  content: string;
  /** ID цитируемого сообщения */
  replyToId: string | null;
  /** Флаг мягкого удаления */
  isDeleted: boolean;
  /** ID пользователя, удалившего сообщение */
  deletedBy: string | null;
  /** Время мягкого удаления */
  deletedAt: Date | null;
  /** Дата отправки (string для JSON API, Date для Prisma) */
  createdAt: Date | string;
  /** Дата последнего редактирования (string для JSON API, Date для Prisma) */
  updatedAt: Date | string;
}

/**
 * @type MessageWithReadStatus
 * @domain comms
 * @description Сообщение с информацией о статусе прочтения
 *
 * @spec
 * - Для DIRECT: isReadByRecipient — прочитал ли собеседник
 * - Для GROUP: readByCount — количество прочитавших, totalParticipants — общее число получателей кроме автора
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
  /** Уникальный идентификатор сообщения */
  id: string;
  /** ID диалога */
  conversationId: string;
  /** ID отправителя */
  senderId: string;
  /** Имя отправителя (firstName + lastName). Заполняется в репозитории */
  senderName?: string;
  /** Email отправителя. Заполняется в репозитории */
  senderEmail?: string;
  /** URL аватара отправителя. Заполняется в репозитории */
  senderAvatarUrl?: string | null;
  /** Текст сообщения */
  content: string;
  /** ID цитируемого сообщения */
  replyToId: string | null;
  /** Флаг мягкого удаления */
  isDeleted: boolean;
  /** ID пользователя, удалившего сообщение */
  deletedBy: string | null;
  /** Время мягкого удаления */
  deletedAt: Date | null;
  /** Дата отправки (string для JSON API, Date для Prisma) */
  createdAt: Date | string;
  /** Дата последнего редактирования (string для JSON API, Date для Prisma) */
  updatedAt: Date | string;
  /**
   * Сообщение прочитано получателем (для DIRECT).
   * Всегда определён для DIRECT и GROUP (для GROUP = readByCount > 0).
   */
  isReadByRecipient: boolean;
  /** Количество прочитавших (для GROUP) */
  readByCount?: number;
  /** Общее число получателей кроме автора (для GROUP) */
  totalParticipants?: number;
}

/**
 * @type ConversationListItem
 * @domain comms
 * @description DTO для отображения диалога в списке
 *
 * @spec
 * - conversationId: ID диалога для перехода
 * - participantId: ID собеседника (не текущего пользователя)
 * - participantName: имя собеседника для отображения
 * - participantAvatar: опциональный аватар собеседника
 * - lastMessagePreview: превью последнего сообщения (обрезанное до 60 символов)
 * - lastMessageAt: время последнего сообщения
 * - unreadCount: количество непрочитанных сообщений
 */
export interface ConversationListItem {
  /** ID диалога */
  conversationId: string;
  /** ID собеседника (другой участник личного диалога) */
  participantId: string;
  /** Имя собеседника */
  participantName: string;
  /** Email собеседника */
  participantEmail: string | null;
  /** URL аватара собеседника */
  participantAvatar: string | null;
  /** Превью последнего сообщения (максимум 60 символов) */
  lastMessagePreview: string | null;
  /** Время последнего сообщения */
  lastMessageAt: Date;
  /** Количество непрочитанных сообщений */
  unreadCount: number;
}

/**
 * @type ConversationListResponse
 * @domain comms
 * @description Ответ API со списком диалогов пользователя
 *
 * @spec
 * - items: массив диалогов, отсортированных по lastMessageAt (DESC)
 * - total: общее количество диалогов
 */
export interface ConversationListResponse {
  /** Список диалогов */
  items: ConversationListItem[];
  /** Общее количество диалогов */
  total: number;
}

/**
 * @type CreateConversationData
 * @domain comms
 * @description Данные для создания личного диалога
 *
 * @spec
 * - participantId: ID собеседника (не текущего пользователя)
 */
export interface CreateConversationData {
  /** ID собеседника */
  participantId: string;
}

/**
 * @type CreateConversationResult
 * @domain comms
 * @description Результат создания/поиска диалога
 *
 * @spec
 * - conversationId: ID диалога для перехода
 * - isNew: true если диалог был создан, false если уже существовал
 */
export interface CreateConversationResult {
  /** ID диалога */
  conversationId: string;
  /** Флаг: true если диалог был создан, false если уже существовал */
  isNew: boolean;
}

/**
 * @type SendMessageData
 * @domain comms
 * @description Данные для отправки сообщения
 *
 * @spec
 * - content: текст сообщения (обязательно для type='text', максимум 4000 символов)
 * - type: тип сообщения ('text' по умолчанию)
 */
export interface SendMessageData {
  /** Текст сообщения (максимум 4000 символов) */
  content: string;
  /** Тип сообщения @default 'text' */
  type?: 'text' | 'file';
  /** ID цитируемого сообщения (опционально) */
  replyToId?: string | null;
}

/**
 * @type ChatListItem
 * @domain comms
 * @description DTO для отображения группового чата в списке
 *
 * @spec
 * - chatId: ID чата для перехода
 * - name: название чата для отображения
 * - lastMessagePreview: превью последнего сообщения (обрезанное до 60 символов)
 * - lastMessageAt: время последнего сообщения
 * - participantCount: количество участников
 * - unreadCount: количество непрочитанных сообщений
 */
export interface ChatListItem {
  /** ID чата */
  chatId: string;
  /** Название чата */
  name: string;
  /** Превью последнего сообщения (максимум 60 символов) */
  lastMessagePreview: string | null;
  /** Время последнего сообщения */
  lastMessageAt: Date;
  /** Количество участников */
  participantCount: number;
  /** Количество непрочитанных сообщений */
  unreadCount: number;
}

/**
 * @type ChatListResponse
 * @domain comms
 * @description Ответ API со списком групповых чатов пользователя
 *
 * @spec
 * - items: массив чатов, отсортированных по lastMessageAt (DESC)
 */
export interface ChatListResponse {
  /** Список групповых чатов */
  items: ChatListItem[];
  /** Общее количество чатов */
  total: number;
}

/**
 * @type CreateChatData
 * @domain comms
 * @description Данные для создания группового чата
 *
 * @spec
 * - name: название чата (обязательно, 2–100 символов)
 * - description: описание чата (опционально, максимум 500 символов)
 * - participantIds: массив ID участников (минимум 1 пользователь + создатель = 2, максимум 50)
 */
export interface CreateChatData {
  /** Название чата (2–100 символов) */
  name: string;
  /** Описание чата (опционально, максимум 500 символов) */
  description: string | null;
  /** ID участников (минимум 1, максимум 50) — без учёта создателя */
  participantIds: string[];
}

/**
 * @type ChatMemberRole
 * @domain comms
 * @description Отображаемая роль участника группового чата
 *
 * @spec
 * - owner: «Создатель» — создатель чата, имеет все права
 * - admin: «Администратор» — может управлять участниками
 * - member: «Участник» — обычный участник
 */
export type ChatMemberRole = 'owner' | 'admin' | 'member';

/**
 * @type UpdateChatData
 * @domain comms
 * @description Данные для обновления информации о групповом чате
 *
 * @spec
 * - name: опциональное обновление названия (2-100 символов)
 * - description: опциональное обновление описания (0-500 символов)
 */
export interface UpdateChatData {
  /** Название чата (2-100 символов, опционально) */
  name?: string;
  /** Описание чата (максимум 500 символов, опционально) */
  description?: string | null;
}

/**
 * @type MessageListItem
 * @domain comms
 * @description DTO для отображения сообщения в списке
 *
 * @spec
 * - messageId: ID сообщения для удаления/ответа
 * - content: текст сообщения с форматированием
 * - createdAt: время отправки
 * - readAt: время прочтения (опционально, для статусов)
 * - authorId: ID отправителя
 * - authorName: имя отправителя
 * - authorAvatar: аватар отправителя (опционально)
 * - isOwn: true если сообщение принадлежит текущему пользователю
 * - isDeleted: true если сообщение мягко удалено
 * - deletedBy: ID пользователя, удалившего сообщение (опционально)
 */
export interface MessageListItem {
  /** Уникальный идентификатор сообщения */
  messageId: string;
  /** Текст сообщения с форматированием (markdown-like) */
  content: string;
  /** Время отправки */
  createdAt: Date;
  /** Время прочтения (для статусов read) */
  readAt: Date | null;
  /** ID отправителя */
  authorId: string;
  /** Имя отправителя */
  authorName: string;
  /** URL аватара отправителя */
  authorAvatar: string | null;
  /** Флаг: true если сообщение принадлежит текущему пользователю */
  isOwn: boolean;
  /** Флаг мягкого удаления */
  isDeleted: boolean;
  /** ID пользователя, удалившего сообщение */
  deletedBy: string | null;
}

/**
 * @type ConversationMessagesResponse
 * @domain comms
 * @description Ответ API со списком сообщений диалога
 *
 * @spec
 * - messages: массив сообщений, отсортированных по createdAt (ASC)
 * - hasMore: true если есть ещё сообщения для загрузки (пагинация)
 * - unreadCount: количество непрочитанных сообщений текущего пользователя
 */
export interface ConversationMessagesResponse {
  /** Список сообщений в хронологическом порядке */
  messages: MessageListItem[];
  /** Флаг: true если есть ещё сообщения для подгрузки */
  hasMore: boolean;
  /** Количество непрочитанных сообщений */
  unreadCount: number;
}

/**
 * @type MessageDeleteData
 * @domain comms
 * @description Данные удаления сообщения
 *
 * @spec
 * - messageId: ID сообщения для удаления
 * - deletedBy: ID пользователя, удаляющего сообщение
 * - deletedAt: время удаления
 */
export interface MessageDeleteData {
  /** ID сообщения */
  messageId: string;
  /** ID пользователя, удаляющего сообщение */
  deletedBy: string;
  /** Время удаления */
  deletedAt: Date;
}

/**
 * @type MessageReaction
 * @domain comms
 * @description Реакция на сообщение
 *
 * @spec
 * - type: тип реакции (эмодзи)
 * - userId: ID пользователя, добавившего реакцию
 */
export interface MessageReaction {
  /** Уникальный идентификатор реакции */
  id: string;
  /** ID сообщения */
  messageId: string;
  /** Тип реакции (эмодзи) */
  type: string;
  /** ID пользователя, добавившего реакцию */
  userId: string;
  /** Время создания реакции */
  createdAt: Date;
}

/**
 * @type MessageReadStatus
 * @domain comms
 * @description Статус прочтения сообщения
 *
 * @spec
 * - Управляется ConversationParticipant.lastReadAt
 * - Используется для расчёта unreadCount
 */
export interface MessageReadStatus {
  /** ID сообщения */
  messageId: string;
  /** Время последнего прочтения */
  lastReadAt: Date | null;
  /** Количество непрочитанных сообщений в диалоге */
  unreadCount: number;
}

/**
 * @type ChatParticipantListItem
 * @domain comms
 * @description DTO для отображения участника группового чата в списке
 *
 * @spec
 * - userId: ID пользователя
 * - role: роль в чате (conversation role)
 * - displayName: имя пользователя для отображения
 * - isOwner: флаг создателя чата
 * - isCurrent: флаг текущего пользователя
 */
export interface ChatParticipantListItem {
  /** ID пользователя */
  userId: string;
  /** Роль участника */
  role: ParticipantRole;
  /** Отображаемое имя пользователя */
  displayName: string;
  /** Является ли создателем чата */
  isOwner: boolean;
  /** Является ли текущим пользователем */
  isCurrent: boolean;
}

/**
 * @type ChatParticipantsListResponse
 * @domain comms
 * @description Ответ API со списком участников группового чата
 *
 * @spec
 * - participants: массив участников чата
 * - count: количество участников (равно длине массива)
 */
export interface ChatParticipantsListResponse {
  /** Список участников чата */
  participants: ChatParticipantListItem[];
  /** Общее количество участников */
  count: number;
}

/**
 * @type ChatParticipantAddRequest
 * @domain comms
 * @description Запрос на добавление участника в чат
 *
 * @spec
 * - userId: обязательный ID пользователя для добавления
 */
export interface ChatParticipantAddRequest {
  /** ID пользователя для добавления */
  userId: string;
}

/**
 * @type UnreadCounts
 * @domain comms
 * @description Счётчики непрочитанных сообщений по категориям
 *
 * @covers AC-1 (US-21-37): messages — непрочитанные в личных диалогах
 * @covers AC-2 (US-21-37): chats — непрочитанные в групповых чатах
 * @see component-spec.md → 3.1.1
 */
export interface UnreadCounts {
  /** Количество непрочитанных сообщений в личных диалогах (DIRECT) */
  messages: number;
  /** Количество непрочитанных сообщений в групповых чатах (GROUP) */
  chats: number;
}
