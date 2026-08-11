/**
 * @file message.repository.prisma.ts
 * @domain comms
 * @description Реализация репозитория сообщений через Prisma Client
 *
 * @spec
 * - Использует singleton-паттерн для инстанса Prisma Client
 * - findById возвращает null если не найдено — НЕ бросает ошибку
 * - findByConversationId загружает сообщения с данными отправителя
 * - Учитывает isDeleted=false по умолчанию (не показывает мягко удалённые)
 * - replyToId валидируется на уровне сервиса, здесь только сохранение
 */

import { prisma } from '@/infrastructure/prisma/client';
import type { IMessageRepository } from './message.repository.interface';
import type {
  MessageWithSender,
  CreateMessageData,
  UpdateMessageData,
  MessageListParams,
} from './message.types';

export class MessageRepositoryPrisma implements IMessageRepository {
  private static instance: MessageRepositoryPrisma;

  private constructor() {}

  public static getInstance(): MessageRepositoryPrisma {
    if (!MessageRepositoryPrisma.instance) {
      MessageRepositoryPrisma.instance = new MessageRepositoryPrisma();
    }
    return MessageRepositoryPrisma.instance;
  }

  /**
   * Найти сообщение по ID
   *
   * @param id - Уникальный идентификатор сообщения
   * @returns Сообщение с информацией об отправителе или null если не найдено
   *
   * @spec
   * - LEFT JOIN на user_profiles для данных отправителя
   * - Не включает soft-deleted сообщения (isDeleted = false)
   * - Не бросает ошибку если сообщение не найдено
   */
  async findById(id: string): Promise<MessageWithSender | null> {
    const message = await prisma.message.findFirst({
      where: {
        id,
        isDeleted: false,
      },
      include: {
        sender: {
          include: {
            profile: true,
          },
        },
      },
    });

    if (!message) {
      return null;
    }

    return this.mapToMessageWithSender(message);
  }

  /**
   * Найти сообщения для диалога
   *
   * @param params - Параметры списка сообщений
   * @returns Список сообщений с данными отправителя
   *
   * @spec
   * - Сортировка по createdAt DESC (новые сверху)
   * - Фильтр isDeleted = false
   * - Пагинация через beforeId + limit
   * - Если beforeId указан — загружаем сообщения до этого ID
   * - LEFT JOIN на user_profiles для данных отправителя
   */
  async findByConversationId(
    params: MessageListParams
  ): Promise<MessageWithSender[]> {
    const { conversationId, limit = 50, beforeId } = params;

    const whereClause: Record<string, unknown> = {
      conversationId,
      isDeleted: false,
    };

    // Добавляем условия для пагинации "вперед" (messages до переданного ID)
    if (beforeId) {
      const beforeMessage = await prisma.message.findUnique({
        where: { id: beforeId },
        select: { createdAt: true },
      });

      if (beforeMessage) {
        whereClause.createdAt = {
          lt: beforeMessage.createdAt,
        };
      } else {
        // Если beforeMessage не найден, возвращаем пустой список
        return [];
      }
    }

    const messages = await prisma.message.findMany({
      where: whereClause,
      include: {
        sender: {
          include: {
            profile: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    });

    return messages.map((message) => this.mapToMessageWithSender(message));
  }

  /**
   * Создать новое сообщение
   *
   * @param data - Данные для создания сообщения
   * @returns Созданное сообщение с данными отправителя
   *
   * @spec
   * - Создаёт запись в БД
   * - Возвращает сообщение с данными отправителя
   * - replyToId может быть null
   */
  async create({
    conversationId,
    senderId,
    messageData,
  }: {
    conversationId: string;
    senderId: string;
    messageData: CreateMessageData;
  }): Promise<MessageWithSender> {
    const message = await prisma.message.create({
      data: {
        conversationId,
        senderId,
        content: messageData.content,
        replyToId: messageData.replyToId || null,
      },
      include: {
        sender: {
          include: {
            profile: true,
          },
        },
      },
    });

    return this.mapToMessageWithSender(message);
  }

  /**
   * Обновить сообщение
   *
   * @param messageId - Уникальный идентификатор сообщения
   * @param userId - ID пользователя, который обновляет
   * @param data - Обновляемые данные
   * @returns Обновленное сообщение с данными отправителя
   *
   * @spec
   * - Обновляет только content
   * - Обновляет updatedAt
   * - Не обновляет soft-delete флаг
   * - Если сообщение soft-deleted, вернет null
   */
  async update(
    messageId: string,
    userId: string,
    data: UpdateMessageData
  ): Promise<MessageWithSender | null> {
    // Сначала проверяем, существует ли сообщение и не soft-deleted ли оно
    const existingMessage = await prisma.message.findUnique({
      where: { id: messageId },
      select: { isDeleted: true, senderId: true },
    });

    if (!existingMessage) {
      return null;
    }

    if (existingMessage.isDeleted) {
      // Мягко удалённые сообщения не редактируются
      return null;
    }

    const message = await prisma.message.update({
      where: { id: messageId },
      data: {
        content: data.content,
        updatedAt: new Date(),
      },
      include: {
        sender: {
          include: {
            profile: true,
          },
        },
      },
    });

    return this.mapToMessageWithSender(message);
  }

  /**
   * Мягко удалить сообщение
   *
   * @param messageId - Уникальный идентификатор сообщения
   * @param userId - ID пользователя, который удаляет
   *
   * @spec
   * - Устанавливает isDeleted = true
   * - Записывает deletedBy и deletedAt
   * - Не удаляет запись из БД
   */
  async softDelete(messageId: string, userId: string): Promise<void> {
    await prisma.message.update({
      where: { id: messageId },
      data: {
        isDeleted: true,
        deletedBy: userId,
        deletedAt: new Date(),
      },
    });
  }

  /**
   * Преобразует Prisma-объект Message в MessageWithSender
   *
   * @param message - Сообщение из Prisma с включёнными связями
   * @returns Сообщение с данными отправителя
   */
  private mapToMessageWithSender(message: any): MessageWithSender {
    const { sender } = message;
    const profile = sender?.profile;

    // BR-39: Приоритет имени отправителя:
    // 1) UserProfile.first_name + UserProfile.last_name (Имя Фамилия)
    // 2) User.name (если профиль пуст)
    // 3) User.email (если нет имени)
    // 4) '' → UI покажет "Удалённый пользователь" (если sender=null)
    const firstName = profile?.first_name || '';
    const lastName = profile?.last_name || '';
    const fullName = `${firstName} ${lastName}`.trim();
    const senderName = fullName || (sender?.name || '');
    const senderEmail = sender?.email || '';

    return {
      id: message.id,
      conversationId: message.conversationId,
      senderId: message.senderId,
      content: message.content,
      replyToId: message.replyToId,
      isDeleted: message.isDeleted,
      deletedBy: message.deletedBy,
      deletedAt: message.deletedAt,
      createdAt: message.createdAt,
      updatedAt: message.updatedAt,
      senderFirstName: firstName,
      senderLastName: lastName,
      senderEmail,
      senderAvatarUrl: profile?.avatar || null,
      senderName,
    };
  }
}
