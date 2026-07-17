/**
 * @file comms.repository.interface.ts
 * @domain comms
 * @description Контракт доступа к данным домена коммуникаций (диалоги, сообщения)
 *
 * @spec
 * - Все методы асинхронные
 * - findById возвращает null если диалог не найден (НЕ бросает ошибку)
 * - isParticipant возвращает boolean (true/false)
 *
 * @see docs/model/entities/conversation.md
 * @see docs/model/entities/message.md
 */
import type { ChatListItem, ChatListResponse, ChatParticipantListItem, ChatParticipantsListResponse, Conversation, ConversationParticipant, ConversationListResponse, CreateChatData, Message, ParticipantRole, UpdateChatData } from './comms.types';

/**
 * Данные для создания сообщения
 */
export interface CreateMessageData {
  /** ID диалога */
  conversationId: string;
  /** ID отправителя */
  senderId: string;
  /** Текст сообщения */
  content: string;
  /** ID цитируемого сообщения (опционально) */
  replyToId?: string | null;
}

/**
 * Опции для запроса списка диалогов пользователя
 */
export interface GetUserConversationsOptions {
  /** Поисковый запрос по названию диалога */
  search?: string;
  /** Количество элементов на странице (1-100) */
  limit?: number;
  /** Номер страницы (начиная с 1) */
  page?: number;
}

/**
 * @interface ICommsRepository
 * @domain comms
 * @description Контракт доступа к данным коммуникаций
 *
 * @spec
 * - Все методы асинхронные
 * - getUserConversations возвращает пагинированный ответ только для DIRECT диалогов
 * - findById возвращает null если не найден (НЕ бросает ошибку)
 * - isParticipant возвращает true если пользователь участник диалога
 */
export interface ICommsRepository {
  /**
   * Получить список личных диалогов пользователя с пагинацией
   *
   * @param userId - ID текущего пользователя
   * @param options - Опции запроса (search, limit, page)
   * @returns Пагинированный ответ со списком диалогов
   *
   * @spec
   * - Фильтр: только диалоги типа DIRECT, где пользователь является участником
   * - Для каждого диалога определяется собеседник (другой участник)
   * - lastMessagePreview: превью последнего сообщения (максимум 60 символов)
   * - unreadCount: количество непрочитанных сообщений (после lastReadAt)
   * - Сортировка: по lastMessageAt DESC (или createdAt DESC если нет сообщений)
   * - Пагинация: limit и page
   * - Поиск: по имени собеседника (если передан search)
   */
  getUserConversations(
    userId: string,
    options?: GetUserConversationsOptions
  ): Promise<ConversationListResponse>;

  /**
   * Найти диалог по идентификатору
   *
   * @param id - Уникальный идентификатор диалога
   * @returns Объект Conversation или null если не найден
   *
   * @spec
   * - Возвращает null если диалог не найден (НЕ бросает ошибку)
   * - Не включает связанные сообщения и участников
   */
  findById(id: string): Promise<Conversation | null>;

  /**
   * Проверить является ли пользователь участником диалога
   *
   * @param conversationId - ID диалога
   * @param userId - ID пользователя
   * @returns true если пользователь является участником, false иначе
   *
   * @spec
   * - Проверяет существование записи в conversation_participants
   * - Возвращает false если запись не найдена (НЕ бросает ошибку)
   */
 isParticipant(conversationId: string, userId: string): Promise<boolean>;

 /**
  * Найти личный диалог между двумя пользователями
  *
  * @param userAId - ID первого пользователя
  * @param userBId - ID второго пользователя
  * @returns Объект Conversation или null если не найден
  *
  * @spec
  * - Ищет диалог типа DIRECT, где участниками являются оба пользователя
  * - Порядок userA/userB не важен
  * - Возвращает null если диалог не найден (НЕ бросает ошибку)
  */
 findConversationBetween(userAId: string, userBId: string): Promise<Conversation | null>;

