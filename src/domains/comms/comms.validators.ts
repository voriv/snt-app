import { z } from 'zod';

/**
 * @domain comms
 * @description Zod-схема валидации query-параметров для получения списка диалогов
 *
 * @spec
 * - search: опциональный поиск по имени собеседника (минимум 2 символа)
 * - limit: опциональное ограничение количества (1-100)
 * - page: опциональный номер страницы (начиная с 1)
 */
export const getConversationsQuerySchema = z.object({
  /** Поисковый запрос по имени собеседника (минимум 2 символа) */
  search: z
    .string()
    .min(2, 'Поисковый запрос должен содержать минимум 2 символа')
    .max(100, 'Поисковый запрос не может превышать 100 символов')
    .optional(),
  /** Количество элементов на странице (1-100) */
  limit: z
    .string()
    .optional()
    .transform((val) => {
      if (val === undefined) return undefined;
      const num = Number(val);
      if (Number.isNaN(num)) return undefined;
      return num;
    })
    .refine((val) => val === undefined || (val >= 1 && val <= 100), {
      message: 'Количество элементов должно быть от 1 до 100',
    }),
  /** Номер страницы (начиная с 1) */
  page: z
    .string()
    .optional()
    .transform((val) => {
      if (val === undefined) return undefined;
      const num = Number(val);
      if (Number.isNaN(num)) return undefined;
      return num;
    })
    .refine((val) => val === undefined || val >= 1, {
      message: 'Номер страницы должен быть не менее 1',
    }),
});

/**
 * @domain comms
 * @description Zod-схема валидации структуры ConversationListItem
 *
 * @spec
 * - conversationId: обязательный строковый ID
 * - participantId: обязательный строковый ID
 * - participantName: обязательная строка (1-100 символов)
 * - participantAvatar: опциональная строка
 * - lastMessagePreview: опциональная строка (максимум 60 символов)
 * - lastMessageAt: обязательная дата
 * - unreadCount: неотрицательное число
 */
export const conversationListItemSchema = z.object({
  /** ID диалога */
  conversationId: z.string().min(1, 'ID диалога не может быть пустым'),
  /** ID собеседника */
  participantId: z.string().min(1, 'ID собеседника не может быть пустым'),
  /** Имя собеседника */
  participantName: z
    .string()
    .min(1, 'Имя собеседника не может быть пустым')
    .max(100, 'Имя собеседника не может превышать 100 символов'),
  /** URL аватара собеседника */
  participantAvatar: z.string().nullable().optional(),
  /** Превью последнего сообщения */
  lastMessagePreview: z
    .string()
    .max(60, 'Превью сообщения не может превышать 60 символов')
    .nullable()
    .optional(),
  /** Время последнего сообщения */
  lastMessageAt: z.date(),
  /** Количество непрочитанных */
  unreadCount: z.number().int().min(0, 'Количество непрочитанных не может быть отрицательным'),
});

/**
 * @domain comms
 * @description Zod-схема валидации ответа со списком диалогов
 */
export const conversationListResponseSchema = z.object({
  /** Список диалогов */
  items: z.array(conversationListItemSchema),
  /** Общее количество диалогов */
  total: z.number().int().min(0, 'Общее количество не может быть отрицательным'),
});

/**
 * @domain comms
 * @description Zod-схема валидации данных для создания личного диалога
 *
 * @spec
 * - participantId: обязательный строковый ID собеседника
 */
export const createConversationSchema = z.object({
  /** ID собеседника */
  participantId: z.string().min(1, 'ID собеседника не может быть пустым'),
});

/**
 * @domain comms
 * @description Zod-схема валидации данных для отправки сообщения
 *
 * @spec
 * - content: обязательный текст сообщения (1-4000 символов)
 * - type: опциональный тип ('text' | 'file'), по умолчанию 'text'
 * - replyToId: опциональный ID цитируемого сообщения
 */
