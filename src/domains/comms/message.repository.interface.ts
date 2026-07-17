/**
 * @interface IMessageRepository
 * @domain comms
 * @description Контракт доступа к данным сообщений
 *
 * @spec
 * - Все методы асинхронные
 * - findById возвращает null если не найден — НЕ бросает ошибку
 * - softDelete выполняет мягкое удаление (isDeleted = true)
 */

import {
  Message,
  CreateMessageData,
  UpdateMessageData,
  MessageWithSender,
  MessageListParams,
} from './message.types';

export interface IMessageRepository {
  /**
   * Найти сообщение по ID
   * @param id - Уникальный идентификатор сообщения
   * @returns Сообщение с информацией об отправителе или null если не найдено
   */
  findById(id: string): Promise<MessageWithSender | null>;

  /**
   * Найти сообщения для диалога
   * @param params - Параметры списка сообщений
   * @returns Список сообщений
   */
  findByConversationId(params: MessageListParams): Promise<MessageWithSender[]>;

  /**
   * Создать новое сообщение
   * @param data - Данные для создания
   * @returns Созданное сообщение
   */
  create(data: {
    conversationId: string;
    senderId: string;
    messageData: CreateMessageData;
  }): Promise<MessageWithSender>;

  /**
   * Обновить сообщение
   * @param messageId - Уникальный идентификатор сообщения
   * @param userId - ID пользователя, который обновляет
   * @param data - Обновляемые данные
   * @returns Обновленное сообщение
   */
  update(
    messageId: string,
    userId: string,
    data: UpdateMessageData
  ): Promise<MessageWithSender>;

  /**
   * Мягко удалить сообщение
   * @param messageId - Уникальный идентификатор сообщения
   * @param userId - ID пользователя, который удаляет
   */
  softDelete(messageId: string, userId: string): Promise<void>;
}
