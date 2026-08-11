/**
 * @file comms.service.ts
 * @domain comms
 * @description Бизнес-логика управления коммуникациями (диалоги, сообщения)
 *
 * @spec
 * - Валидация входных данных через Zod-схемы
 * - Вызов репозитория через DI
 *
 * @see docs/user-stories/US-21-01-просмотр-личных-диалогов.md
 * @see docs/user-stories/US-21-03-отправка-личных-сообщений.md
 */
import type { ICommsRepository } from './comms.repository.interface';
import type {
  ChatListResponse,
  ChatParticipantListItem,
  ChatParticipantsListResponse,
  Conversation,
  ConversationListResponse,
  CreateChatData,
  CreateConversationData,
  CreateConversationResult,
  Message,
  MessageWithReadStatus,
  ParticipantRole,
  SendMessageData,
  UnreadCounts,
  UpdateChatData,
} from './comms.types';
import {
  getConversationsQuerySchema,
  createConversationSchema,
  sendMessageSchema,
  createChatSchema,
  updateChatSchema,
  markAsReadSchema,
} from './comms.validators';
import {
  ChatNameExistsError,
  ConversationNotFoundError,
  CannotMessageSelfError,
  ConversationAccessDeniedError,
  MessageNotFoundError,
  CannotDeleteOthersMessageError,
  ParticipantAlreadyExistsError,
  CannotAddParticipantError,
  ChatParticipantNotFoundError,
  BadRequestError,
  ConversationAlreadyExistsError,
  DuplicateConversationError,
} from './comms.errors';

/**
 * @service CommsService
 * @domain comms
 * @description Бизнес-логика управления коммуникациями
 *
 * @spec
 * - Валидация: через Zod-схемы из comms.validators.ts
 * - Ошибки: ConversationNotFoundError, ConversationAccessDeniedError
 * - Зависимости: ICommsRepository через DI
 */
export class CommsService {
  constructor(private readonly commsRepository: ICommsRepository) {}

  /**
   * Получить список личных диалогов пользователя
   *
   * @param userId - ID текущего пользователя
   * @param query - Raw query параметры из запроса (строки)
   * @returns Пагинированный ответ со списком диалогов
   */
  async getUserConversations(
    userId: string,
    query?: Record<string, string | string[] | undefined>
  ): Promise<ConversationListResponse> {
    const parsed = getConversationsQuerySchema.parse(query ?? {});

    return this.commsRepository.getUserConversations(userId, {
      search: parsed.search,
      limit: parsed.limit,
      page: parsed.page,
    });
  }

  /**
   * Найти диалог по идентификатору
   *
   * @param id - Уникальный идентификатор диалога
   * @returns Полный объект Conversation
   * @throws {ConversationNotFoundError} если диалог не найден
   */
  async findConversationById(id: string): Promise<Conversation> {
    const conversation = await this.commsRepository.findById(id);
    if (!conversation) {
      throw new ConversationNotFoundError(id);
    }
    return conversation;
  }

  /**
   * Проверить является ли пользователь участником диалога
   *
   * @param conversationId - ID диалога
   * @param userId - ID пользователя
   * @returns true если пользователь является участником
   */
  async isParticipant(conversationId: string, userId: string): Promise<boolean> {
    return this.commsRepository.isParticipant(conversationId, userId);
  }

  /**
   * Начать новый личный диалог с пользователем
   *
   * @param currentUserId - ID текущего пользователя (инициатор)
   * @param data - Данные для создания диалога
   * @returns Результат с conversationId и флагом isNew=true
   *
   * @throws {CannotMessageSelfError} если currentUserId === participantId
   * @throws {CannotMessageBlockedUserError} если собеседник заблокирован
   * @throws {ConversationAlreadyExistsError} если диалог уже существует
   *
   * @spec
   * - Валидирует входные данные через createConversationSchema
   * - BR-01: нельзя написать самому себе
   * - BR-02: нельзя написать заблокированному пользователю
   * - Поиск существующего диалога через findConversationBetween
   * - Если диалог существует — бросает ConversationAlreadyExistsError(existing.id)
   * - Если диалога нет — создаёт новый через createConversation и возвращает с isNew=true
   * - Обработка race condition: catch DuplicateConversationError → throw ConversationAlreadyExistsError
   *
   * @covers AC-01 Создание нового диалога
   * @covers AC-02 Существующий диалог возвращает 409
   * @covers AC-03 Race condition через DuplicateConversationError
   */
  async startConversation(
    currentUserId: string,
    data: CreateConversationData
  ): Promise<CreateConversationResult> {
    const validated = createConversationSchema.parse(data);

    // BR-01: нельзя написать самому себе
    if (currentUserId === validated.participantId) {
      throw new CannotMessageSelfError();
    }

    // BR-02: проверить заблокирован ли собеседник
    // Пока проверка закомментирована — будет реализована позже

    // B-030 (Д2): проверить существование собеседника ДО createConversation.
    // Без этой проверки несуществующий participantId приводил бы к P2003
    // (внешний ключ conversation_participants_user_id_fkey) в createMany →
    // route возвращал 200 с сырым P2003 вместо 4xx.
    const participantExists = await this.commsRepository.userExists(validated.participantId);
    if (!participantExists) {
      throw new BadRequestError('Пользователь не найден');
    }

    // Искать существующий диалог
    const existing = await this.commsRepository.findConversationBetween(
      currentUserId,
      validated.participantId
    );

    if (existing) {
      // Бросаем ошибку, чтобы API вернул 409 с conversationId
      throw new ConversationAlreadyExistsError(existing.id);
    }

    try {
      // Создаём новый диалог
      const conversation = await this.commsRepository.createConversation(
        'DIRECT',
        [currentUserId, validated.participantId],
        currentUserId
      );

      return {
        conversationId: conversation.id,
        isNew: true,
      };
    } catch (error) {
      // Обработка race condition (P2002) — Вариант A
      // Repository при P2002 бросает DuplicateConversationError(existingId).
      // Service преобразует в ConversationAlreadyExistsError.
      if (error instanceof DuplicateConversationError) {
        throw new ConversationAlreadyExistsError(error.existingConversationId);
      }
      throw error;
    }
  }