 /**
  * Создать новый диалог с участниками
  *
  * @param type - Тип диалога
  * @param participantIds - Массив ID участников
  * @param createdBy - ID создателя диалога
  * @param title - Опциональное название (для групповых чатов)
  * @returns Созданный объект Conversation
  *
  * @spec
  * - Создаёт запись в conversations
  * - Создаёт записи в conversation_participants для каждого участника
  * - Первый участник получает роль OWNER
  * - Остальные получают роль MEMBER
  * - Выполняется в транзакции
  */
 createConversation(
   type: 'DIRECT',
   participantIds: string[],
   createdBy: string
 ): Promise<Conversation>;

 /**
  * Получить все сообщения диалога
  *
  * @param conversationId - ID диалога
  * @returns Массив сообщений, отсортированных по времени (ASC)
  *
  * @spec
  * - Возвращает все сообщения включая удалённые (фильтрация на уровне UI)
  * - Сортировка: по createdAt ASC (хронологический порядок)
  */
 getConversationMessages(conversationId: string): Promise<Message[]>;

 /**
  * Создать новое сообщение
  *
  * @param data - Данные для создания сообщения
  * @returns Созданный объект Message
  *
  * @spec
  * - Создаёт запись в messages
  * - isDeleted по умолчанию false
  */
 createMessage(data: CreateMessageData): Promise<Message>;

 /**
  * Найти сообщение по идентификатору
  *
  * @param messageId - Уникальный идентификатор сообщения
  * @returns Объект Message или null если не найден
  *
  * @spec
  * - Возвращает null если не найден (НЕ бросает ошибку)
  */
 findMessageById(messageId: string): Promise<Message | null>;

 /**
  * Получить ID отправителя сообщения
  *
  * @param messageId - Уникальный идентификатор сообщения
  * @returns ID отправителя или null если сообщение не найдено
  *
  * @spec
  * - Используется для проверки владения сообщением перед удалением
  */
 getMessageSender(messageId: string): Promise<string | null>;

 /**
  * Мягко удалить сообщение
  *
  * @param messageId - Уникальный идентификатор сообщения
  * @param deletedBy - ID пользователя, удаляющего сообщение
  *
  * @spec
  * - Устанавливает isDeleted=true, deletedBy, deletedAt=now()
  * - Не удаляет запись физически
  */
 softDeleteMessage(messageId: string, deletedBy: string): Promise<void>;

 /**
  * Получить список групповых чатов пользователя
  *
  * @param userId - ID текущего пользователя
  * @param options - Опции запроса (search, limit, page)
  * @returns Пагинированный ответ со списком групповых чатов
  *
  * @spec
  * - Фильтр: только диалоги типа GROUP, где пользователь является участником
  * - name: название чата из conversation.title (или "Без названия" если null)
  * - lastMessagePreview: превью последнего сообщения (максимум 60 символов)
  * - lastMessageAt: время последнего сообщения (или createdAt если нет сообщений)
  * - participantCount: общее количество участников чата
  * - unreadCount: количество непрочитанных сообщений (после lastReadAt)
  * - Сортировка: по lastMessageAt DESC (или createdAt DESC если нет сообщений)
  * - Пагинация: limit и page
  * - Поиск: по названию чата (если передан search)
  */
 getUserGroupChats(
   userId: string,
   options?: GetUserConversationsOptions
 ): Promise<ChatListResponse>;

 /**
  * Создать групповой чат в транзакции
  *
  * @param creatorId - ID создателя чата
  * @param data - Данные для создания чата (название, описание, участники)
  * @returns Созданный объект Conversation
  *
  * @spec
  * - Создаёт запись в conversations с type='GROUP'
  * - Создаёт запись в conversation_participants для создателя с ролью OWNER
  * - Создаёт записи в conversation_participants для каждого участника с ролью MEMBER
  * - Все операции выполняются в одной транзакции
  * - Создатель автоматически получает роль OWNER
  */
 createGroupChat(
   creatorId: string,
   data: CreateChatData
 ): Promise<Conversation>;

