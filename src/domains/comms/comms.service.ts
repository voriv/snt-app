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
  ChatParticipantAddRequest,
  ChatParticipantListItem,
  ChatParticipantsListResponse,
  Conversation,
  ConversationListResponse,
  CreateChatData,
  CreateConversationData,
  CreateConversationResult,
  Message,
  ParticipantRole,
  SendMessageData,
  UpdateChatData,
} from './comms.types';
import {
  getConversationsQuerySchema,
  createConversationSchema,
  sendMessageSchema,
  createChatSchema,
  updateChatSchema,
  addChatParticipantSchema,
  updateParticipantRoleSchema,
  removeChatParticipantSchema,
} from './comms.validators';
import {
  ChatNameExistsError,
  ConversationNotFoundError,
  ConversationAlreadyExistsError,
  CannotMessageSelfError,
  CannotMessageBlockedUserError,
  ConversationAccessDeniedError,
  MessageNotFoundError,
  MessageTooLargeError,
  CannotDeleteOthersMessageError,
  ParticipantAlreadyExistsError,
  CannotAddParticipantError,
  ChatParticipantNotFoundError,
  BadRequestError,
  InternalServerError,
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
   *
   * @spec
   * - Валидирует query параметры через getConversationsQuerySchema
   * - Поддерживает: search (поиск), limit (кол-во), page (страница)
   * - Вызывает repository.getUserConversations с валидированными опциями
   * - Возвращает ConversationListResponse с items и total
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
   *
   * @spec
   * - Вызывает repository.findById
   * - Бросает ConversationNotFoundError если repository вернул null
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
   *
   * @spec
   * - Вызывает repository.isParticipant
   * - Возвращает результат проверки
   */
  async isParticipant(conversationId: string, userId: string): Promise<boolean> {
    return this.commsRepository.isParticipant(conversationId, userId);
  }

  /**
   * Начать новый личный диалог с пользователем
   *
   * @param currentUserId - ID текущего пользователя (инициатор)
   * @param data - Данные для создания диалога
   * @returns Результат с conversationId и флагом isNew
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
   * - Если диалог существует — возвращает его с isNew=false
   * - Если диалога нет — создаёт новый через createConversation и возвращает с isNew=true
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
    // TODO: реализовать проверку блокировки (будет в US-21-22)
    // Пока проверка закомментирована — будет реализована позже

    // Искать существующий диалог
    const existing = await this.commsRepository.findConversationBetween(
      currentUserId,
      validated.participantId
    );

    if (existing) {
      return {
        conversationId: existing.id,
        isNew: false,
      };
    }

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
  }

  /**
   * Получить сообщения диалога
   *
   * @param conversationId - ID диалога
   * @param userId - ID текущего пользователя
   * @returns Массив сообщений
   *
   * @throws {ConversationNotFoundError} если диалог не найден
   * @throws {ConversationAccessDeniedError} если пользователь не участник
   *
   * @spec
   * - Проверяет существование диалога
   * - Проверяет что пользователь является участником диалога
   * - Возвращает все сообщения включая удалённые (фильтрация на уровне UI)
   */
  async getConversationMessages(
    conversationId: string,
    userId: string
  ): Promise<Message[]> {
    // Проверить что диалог существует
    const conversation = await this.commsRepository.findById(conversationId);
    if (!conversation) {
      throw new ConversationNotFoundError(conversationId);
    }

    // Проверить что пользователь участник диалога
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
   *
   * @throws {ConversationNotFoundError} если диалог не найден
   * @throws {ConversationAccessDeniedError} если пользователь не участник
   * @throws {MessageTooLargeError} если сообщение слишком длинное
   *
   * @spec
   * - Валидирует данные через sendMessageSchema
   * - Проверяет существование диалога
   * - Проверяет что пользователь является участником диалога
   * - Создаёт сообщение через repository
   */
  async sendMessage(
    userId: string,
    conversationId: string,
    data: SendMessageData
  ): Promise<Message> {
    const validated = sendMessageSchema.parse(data);

    // Проверить что диалог существует
    const conversation = await this.commsRepository.findById(conversationId);
    if (!conversation) {
      throw new ConversationNotFoundError(conversationId);
    }

    // Проверить что пользователь участник диалога
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
   *
   * @throws {MessageNotFoundError} если сообщение не найдено
   * @throws {CannotDeleteOthersMessageError} если пытается удалить чужое сообщение
   *
   * @spec
   * - Проверяет существование сообщения
   * - Проверяет что пользователь является отправителем сообщения
   * - Выполняет мягкое удаление (isDeleted=true)
   */
  async deleteMessage(
    userId: string,
    messageId: string
  ): Promise<void> {
    // Проверить что сообщение существует
    const message = await this.commsRepository.findMessageById(messageId);
    if (!message) {
      throw new MessageNotFoundError(messageId);
    }

    // Проверить что пользователь является отправителем
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
   *
   * @spec
   * - Валидирует query параметры через getConversationsQuerySchema
   * - Поддерживает: search (поиск), limit (кол-во), page (страница)
   * - Вызывает repository.getUserGroupChats с валидированными опциями
   * - Возвращает ChatListResponse с items и total
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
   *
   * @param creatorId - ID пользователя-создателя
   * @param data - Данные для создания чата
   * @returns Созданный объект Conversation
   *
   * @throws {ChatNameExistsError} если групповой чат с таким названием уже существует
   *
   * @spec
   * - Валидирует данные через createChatSchema
   * - Проверяет уникальность названия через groupChatExistsByName
   * - Создаёт чат в транзакции через createGroupChat
   * - Создатель автоматически получает роль OWNER
   */
  async createChat(
    creatorId: string,
    data: CreateChatData
  ): Promise<Conversation> {
    const validated = createChatSchema.parse(data) as CreateChatData;

    // Проверить уникальность названия
    const exists = await this.commsRepository.groupChatExistsByName(
      creatorId,
      validated.name
    );
    if (exists) {
      throw new ChatNameExistsError();
    }

    return this.commsRepository.createGroupChat(creatorId, validated);
  }

  /**
   * Обновить информацию о групповом чате
   *
   * @param userId - ID текущего пользователя
   * @param chatId - ID чата для обновления
   * @param data - Данные для обновления (name и/или description)
   * @returns Обновлённый объект Conversation
   *
   * @throws {ConversationNotFoundError} если чат не найден
   * @throws {ChatNameExistsError} если новое название чата уже занято
   *
   * @spec
   * - Валидирует данные через updateChatSchema
   * - Проверяет существование чата
   * - Если обновляется name — проверяет уникальность нового названия
   * - Делегирует обновление в repository (проверка прав OWNER/ADMIN внутри)
   */
  async updateChat(
    userId: string,
    chatId: string,
    data: UpdateChatData
  ): Promise<Conversation> {
    const validated = updateChatSchema.parse(data);

    // Проверить существование чата
    const chat = await this.commsRepository.findById(chatId);
    if (!chat) {
      throw new ConversationNotFoundError(chatId);
    }

    // Если обновляется name — проверить уникальность нового названия
    if (validated.name && validated.name !== chat.title) {
      const nameExists = await this.commsRepository.groupChatExistsByName(
        userId,
        validated.name
      );
      if (nameExists) {
        throw new ChatNameExistsError();
      }
    }

    return this.commsRepository.updateChat(chatId, userId, validated);
  }

  /**
   * Получить список участников группового чата
   *
   * @param chatId - ID чата
   * @param currentUserId - ID текущего пользователя
   * @returns Список участников чата
   *
   * @spec
   * - Вызывает repository.getChatParticipants
   * - Устанавливает isCurrent=true для текущего пользователя
   * - Сортирует участников: OWNER, ADMIN, MEMBER
   */
  async getChatParticipants(
    chatId: string,
    currentUserId: string
  ): Promise<ChatParticipantsListResponse> {
    const result = await this.commsRepository.getChatParticipants(chatId);

    // Установить isCurrent для текущего пользователя
    const participants = result.participants.map((p) => ({
      ...p,
      isCurrent: p.userId === currentUserId,
    }));

    return {
      participants,
      count: result.count,
    };
  }

  /**
   * Добавить участника в групповой чат
   *
   * @param chatId - ID чата
   * @param userId - ID пользователя, добавляющего участника
   * @param targetUserId - ID пользователя для добавления
   * @param role - Роль для добавления (MEMBER по умолчанию)
   * @returns Результат добавления участника
   * @throws {ParticipantAlreadyExistsError} если пользователь уже является участником
   * @throws {CannotAddParticipantError} если у пользователя нет прав (не OWNER/ADMIN)
   *
   * @spec
   * - Проверить что добавляющий пользователь является OWNER или ADMIN чата
   * - Проверить что targetUserId !== userId (нельзя добавить себя)
   * - Вызывает repository.addChatParticipant
   * - По умолчанию role = MEMBER если не указано
   */
  async addParticipantToChat(
    chatId: string,
    userId: string,
    targetUserId: string,
    role: ParticipantRole = 'MEMBER'
  ): Promise<{ success: true; participantId: string }> {
    // Валидация: нельзя добавить себя
    if (userId === targetUserId) {
      throw new CannotAddParticipantError('Нельзя добавить себя в чат');
    }

    // Проверить права: добавляющий должен быть OWNER или ADMIN
    const participant = await this.commsRepository.getChatParticipant(chatId, userId);
    if (!participant || !['OWNER', 'ADMIN'].includes(participant.role)) {
      throw new CannotAddParticipantError('У вас нет прав для добавления участников');
    }

    // Проверить что пользователь уже не участник
    const alreadyParticipant = await this.commsRepository.getChatParticipant(chatId, targetUserId);
    if (alreadyParticipant) {
      throw new ParticipantAlreadyExistsError();
    }

    // Добавить участника
    const result = await this.commsRepository.addChatParticipant(chatId, targetUserId, role);

    return {
      success: true,
      participantId: result.id,
    };
  }

  /**
   * Изменить роль участника в чате
   *
   * @param chatId - ID чата
   * @param userId - ID пользователя, изменяющего роль (должен быть OWNER/ADMIN)
   * @param targetUserId - ID пользователя, чью роль меняем
   * @param newRole - Новая роль участника
   * @returns Обновленный объект участника
   * @throws {ChatParticipantNotFoundError} если пользователь не найден в чате
   * @throws {CannotAddParticipantError} если у пользователя нет прав
   * @throws {ParticipantAlreadyExistsError} если новая роль OWNER, а пользователь уже имеет ADMIN
   *
   * @spec
   * - Проверить права пользователя: только OWNER может менять роли на OWNER
   * - OWNER и ADMIN могут менять роли на MEMBER и ADMIN
   * - Нельзя менять роль на ту, которую пользователь уже имеет
   */
  async updateParticipantRole(
    chatId: string,
    userId: string,
    targetUserId: string,
    newRole: ParticipantRole
  ): Promise<ChatParticipantListItem> {
    // Проверить права изменяющего пользователя
    const currentUser = await this.commsRepository.getChatParticipant(chatId, userId);
    if (!currentUser || !['OWNER', 'ADMIN'].includes(currentUser.role)) {
      throw new CannotAddParticipantError('У вас нет прав на изменение ролей участников');
    }

    // Проверить что изменяемый пользователь существует в чате
    const targetParticipant = await this.commsRepository.getChatParticipant(chatId, targetUserId);
    if (!targetParticipant) {
      throw new ChatParticipantNotFoundError(targetUserId);
    }

    // Нельзя менять роль на OWNER, если у текущего пользователя нет прав OWNER
    if (newRole === 'OWNER' && currentUser.role !== 'OWNER') {
      throw new CannotAddParticipantError('Только OWNER может назначать роль OWNER');
    }

    // Нельзя назначать OWNER пользователю, который уже имеет ADMIN (если это не OWNER)
    if (newRole === 'OWNER' && targetParticipant.role === 'ADMIN' && currentUser.role !== 'OWNER') {
      throw new CannotAddParticipantError('Нельзя изменить роль ADMIN на OWNER без прав OWNER');
    }

    // Нельзя менять роль на текущую
    if (targetParticipant.role === newRole) {
      throw new BadRequestError('Роль участника уже установлена на эту');
    }

    // Изменить роль
    const updated = await this.commsRepository.updateParticipantRole(chatId, targetUserId, newRole);

    // Получить обновленную информацию участника с деталями пользователя
    const participantDetails = await this.commsRepository.getChatParticipantWithDetails(chatId, targetUserId);
    if (!participantDetails) {
      throw new ChatParticipantNotFoundError(targetUserId);
    }

    return {
      ...participantDetails,
      isCurrent: participantDetails.userId === userId,
    };
  }

  /**
   * Удалить участника из чата
   *
   * @param chatId - ID чата
   * @param userId - ID пользователя, удаляющего участника (должен быть OWNER/ADMIN)
   * @param targetUserId - ID пользователя для удаления
   * @throws {ChatParticipantNotFoundError} если участник не найден
   * @throws {CannotAddParticipantError} если у пользователя нет прав
   * @throws {BadRequestError} если пытаются удалить себя
   *
   * @spec
   * - Проверить права: только OWNER или ADMIN могут удалять участников
   * - Нельзя удалить себя
   * - Нельзя удалить OWNER чата
   * - Вызывает repository.removeChatParticipant
   */
  async removeParticipantFromChat(
    chatId: string,
    userId: string,
    targetUserId: string
  ): Promise<{ success: true }> {
    // Проверить права удаляющего
    const currentUser = await this.commsRepository.getChatParticipant(chatId, userId);
    if (!currentUser || !['OWNER', 'ADMIN'].includes(currentUser.role)) {
      throw new CannotAddParticipantError('У вас нет прав на удаление участников');
    }

    // Проверить что удаляемый пользователь существует в чате
    const targetParticipant = await this.commsRepository.getChatParticipant(chatId, targetUserId);
    if (!targetParticipant) {
      throw new ChatParticipantNotFoundError(targetUserId);
    }

    // Нельзя удалить себя
    if (userId === targetUserId) {
      throw new BadRequestError('Нельзя удалить себя из чата');
    }

    // Нельзя удалить OWNER чата (если только это не OWNER)
    if (targetParticipant.role === 'OWNER' && currentUser.role !== 'OWNER') {
      throw new CannotAddParticipantError('Нельзя удалить OWNER чата');
    }

    // Удалить участника
    await this.commsRepository.removeChatParticipant(chatId, targetUserId);

    return { success: true };
  }
}