export const sendMessageSchema = z.object({
  /** Текст сообщения (1-4000 символов) */
  content: z
    .string()
    .min(1, 'Сообщение не может быть пустым')
    .max(4000, 'Сообщение слишком длинное (максимум 4000 символов)'),
  /** Тип сообщения @default 'text' */
  type: z.enum(['text', 'file']).default('text'),
  /** ID цитируемого сообщения (опционально) */
  replyToId: z.string().nullable().optional(),
});

/**
 * @domain comms
 * @description Zod-схема валидации данных для создания группового чата
 *
 * @spec
 * - name: обязательное название чата (2-100 символов)
 * - description: опциональное описание (пустая строка → null, максимум 500 символов)
 * - participantIds: массив ID участников (минимум 1, максимум 50) — без учёта создателя
 */
export const createChatSchema = z.object({
  /** Название чата (2-100 символов) */
  name: z
    .string()
    .min(2, 'Название чата должно содержать минимум 2 символа')
    .max(100, 'Название чата не может превышать 100 символов'),
  /** Описание чата (опционально, максимум 500 символов) */
  description: z
    .string()
    .max(500, 'Описание не может превышать 500 символов')
    .optional()
    .or(z.literal(''))
    .or(z.null())
    .transform((val) => (val === '' || val === undefined ? null : val)),
  /** ID участников (минимум 1, максимум 50) — без учёта создателя */
  participantIds: z
    .array(z.string().min(1, 'ID участника не может быть пустым'))
    .min(1, 'Добавьте хотя бы одного участника (вместе с вами будет минимум 2)')
    .max(50, 'Максимум 50 участников в чате'),
});

/**
 * @domain comms
 * @description Zod-схема валидации MessageListItem
 *
 * @spec
 * - messageId: обязательный строковый ID
 * - content: обязательный текст сообщения (1-4000 символов)
 * - createdAt: обязательная дата
 * - readAt: опциональная дата (для статусов прочтения)
 * - authorId: обязательный строковый ID
 * - authorName: обязательная строка (1-100 символов)
 * - authorAvatar: опциональная строка
 * - isOwn: обязательный булев флаг
 * - isDeleted: обязательный булев флаг
 * - deletedBy: опциональный строковый ID
 */
export const messageListItemSchema = z.object({
  /** ID сообщения */
  messageId: z.string().min(1, 'ID сообщения не может быть пустым'),
  /** Текст сообщения */
  content: z
    .string()
    .min(1, 'Сообщение не может быть пустым')
    .max(4000, 'Сообщение слишком длинное (максимум 4000 символов)'),
  /** Время отправки */
  createdAt: z.date(),
  /** Время прочтения */
  readAt: z.date().nullable().optional(),
  /** ID отправителя */
  authorId: z.string().min(1, 'ID отправителя не может быть пустым'),
  /** Имя отправителя */
  authorName: z
    .string()
    .min(1, 'Имя отправителя не может быть пустым')
    .max(100, 'Имя отправителя не может превышать 100 символов'),
  /** URL аватара отправителя */
  authorAvatar: z.string().nullable().optional(),
  /** Флаг: принадлежит ли сообщение текущему пользователю */
  isOwn: z.boolean(),
  /** Флаг мягкого удаления */
  isDeleted: z.boolean(),
  /** ID пользователя, удалившего сообщение */
  deletedBy: z.string().nullable().optional(),
});

/**
 * @domain comms
 * @description Zod-схема валидации данных для обновления группового чата
 *
 * @spec
 * - name: опциональное обновление названия (2-100 символов)
 * - description: опциональное обновление описания (0-500 символов, пустая строка → null)
 */
export const updateChatSchema = z.object({
  /** Название чата (2-100 символов, опционально) */
  name: z
    .string()
    .min(2, 'Название чата должно содержать минимум 2 символа')
    .max(100, 'Название чата не может превышать 100 символов')
    .optional(),
  /** Описание чата (максимум 500 символов, опционально) */
  description: z
    .string()
    .max(500, 'Описание не может превышать 500 символов')
    .optional()
    .or(z.literal(''))
    .transform((val) => (val === '' || val === undefined ? null : val)),
});

