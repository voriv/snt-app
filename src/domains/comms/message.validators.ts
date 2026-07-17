/**
 * @validators Message Validators
 * @domain comms
 * @description Zod-схемы валидации для сообщений
 */

import z from 'zod';

/**
 * Максимальная длина текста сообщения
 */
const MAX_CONTENT_LENGTH = 1000;

/**
 * Минимальная длина текста сообщения
 */
const MIN_CONTENT_LENGTH = 1;

/**
 * Схема валидации текста сообщения
 */
const contentSchema = z
  .string()
  .min(MIN_CONTENT_LENGTH, 'Текст сообщения должен содержать минимум 1 символ')
  .max(MAX_CONTENT_LENGTH, `Текст сообщения не может превышать ${MAX_CONTENT_LENGTH} символов`)
  .transform((val) => val.trim());

/**
 * Схема данных для создания сообщения
 *
 * @schema CreateMessageDataSchema
 * @domain comms
 * @spec
 * - content обязательно и не пустое
 * - replyToId опционально
 */
export const createMessageDataSchema = z.object({
  /** Текст сообщения. Обязательно, не пустое */
  content: contentSchema,
  /** ID цитируемого сообщения. Опционально */
  replyToId: z.string().cuid().nullish(),
});

/**
 * Тип, выводимый из CreateMessageDataSchema
 */
export type CreateMessageData = z.infer<typeof createMessageDataSchema>;

/**
 * Схема данных для обновления сообщения
 *
 * @schema UpdateMessageDataSchema
 * @domain comms
 * @spec
 * - content опционально, если указано — не пустое
 */
export const updateMessageDataSchema = z.object({
  /** Текст сообщения. Опционально */
  content: contentSchema.optional(),
});

/**
 * Тип, выводимый из UpdateMessageDataSchema
 */
export type UpdateMessageData = z.infer<typeof updateMessageDataSchema>;

/**
 * Схема параметров списка сообщений
 *
 * @schema MessageListParamsSchema
 * @domain comms
 * @spec
 * - conversationId обязателен
 * - limit опционален, по умолчанию 50
 * - beforeId опционален для пагинации
 */
export const messageListParamsSchema = z.object({
  /** ID диалога. Обязательно */
  conversationId: z.string().cuid(),
  /** Максимальное количество сообщений. По умолчанию 50 */
  limit: z.number().int().positive().max(100).default(50),
  /** ID сообщения для пагинации (messages до этого). Опционально */
  beforeId: z.string().cuid().optional(),
});

/**
 * Тип, выводимый из MessageListParamsSchema
 */
export type MessageListParams = z.infer<typeof messageListParamsSchema>;
