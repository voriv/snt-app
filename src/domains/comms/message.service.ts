/**
 * @file message.service.ts
 * @domain comms
 * @description Бизнес-логика управления сообщениями в личных диалогах
 *
 * @spec
 * - Валидация: через Zod-схемы из message.validators.ts
 * - Ошибки: MessageNotFoundError, MessageInvalidDataError, MessageReplyNotFoundError, MessageReplyNotInConversationError
 * - Зависимости: IMessageRepository через DI
 * - Мягкое удаление: не удаляет запись из БД, только помечает isDeleted = true
 */

import { z } from 'zod';
import type { IMessageRepository } from './message.repository.interface';
import type {
  MessageWithSender,
  CreateMessageData,
  UpdateMessageData,
  MessageListParams,
} from './message.types';
import {
  createMessageDataSchema,
  updateMessageDataSchema,
} from './message.validators';
import {
  MessageNotFoundError,
  MessageInvalidDataError,
  MessageReplyNotFoundError,
  MessageReplyNotInConversationError,
} from './message.errors';

export class MessageService {
  private readonly repository: IMessageRepository;

  constructor(repository: IMessageRepository) {
    this.repository = repository;
  }

  /**
   * Найти сообщение по ID
   *
   * @param id - Уникальный идентификатор сообщения
   * @returns Сообщение с информацией об отправителе
   * @throws {MessageNotFoundError} если сообщение не найдено
   *
   * @spec
   * - Возвращает полное сообщение с данными отправителя
   * - Не возвращает soft-deleted сообщения
   */
  async findById(id: string): Promise<MessageWithSender> {
    const message = await this.repository.findById(id);

    if (!message) {
      throw new MessageNotFoundError(id);
    }

    return message;
  }

  /**
   * Найти сообщения для диалога
   *
   * @param params - Параметры списка сообщений
   * @returns Список сообщений с данными отправителя
   *
   * @spec
   * - Возвращает сообщения от новых к старым (DESC)
   * - Не включает soft-deleted сообщения
   * - Пагинация через beforeId + limit
   */
  async findByConversationId(
    params: MessageListParams
  ): Promise<MessageWithSender[]> {
    return this.repository.findByConversationId(params);
  }

  /**
   * Создать новое сообщение
   *
   * @param userId - ID пользователя, который отправляет
   * @param conversationId - ID диалога
   * @param messageData - Данные сообщения
   * @returns Созданное сообщение с данными отправителя
   * @throws {MessageInvalidDataError} если данные невалидны
   * @throws {MessageReplyNotFoundError} если replyToMessage не найден
   * @throws {MessageReplyNotInConversationError} если replyToMessage не в том диалоге
   *
   * @spec
   * - Валидирует входные данные через Zod
   * - Проверяет существование replyToMessage если указан
   * - replyToMessage должен принадлежать тому же диалогу
   */
  async create(
    userId: string,
    conversationId: string,
    messageData: CreateMessageData
  ): Promise<MessageWithSender> {
    // Валидация входных данных
    const validationResult = createMessageDataSchema.safeParse(messageData);

    if (!validationResult.success) {
      const errors = validationResult.error.errors.map((err) => ({
        field: err.path[0],
        message: err.message,
      }));

      throw new MessageInvalidDataError(
        `Валидация данных сообщения не пройдена: ${errors
          .map((e) => `${e.field}: ${e.message}`)
          .join(', ')}`
      );
    }

    const validData = validationResult.data;

    // Если указан replyToId, проверяем существование и принадлежность к диалогу
    if (validData.replyToId) {
      const replyToMessage = await this.repository.findById(
        validData.replyToId
      );

      if (!replyToMessage) {
        throw new MessageReplyNotFoundError(validData.replyToId);
      }

      if (replyToMessage.conversationId !== conversationId) {
        throw new MessageReplyNotInConversationError(
          validData.replyToId,
          conversationId
        );
      }
    }

    return this.repository.create({
      conversationId,
      senderId: userId,
      messageData: validData as CreateMessageData,
    });
  }

  /**
   * Обновить сообщение
   *
   * @param messageId - ID сообщения
   * @param userId - ID пользователя, который обновляет (должен быть отправителем)
   * @param messageData - Обновляемые данные
   * @returns Обновленное сообщение
   * @throws {MessageNotFoundError} если сообщение не найдено
   * @throws {MessageInvalidDataError} если данные невалидны или пользователь не отправитель
   *
   * @spec
   * - Пользователь может редактировать только свои сообщения
   * - Если сообщение soft-deleted, возвращает null
   */
  async update(
    messageId: string,
    userId: string,
    messageData: UpdateMessageData
  ): Promise<MessageWithSender | null> {
    // Валидация входных данных
    const validationResult = updateMessageDataSchema.safeParse(messageData);

    if (!validationResult.success) {
      const errors = validationResult.error.errors.map((err) => ({
        field: err.path[0],
        message: err.message,
      }));

      throw new MessageInvalidDataError(
        `Валидация данных сообщения не пройдена: ${errors
          .map((e) => `${e.field}: ${e.message}`)
          .join(', ')}`
      );
    }

    const validData = validationResult.data;

    // Проверяем, что пользователь является отправителем сообщения
    const existingMessage = await this.repository.findById(messageId);

    if (!existingMessage) {
      throw new MessageNotFoundError(messageId);
    }

    if (existingMessage.senderId !== userId) {
      throw new MessageInvalidDataError(
        `Пользователь не является отправителем этого сообщения`
      );
    }

    return this.repository.update(messageId, userId, validData as UpdateMessageData);
  }

  /**
   * Мягко удалить сообщение
   *
   * @param messageId - ID сообщения
   * @param userId - ID пользователя, который удаляет
   * @throws {MessageNotFoundError} если сообщение не найдено
   * @throws {MessageInvalidDataError} если пользователь не отправитель
   *
   * @spec
   * - Пользователь может удалять только свои сообщения
   * - Мягкое удаление (isDeleted = true)
   * - Не удаляет запись из БД
   */
  async softDelete(messageId: string, userId: string): Promise<void> {
    // Проверяем существование сообщения
    const existingMessage = await this.repository.findById(messageId);

    if (!existingMessage) {
      throw new MessageNotFoundError(messageId);
    }

    // Проверяем, что пользователь является отправителем сообщения
    if (existingMessage.senderId !== userId) {
      throw new MessageInvalidDataError(
        `Пользователь не является отправителем этого сообщения`
      );
    }

    await this.repository.softDelete(messageId, userId);
  }

  /**
   * Получить цитируемое сообщение (для отображения в UI)
   *
   * @param messageId - ID сообщения с replyToId
   * @returns Цитируемое сообщение или null
   *
   * @spec
   * - Используется для отображения "ответ на сообщение"
   * - Возвращает null если replyToId = null
   */
  async getReplyToMessage(
    messageId: string
  ): Promise<MessageWithSender | null> {
    const message = await this.repository.findById(messageId);

    if (!message || !message.replyToId) {
      return null;
    }

    return this.repository.findById(message.replyToId);
  }
}