/**
 * @domain comms
 * @description Zod-схема валидации ответа со списком сообщений диалога
 */
export const conversationMessagesResponseSchema = z.object({
  /** Список сообщений в хронологическом порядке */
  messages: z.array(messageListItemSchema),
  /** Флаг: есть ли ещё сообщения для подгрузки */
  hasMore: z.boolean(),
  /** Количество непрочитанных сообщений */
  unreadCount: z.number().int().min(0, 'Количество непрочитанных не может быть отрицательным'),
});

/**
 * @domain comms
 * @description Zod-схема валидации данных для удаления сообщения
 */
export const messageDeleteSchema = z.object({
  /** ID сообщения */
  messageId: z.string().min(1, 'ID сообщения не может быть пустым'),
  /** ID пользователя, удаляющего сообщение */
  deletedBy: z.string().min(1, 'ID пользователя не может быть пустым'),
  /** Время удаления */
  deletedAt: z.date(),
});

/**
 * @domain comms
 * @description Zod-схема валидации MessageReaction
 */
export const messageReactionSchema = z.object({
  /** ID реакции */
  id: z.string().min(1, 'ID реакции не может быть пустым'),
  /** ID сообщения */
  messageId: z.string().min(1, 'ID сообщения не может быть пустым'),
  /** Тип реакции (эмодзи) */
  type: z.string().min(1, 'Тип реакции не может быть пустым'),
  /** ID пользователя, добавившего реакцию */
  userId: z.string().min(1, 'ID пользователя не может быть пустым'),
  /** Время создания реакции */
  createdAt: z.date(),
});

/**
 * @domain comms
 * @description Zod-схема валидации MessageReadStatus
 */
export const messageReadStatusSchema = z.object({
  /** ID сообщения */
  messageId: z.string().min(1, 'ID сообщения не может быть пустым'),
  /** Время последнего прочтения */
  lastReadAt: z.date().nullable().optional(),
  /** Количество непрочитанных сообщений */
  unreadCount: z.number().int().min(0, 'Количество непрочитанных не может быть отрицательным'),
});

/**
 * @domain comms
 * @description Zod-схема валидации данных для добавления участника в чат
 *
 * @spec
 * - userId: обязательный строковый ID пользователя
 * - role: опциональная роль участника (по умолчанию 'MEMBER')
 */
export const addChatParticipantSchema = z.object({
  /** ID пользователя для добавления */
  userId: z.string().min(1, 'ID пользователя не может быть пустым'),
  /** Роль участника (по умолчанию 'MEMBER') */
  role: z.enum(['MEMBER', 'ADMIN', 'OWNER']).default('MEMBER'),
});

export type AddChatParticipantData = z.infer<typeof addChatParticipantSchema>;

/**
 * @domain comms
 * @description Zod-схема валидации данных для обновления роли участника
 *
 * @spec
 * - role: обязательная роль участника
 */
export const updateParticipantRoleSchema = z.object({
  /** Новая роль участника */
  role: z.enum(['MEMBER', 'ADMIN', 'OWNER']),
});

export type UpdateParticipantRoleData = z.infer<typeof updateParticipantRoleSchema>;

/**
 * @domain comms
 * @description Zod-схема валидации данных для удаления участника из чата
 *
 * @spec
 * - userId: обязательный строковый ID пользователя для удаления
 */
export const removeChatParticipantSchema = z.object({
  /** ID пользователя для удаления */
  userId: z.string().min(1, 'ID пользователя не может быть пустым'),
});

export type RemoveChatParticipantData = z.infer<typeof removeChatParticipantSchema>;

/**
 * @schema markAsReadSchema
 * @domain comms
 * @description Валидация ID диалога для отметки прочитанных
 *
 * @traces US-39-01 AC-4
 * @task B-026-T3-1
 */
export const markAsReadSchema = z.object({
  /** ID диалога (CUID или UUID) */
  id: z.string().cuid('Некорректный ID диалога').or(z.string().uuid('Некорректный ID диалога')),
});

export type MarkAsReadData = z.infer<typeof markAsReadSchema>;