  /**
   * Получить сообщения диалога
   *
   * @param conversationId - ID диалога
   * @param userId - ID текущего пользователя
   * @returns Массив сообщений
   */
  async getConversationMessages(
    conversationId: string,
    userId: string
  ): Promise<Message[]> {
    const conversation = await this.commsRepository.findById(conversationId);
    if (!conversation) {
      throw new ConversationNotFoundError(conversationId);
    }

    const participant = await this.commsRepository.isParticipant(conversationId, userId);
    if (!participant) {
      throw new ConversationAccessDeniedError();
    }

    return this.commsRepository.getConversationMessages(conversationId);
  }

  /**
   * Отправить сообщение в диалог
   *
   * @param userId - ID отправителя
   * @param conversationId - ID диалога
   * @param data - Данные сообщения
   * @returns Созданное сообщение
   */
  async sendMessage(
    userId: string,
    conversationId: string,
    data: SendMessageData
  ): Promise<Message> {
    const validated = sendMessageSchema.parse(data);

    const conversation = await this.commsRepository.findById(conversationId);
    if (!conversation) {
      throw new ConversationNotFoundError(conversationId);
    }

    const participant = await this.commsRepository.isParticipant(conversationId, userId);
    if (!participant) {
      throw new ConversationAccessDeniedError();
    }

    return this.commsRepository.createMessage({
      conversationId,
      senderId: userId,
      content: validated.content,
      replyToId: validated.replyToId ?? null,
    });
  }

  /**
   * Удалить сообщение (soft delete)
   *
   * @param userId - ID текущего пользователя
   * @param messageId - ID сообщения для удаления
   */
  async deleteMessage(
    userId: string,
    messageId: string
  ): Promise<void> {
    const message = await this.commsRepository.findMessageById(messageId);
    if (!message) {
      throw new MessageNotFoundError(messageId);
    }

    const senderId = await this.commsRepository.getMessageSender(messageId);
    if (senderId !== userId) {
      throw new CannotDeleteOthersMessageError();
    }

    await this.commsRepository.softDeleteMessage(messageId, userId);
  }

  /**
   * Получить список групповых чатов пользователя
   *
   * @param userId - ID текущего пользователя
   * @param query - Raw query параметры из запроса (строки)
   * @returns Пагинированный ответ со списком групповых чатов
   */
  async getUserGroupChats(
    userId: string,
    query?: Record<string, string | string[] | undefined>
  ): Promise<ChatListResponse> {
    const parsed = getConversationsQuerySchema.parse(query ?? {});

    return this.commsRepository.getUserGroupChats(userId, {
      search: parsed.search,
      limit: parsed.limit,
      page: parsed.page,
    });
  }

  /**
   * Создать групповой чат
   */
  async createChat(
    creatorId: string,
    data: CreateChatData
  ): Promise<string> {
    const validated = createChatSchema.parse(data);

    const existingChat = await this.commsRepository.findChatByName(
      validated.name,
      creatorId
    );
    if (existingChat) {
      throw new ChatNameExistsError();
    }

    const chat = await this.commsRepository.createConversation(
      'GROUP',
      [creatorId, ...validated.participantIds],
      creatorId
    );

    return chat.id;
  }

  /**
   * Обновить информацию о групповом чате
   */
  async updateChat(
    chatId: string,
    userId: string,
    data: UpdateChatData
  ): Promise<Conversation> {
    const validated = updateChatSchema.parse(data);

    const chat = await this.commsRepository.findById(chatId);
    if (!chat) {
      throw new ConversationNotFoundError(chatId);
    }

    const participant = await this.commsRepository.isParticipant(chatId, userId);
    if (!participant) {
      throw new ConversationAccessDeniedError();
    }

    const updated = await this.commsRepository.updateChat(chatId, userId, {
      name: validated.name,
      description: validated.description,
    });

    return updated;
  }