 /**
  * Проверить существование группового чата с таким названием у пользователя
  *
  * @param userId - ID пользователя
  * @param name - Название чата
  * @returns true если чат с таким названием уже существует
  *
  * @spec
  * - Проверяет существования GROUP диалога с указанным title, где пользователь является участником
  * - Сравнение по title без учёта регистра
  */
  groupChatExistsByName(
  userId: string,
  name: string
  ): Promise<boolean>;
  
  /**
  * Обновить информацию о групповом чате
  *
  * @param chatId - ID чата для обновления
  * @param userId - ID пользователя, который выполняет обновление
  * @param data - Данные для обновления (name, description)
  * @returns Обновлённый объект Conversation
  *
  * @spec
  * - Проверяет что пользователь является creator или admin чата
  * - Обновляет поля name и/или description
  * - Обновляет updatedAt
  * - Выбрасывает CannotEditChatError если у пользователя нет прав
  */
  updateChat(
  chatId: string,
  userId: string,
  data: UpdateChatData
  ): Promise<Conversation>;
  
  /**
   * Получить список участников группового чата
   *
   * @param chatId - ID чата
   * @returns Массив участников чата с информацией о пользователях
   *
   * @spec
   * - Включает всех участников чата
   * - Для каждого участника получает информацию из users
   * - Сортировка: OWNER first, then ADMIN, then MEMBER
   */
  getChatParticipants(chatId: string): Promise<ChatParticipantsListResponse>;
  
  /**
   * Добавить участника в групповой чат
   *
   * @param chatId - ID чата
   * @param userId - ID пользователя для добавления
   * @param role - Роль пользователя (MEMBER по умолчанию)
   * @returns Созданная запись участника
   *
   * @spec
   * - Создаёт запись в conversation_participants
   * - Проверяет что пользователь ещё не участник (бросает ошибку если есть)
   * - Выполняется в транзакции
   */
  addChatParticipant(
  chatId: string,
  userId: string,
  role: ParticipantRole
  ): Promise<ConversationParticipant>;
  
  /**
   * Получить информацию об участнике чата
   *
   * @param chatId - ID чата
   * @param userId - ID пользователя
   * @returns Запись участника или null если не найден
   *
   * @spec
   * - Возвращает null если участник не найден
   * - Используется для проверки прав доступа (OWNER, ADMIN)
   */
   getChatParticipant(
     chatId: string,
     userId: string
   ): Promise<ConversationParticipant | null>;
 
  /**
   * Получить ID заблокированных пользователей
   *
   * @returns Массив ID заблокированных пользователей
   *
   * @spec
   * - Используется для исключения заблокированных пользователей из поиска
   */
    getBlockedUserIds(): Promise<string[]>;
  
  /**
   * Изменить роль участника в чате
   *
   * @param chatId - ID чата
   * @param userId - ID пользователя, чью роль меняем
   * @param newRole - Новая роль
   * @returns Обновлённая запись участника
   *
   * @spec
   * - Обновляет запись в conversation_participants
   * - Возвращает обновлённый объект с полной информацией об участнике
   */
  updateParticipantRole(
    chatId: string,
    userId: string,
    newRole: ParticipantRole
  ): Promise<ConversationParticipant>;

  /**
   * Удалить участника из чата
   *
   * @param chatId - ID чата
   * @param userId - ID пользователя для удаления
   *
   * @spec
   * - Удаляет запись из conversation_participants
   * - Физическое удаление записи
   */
  removeChatParticipant(
    chatId: string,
    userId: string
  ): Promise<void>;

  /**
   * Получить информацию об участнике чата с деталями пользователя
   *
   * @param chatId - ID чата
   * @param userId - ID пользователя
   * @returns Объект ChatParticipantListItem или null если не найден
   *
   * @spec
   * - Загружает информацию о пользователе (имя, фамилия) для displayName
   * - Возвращает null если участник не найден
   */
  getChatParticipantWithDetails(
    chatId: string,
    userId: string
  ): Promise<ChatParticipantListItem | null>;
}