  /**
   * Добавить участника в групповой чат
   */
  async addParticipant(
    chatId: string,
    userId: string,
    participantId: string
  ): Promise<void> {
    const chat = await this.commsRepository.findById(chatId);
    if (!chat) {
      throw new ConversationNotFoundError(chatId);
    }

    const participant = await this.commsRepository.isParticipant(chatId, userId);
    if (!participant) {
      throw new ConversationAccessDeniedError();
    }

    const existing = await this.commsRepository.isParticipant(chatId, participantId);
    if (existing) {
      throw new ParticipantAlreadyExistsError();
    }

    await this.commsRepository.addChatParticipant(chatId, participantId, 'MEMBER');
  }

  /**
   * Удалить участника из группового чата
   */
  async removeParticipant(
    chatId: string,
    userId: string,
    participantId: string
  ): Promise<void> {
    const chat = await this.commsRepository.findById(chatId);
    if (!chat) {
      throw new ConversationNotFoundError(chatId);
    }

    const requesterParticipant = await this.commsRepository.isParticipant(chatId, userId);
    if (!requesterParticipant) {
      throw new ConversationAccessDeniedError();
    }

    await this.commsRepository.removeChatParticipant(chatId, participantId);
  }

  /**
   * Получить список участников группового чата
   */
  async getChatParticipants(
    chatId: string,
    userId: string,
    query?: Record<string, string | string[] | undefined>
  ): Promise<ChatParticipantsListResponse> {
    const chat = await this.commsRepository.findById(chatId);
    if (!chat) {
      throw new ConversationNotFoundError(chatId);
    }

    const participant = await this.commsRepository.isParticipant(chatId, userId);
    if (!participant) {
      throw new ConversationAccessDeniedError();
    }

    return this.commsRepository.getChatParticipants(chatId);
  }

  /**
   * Обновить роль участника в групповом чате
   */
  async updateParticipantRole(
    chatId: string,
    userId: string,
    participantId: string,
    role: ParticipantRole
  ): Promise<void> {
    const chat = await this.commsRepository.findById(chatId);
    if (!chat) {
      throw new ConversationNotFoundError(chatId);
    }

    const requesterParticipant = await this.commsRepository.isParticipant(chatId, userId);
    if (!requesterParticipant) {
      throw new ConversationAccessDeniedError();
    }

    const targetParticipant = await this.commsRepository.isParticipant(chatId, participantId);
    if (!targetParticipant) {
      throw new ChatParticipantNotFoundError(participantId);
    }

    await this.commsRepository.updateParticipantRole(chatId, participantId, role, userId);
  }

  /**
   * Пометить все сообщения в диалоге как прочитанные
   */
  async markAllAsRead(
    conversationId: string,
    userId: string
  ): Promise<void> {
    const conversation = await this.commsRepository.findById(conversationId);
    if (!conversation) {
      throw new ConversationNotFoundError(conversationId);
    }

    const participant = await this.commsRepository.isParticipant(conversationId, userId);
    if (!participant) {
      throw new ConversationAccessDeniedError();
    }

    await this.commsRepository.markAsRead(conversationId, userId);
  }

  /**
   * Получить непрочитанные сообщения для пользователя
   */
  async getUnreadCounts(userId: string): Promise<UnreadCounts> {
    return this.commsRepository.getUnreadCounts(userId);
  }

  /**
   * Получить информацию о конкретном групповом чате
   */
  async findChatById(chatId: string, userId: string): Promise<Conversation> {
    const chat = await this.commsRepository.findById(chatId);
    if (!chat) {
      throw new ConversationNotFoundError(chatId);
    }

    const participant = await this.commsRepository.isParticipant(chatId, userId);
    if (!participant) {
      throw new ConversationAccessDeniedError();
    }

    return chat;
  }

  /**
   * Найти пользователя по ID для добавления в чат
   */
  async searchUsersForChat(
    searchId: string
  ): Promise<ChatParticipantListItem[]> {
    return this.commsRepository.searchUsersForChat(searchId);
  }

  /**
   * Получить сообщения диалога с информацией о прочтении
   */
  async getMessagesWithReadStatus(
    conversationId: string,
    userId: string
  ): Promise<MessageWithReadStatus[]> {
    const conversation = await this.commsRepository.findById(conversationId);
    if (!conversation) {
      throw new ConversationNotFoundError(conversationId);
    }

    const participant = await this.commsRepository.isParticipant(conversationId, userId);
    if (!participant) {
      throw new ConversationAccessDeniedError();
    }

    return this.commsRepository.getMessagesWithReadStatus(conversationId, userId);
  }

  /**
   * Отправить сообщение в групповой чат
   */
  async sendChatMessage(
    userId: string,
    chatId: string,
    data: SendMessageData
  ): Promise<Message> {
    const validated = sendMessageSchema.parse(data);

    const chat = await this.commsRepository.findById(chatId);
    if (!chat) {
      throw new ConversationNotFoundError(chatId);
    }

    const participant = await this.commsRepository.isParticipant(chatId, userId);
    if (!participant) {
      throw new ConversationAccessDeniedError();
    }

    return this.commsRepository.createMessage({
      conversationId: chatId,
      senderId: userId,
      content: validated.content,
      replyToId: validated.replyToId ?? null,
    });
  }
}
