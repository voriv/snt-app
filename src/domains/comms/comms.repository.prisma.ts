/**
 * @file comms.repository.prisma.ts
 * @domain comms
 * @description Prisma-реализация репозитория коммуникаций
 *
 * @spec
 * - Использует Prisma Client для доступа к БД
 * - getUserConversations: JOIN conversation_participants + conversations + messages + users
 * - Фильтр: только DIRECT диалоги
 * - unreadCount: количество сообщений после lastReadAt от других отправителей
 * - lastMessagePreview: обрезка до 60 символов
 *
 * @see src/domains/comms/comms.repository.interface.ts
 */
import { prisma } from '@/infrastructure/prisma/client';
import type {
  ChatListItem,
  ChatListResponse,
  ChatParticipantListItem,
  ChatParticipantsListResponse,
  Conversation,
  ConversationListResponse,
  ConversationParticipant,
  CreateChatData,
  Message,
  ParticipantRole,
  UpdateChatData,
} from './comms.types';
import type { ICommsRepository, GetUserConversationsOptions, CreateMessageData } from './comms.repository.interface';
import { CannotEditChatError, ParticipantAlreadyExistsError, CannotAddParticipantError, ChatParticipantNotFoundError, BadRequestError } from './comms.errors';

/**
 * @class PrismaCommsRepository
 * @domain comms
 * @description Prisma-реализация ICommsRepository
 *
 * @spec
 * - getUserConversations использует несколько запросов для эффективности:
 *   1. Получить все участники текущего пользователя (DIRECT диалоги)
 *   2. Для каждого диалога получить:lastMessage, unreadCount, peer info
 * - findById: простой findUnique
 * - isParticipant: findUnique по composite key
 */
export class PrismaCommsRepository implements ICommsRepository {
  /**
   * Получить список личных диалогов пользователя с пагинацией
   *
   * @param userId - ID текущего пользователя
   * @param options - Опции запроса (search, limit, page)
   * @returns Пагинированный ответ со списком диалогов
   *
   * @spec
   * - Шаг 1: Найти все ConversationParticipant где userId и conversation.type = DIRECT
   * - Шаг 2: Для каждого диалога получить данные через bulk queries:
   *   - Конверсация (conversation data)
   *   - Последнее сообщение (last message ordered by createdAt DESC, take 1)
   *   - Непрочитанные (count messages where createdAt > lastReadAt AND senderId !== userId)
   *   - Собеседник (другой participant + user profile)
   * - Шаг 3: Применить поиск по имени собеседника
   * - Шаг 4: Сортировка по lastMessageAt DESC
   * - Шаг 5: Пагинация
   */
  async getUserConversations(
    userId: string,
    options?: GetUserConversationsOptions
  ): Promise<ConversationListResponse> {
    const { search, limit = 20, page = 1 } = options ?? {};
    const skip = (page - 1) * limit;

    // Step 1: Найти все участники текущего пользователя
    const myParticipants = await prisma.conversationParticipant.findMany({
      where: { userId },
      select: {
        id: true,
        conversationId: true,
        lastReadAt: true,
      },
    });

    if (myParticipants.length === 0) {
      return { items: [], total: 0 };
    }

    // Step 2: Получить диалоги и отфильтровать только DIRECT
    const myConversationIds = myParticipants.map((p) => p.conversationId);
    const conversations = await prisma.conversation.findMany({
      where: {
        id: { in: myConversationIds },
        type: 'DIRECT',
      },
      select: {
        id: true,
        createdAt: true,
      },
    });

    if (conversations.length === 0) {
      return { items: [], total: 0 };
    }

    const directConversationIds = conversations.map((c) => c.id);
    // Создаём мапу participant -> conversation для удобства
    const participantMap = new Map(
      myParticipants.filter((p) => directConversationIds.includes(p.conversationId)).map((p) => [
        p.conversationId,
        p,
      ])
    );

    // Step 3: Получить все участники для DIRECT диалогов
    const allParticipants = await prisma.conversationParticipant.findMany({
      where: { conversationId: { in: directConversationIds } },
      select: {
        conversationId: true,
        userId: true,
      },
    });

    // Step 4: Собрать все peer userId для загрузки профилей
    const peerUserIds = new Set<string>();
    const peerByConversation = new Map<string, string>();
    for (const convId of directConversationIds) {
      const convParticipants = allParticipants.filter((p) => p.conversationId === convId);
      const peer = convParticipants.find((p) => p.userId !== userId);
      if (peer) {
        peerUserIds.add(peer.userId);
        peerByConversation.set(convId, peer.userId);
      }
    }

    // Step 5: Загрузить профили собеседников
    const peerUserIdsArray = Array.from(peerUserIds);
    const peerUsers = peerUserIdsArray.length > 0
      ? await prisma.user.findMany({
          where: { id: { in: peerUserIdsArray } },
          select: {
            id: true,
            email: true,
            profile: {
              select: {
                first_name: true,
                last_name: true,
                avatar: true,
              },
            },
          },
        })
      : [];

    type UserData = { id: string; email: string | null; profile: { first_name: string; last_name: string; avatar: string | null } | null } | null;
    const userMap = new Map<string, UserData>(
      peerUsers.map((u) => [u.id, u])
    );

    // Step 6: Получить последние сообщения для каждого диалога
    const lastMessagesRaw = await prisma.message.findMany({
      where: {
        conversationId: { in: directConversationIds },
      },
      orderBy: { createdAt: 'desc' },
      select: {
        conversationId: true,
        content: true,
        createdAt: true,
        senderId: true,
      },
    });

    // Оставляем только последнее сообщение для каждого диалога
    const lastMessageMap = new Map<string, (typeof lastMessagesRaw)[0]>();
    for (const msg of lastMessagesRaw) {
      if (!lastMessageMap.has(msg.conversationId)) {
        lastMessageMap.set(msg.conversationId, msg);
      }
    }

    // Step 7: Построить список диалогов
    const items = await Promise.all(
      conversations.map(async (conversation) => {
        const participant = participantMap.get(conversation.id)!;
        const peerId = peerByConversation.get(conversation.id) ?? '';
        const peerUser = peerId ? userMap.get(peerId) : null;

        // Формирование имени собеседника
        const profile = peerUser?.profile;
        const firstName = profile?.first_name ?? '';
        const lastName = profile?.last_name ?? '';
        const participantName = [firstName, lastName].filter(Boolean).join(' ') || 'Удалённый пользователь';

        // Аватар собеседника
        const participantAvatar = profile?.avatar ?? null;

        // Последнее сообщение
        const lastMsg = lastMessageMap.get(conversation.id);
        const lastMessagePreview = lastMsg
          ? lastMsg.content.length > 60
            ? lastMsg.content.slice(0, 60) + '...'
            : lastMsg.content
          : null;

        // Время последнего сообщения (или время создания диалога)
        const lastMessageAt = lastMsg ? lastMsg.createdAt : conversation.createdAt;

        // Подсчет непрочитанных сообщений
        const unreadCount = await prisma.message.count({
          where: {
            conversationId: conversation.id,
            senderId: { not: userId },
            createdAt: { gt: participant.lastReadAt ?? new Date(0) },
          },
        });

        return {
          conversationId: conversation.id,
          participantId: peerId,
          participantName,
          participantEmail: peerUser?.email ?? null,
          participantAvatar,
          lastMessagePreview,
          lastMessageAt,
          unreadCount,
        };
      })
    );

    // Step 8: Применение поиска по имени собеседника
    let filteredItems = items;
    if (search) {
      const searchLower = search.toLowerCase();
      filteredItems = items.filter((item) =>
        item.participantName.toLowerCase().includes(searchLower)
      );
    }

    // Step 9: Сортировка по lastMessageAt DESC
    filteredItems.sort((a, b) => b.lastMessageAt.getTime() - a.lastMessageAt.getTime());

    // Step 10: Пагинация
    const total = filteredItems.length;
    const paginatedItems = filteredItems.slice(skip, skip + limit);

    return {
      items: paginatedItems,
      total,
    };
  }

  /**
   * Найти диалог по идентификатору
   *
   * @param id - Уникальный идентификатор диалога
   * @returns Объект Conversation или null если не найден
   *
   * @spec
   * - Простой findUnique по id
   * - Возвращает null если не найден (НЕ бросает ошибку)
   * - Маппинг Prisma → доменный тип
   */
  async findById(id: string): Promise<Conversation | null> {
    const conversation = await prisma.conversation.findUnique({
      where: { id },
    });

    if (!conversation) {
      return null;
    }

    return {
      id: conversation.id,
      type: conversation.type as Conversation['type'],
      title: conversation.title,
      description: conversation.description,
      plotId: conversation.plotId,
      createdBy: conversation.createdBy,
      createdAt: conversation.createdAt,
      updatedAt: conversation.updatedAt,
    };
  }

  /**
   * Проверить является ли пользователь участником диалога
   *
   * @param conversationId - ID диалога
   * @param userId - ID пользователя
   * @returns true если пользователь является участником, false иначе
   *
   * @spec
   * - Использует findFirst с unique constraint [conversationId, userId]
   * - Возвращает false если запись не найдена (НЕ бросает ошибку)
   */
  async isParticipant(conversationId: string, userId: string): Promise<boolean> {
    const participant = await prisma.conversationParticipant.findFirst({
      where: {
        conversationId,
        userId,
      },
      select: { id: true },
    });

    return participant !== null;
  }

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
  async findConversationBetween(userAId: string, userBId: string): Promise<Conversation | null> {
    // Найти все DIRECT диалоги где userA участник
    const userAConversations = await prisma.conversationParticipant.findMany({
      where: { userId: userAId },
      select: { conversationId: true },
    });

    if (userAConversations.length === 0) {
      return null;
    }

    // Проверить каждый диалог на наличие userB как участника
    for (const { conversationId } of userAConversations) {
      const conversation = await prisma.conversation.findUnique({
        where: { id: conversationId, type: 'DIRECT' },
      });

      if (!conversation) {
        continue;
      }

      const userBParticipant = await prisma.conversationParticipant.findFirst({
        where: { conversationId, userId: userBId },
        select: { id: true },
      });

      if (userBParticipant) {
        return {
          id: conversation.id,
          type: conversation.type as Conversation['type'],
          title: conversation.title,
          description: conversation.description ?? null,
          plotId: conversation.plotId,
          createdBy: conversation.createdBy,
          createdAt: conversation.createdAt,
          updatedAt: conversation.updatedAt,
        };
      }
    }

    return null;
  }

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
  async createConversation(
    type: 'DIRECT',
    participantIds: string[],
    createdBy: string
  ): Promise<Conversation> {
    const conversation = await prisma.$transaction(async (tx) => {
      // Создать конверсацию
      const newConversation = await tx.conversation.create({
        data: {
          type,
          createdBy,
        },
      });

      // Создать участников
      await tx.conversationParticipant.createMany({
        data: participantIds.map((userId, index) => ({
          conversationId: newConversation.id,
          userId,
          role: index === 0 ? 'OWNER' : 'MEMBER',
        })),
      });

      return newConversation;
    });

    return {
      id: conversation.id,
      type: conversation.type as Conversation['type'],
      title: conversation.title,
      description: conversation.description ?? null,
      plotId: conversation.plotId,
      createdBy: conversation.createdBy,
      createdAt: conversation.createdAt,
      updatedAt: conversation.updatedAt,
    };
  }

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
  async getConversationMessages(conversationId: string): Promise<Message[]> {
    const messages = await prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
    });

    return messages.map(mapMessageToDomain);
  }

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
  async createMessage(data: CreateMessageData): Promise<Message> {
    const message = await prisma.message.create({
      data: {
        conversationId: data.conversationId,
        senderId: data.senderId,
        content: data.content,
        replyToId: data.replyToId ?? null,
      },
    });

    return mapMessageToDomain(message);
  }

  /**
   * Найти сообщение по идентификатору
   *
   * @param messageId - Уникальный идентификатор сообщения
   * @returns Объект Message или null если не найден
   *
   * @spec
   * - Возвращает null если не найден (НЕ бросает ошибку)
   */
  async findMessageById(messageId: string): Promise<Message | null> {
    const message = await prisma.message.findUnique({
      where: { id: messageId },
    });

    if (!message) {
      return null;
    }

    return mapMessageToDomain(message);
  }

  /**
   * Получить ID отправителя сообщения
   *
   * @param messageId - Уникальный идентификатор сообщения
   * @returns ID отправителя или null если сообщение не найдено
   *
   * @spec
   * - Используется для проверки владения сообщением перед удалением
   */
  async getMessageSender(messageId: string): Promise<string | null> {
    const message = await prisma.message.findUnique({
      where: { id: messageId },
      select: { senderId: true },
    });

    return message?.senderId ?? null;
  }

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
  async softDeleteMessage(messageId: string, deletedBy: string): Promise<void> {
    await prisma.message.update({
      where: { id: messageId },
      data: {
        isDeleted: true,
        deletedBy,
        deletedAt: new Date(),
      },
    });
  }

  /**
   * Получить список групповых чатов пользователя с пагинацией
   *
   * @param userId - ID текущего пользователя
   * @param options - Опции запроса (search, limit, page)
   * @returns Пагинированный ответ со списком групповых чатов
   *
   * @spec
   * - Шаг 1: Найти все ConversationParticipant где userId и conversation.type = GROUP
   * - Шаг 2: Для каждого чата получить данные через bulk queries:
   *   - Чат (conversation data с title)
   *   - Последнее сообщение (last message ordered by createdAt DESC, take 1)
   *   - Непрочитанные (count messages where createdAt > lastReadAt AND senderId !== userId)
   *   - Количество участников (count participants)
   * - Шаг 3: Применить поиск по названию чата
   * - Шаг 4: Сортировка по lastMessageAt DESC
   * - Шаг 5: Пагинация
   */
  async getUserGroupChats(
    userId: string,
    options?: GetUserConversationsOptions
  ): Promise<ChatListResponse> {
    const { search, limit = 20, page = 1 } = options ?? {};
    const skip = (page - 1) * limit;

    // Step 1: Найти все участники текущего пользователя
    const myParticipants = await prisma.conversationParticipant.findMany({
      where: { userId },
      select: {
        id: true,
        conversationId: true,
        lastReadAt: true,
      },
    });

    if (myParticipants.length === 0) {
      return { items: [], total: 0 };
    }

    // Step 2: Получить чаты и отфильтровать только GROUP
    const myConversationIds = myParticipants.map((p) => p.conversationId);
    const conversations = await prisma.conversation.findMany({
      where: {
        id: { in: myConversationIds },
        type: 'GROUP',
      },
      select: {
        id: true,
        title: true,
        createdAt: true,
      },
    });

    if (conversations.length === 0) {
      return { items: [], total: 0 };
    }

    const groupConversationIds = conversations.map((c) => c.id);

    // Создаём мапу participant -> conversation для удобства
    const participantMap = new Map(
      myParticipants.filter((p) => groupConversationIds.includes(p.conversationId)).map((p) => [
        p.conversationId,
        p,
      ])
    );

    // Step 3: Получить количество участников для каждого чата
    const participantCounts = await prisma.conversationParticipant.groupBy({
      by: ['conversationId'],
      where: { conversationId: { in: groupConversationIds } },
      _count: { conversationId: true },
    });

    const participantCountMap = new Map(
      participantCounts.map((p) => [p.conversationId, p._count.conversationId])
    );

    // Step 4: Получить последние сообщения для каждого чата
    const lastMessagesRaw = await prisma.message.findMany({
      where: {
        conversationId: { in: groupConversationIds },
      },
      orderBy: { createdAt: 'desc' },
      select: {
        conversationId: true,
        content: true,
        createdAt: true,
        senderId: true,
      },
    });

    // Оставляем только последнее сообщение для каждого чата
    const lastMessageMap = new Map<string, (typeof lastMessagesRaw)[0]>();
    for (const msg of lastMessagesRaw) {
      if (!lastMessageMap.has(msg.conversationId)) {
        lastMessageMap.set(msg.conversationId, msg);
      }
    }

    // Step 5: Построить список чатов
    const items = await Promise.all(
      conversations.map(async (conversation) => {
        const participant = participantMap.get(conversation.id)!;

        // Название чата
        const name = conversation.title || 'Без названия';

        // Последнее сообщение
        const lastMsg = lastMessageMap.get(conversation.id);
        const lastMessagePreview = lastMsg
          ? lastMsg.content.length > 60
            ? lastMsg.content.slice(0, 60) + '...'
            : lastMsg.content
          : null;

        // Время последнего сообщения (или время создания чата)
        const lastMessageAt = lastMsg ? lastMsg.createdAt : conversation.createdAt;

        // Количество участников
        const participantCount = participantCountMap.get(conversation.id) ?? 0;

        // Подсчет непрочитанных сообщений
        const unreadCount = await prisma.message.count({
          where: {
            conversationId: conversation.id,
            senderId: { not: userId },
            createdAt: { gt: participant.lastReadAt ?? new Date(0) },
          },
        });

        return {
          chatId: conversation.id,
          name,
          lastMessagePreview,
          lastMessageAt,
          participantCount,
          unreadCount,
        };
      })
    );

    // Step 6: Применение поиска по названию чата
    let filteredItems = items;
    if (search) {
      const searchLower = search.toLowerCase();
      filteredItems = items.filter((item) =>
        item.name.toLowerCase().includes(searchLower)
      );
    }

    // Step 7: Сортировка по lastMessageAt DESC
    filteredItems.sort((a, b) => b.lastMessageAt.getTime() - a.lastMessageAt.getTime());

    // Step 8: Пагинация
    const total = filteredItems.length;
    const paginatedItems = filteredItems.slice(skip, skip + limit);

    return {
      items: paginatedItems,
      total,
    };
  }

  /**
   * Создать групповой чат в транзакции
   *
   * @param creatorId - ID создателя чата
   * @param data - Данные для создания чата
   * @returns Созданный объект Conversation
   */
  async createGroupChat(
    creatorId: string,
    data: CreateChatData
  ): Promise<Conversation> {
    const { name, description, participantIds } = data;

    return await prisma.$transaction(async (tx) => {
      // 1. Создать запись в conversations
      const conversation = await tx.conversation.create({
        data: {
          type: 'GROUP',
          title: name,
          description,
          createdBy: creatorId,
        },
      });

      // 2. Создать запись для создателя с ролью OWNER
      await tx.conversationParticipant.create({
        data: {
          conversationId: conversation.id,
          userId: creatorId,
          role: 'OWNER',
        },
      });

      // 3. Создать записи для всех участников с ролью MEMBER
      if (participantIds.length > 0) {
        await tx.conversationParticipant.createMany({
          data: participantIds.map((userId) => ({
            conversationId: conversation.id,
            userId,
            role: 'MEMBER',
          })),
        });
      }

      return {
        id: conversation.id,
        type: conversation.type as 'DIRECT' | 'GROUP' | 'ANNOUNCEMENT',
        title: conversation.title,
        description: conversation.description,
        plotId: conversation.plotId,
        createdBy: conversation.createdBy,
        createdAt: conversation.createdAt,
        updatedAt: conversation.updatedAt,
      };
    });
    }
    
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
    * - Обновляет поля title и description
    * - Выбрасывает CannotEditChatError если у пользователя нет прав
    */
    async updateChat(chatId: string, userId: string, data: UpdateChatData): Promise<Conversation> {
      const { name, description } = data;
    
      // 1. Найти участника с правами (owner или admin)
      const participant = await prisma.conversationParticipant.findFirst({
        where: {
          conversationId: chatId,
          userId,
          role: {
            in: ['OWNER', 'ADMIN'],
          },
        },
        include: {
          conversation: true,
        },
      });
    
      if (!participant || !participant.conversation) {
        throw new CannotEditChatError();
      }
    
      const updateData: any = {};
      if (name !== undefined) updateData.title = name;
      if (description !== undefined) updateData.description = description;
    
      const updatedConversation = await prisma.conversation.update({
        where: { id: chatId },
        data: updateData,
      });
    
      return {
        id: updatedConversation.id,
        type: updatedConversation.type as 'DIRECT' | 'GROUP' | 'ANNOUNCEMENT',
        title: updatedConversation.title,
        description: updatedConversation.description,
        plotId: updatedConversation.plotId,
        createdBy: updatedConversation.createdBy,
        createdAt: updatedConversation.createdAt,
        updatedAt: updatedConversation.updatedAt,
      };
    }
    
    /**
    * Проверить существование группового чата с таким названием у пользователя
   *
   * @param userId - ID пользователя
   * @param name - Название чата
   * @returns true если чат с таким названием уже существует
   */
  async groupChatExistsByName(userId: string, name: string): Promise<boolean> {
    const count = await prisma.conversationParticipant.count({
      where: {
        userId,
        conversation: {
          type: 'GROUP',
          title: {
            equals: name,
            mode: 'insensitive',
          },
        },
      },
    });

    return count > 0;
  }

  /**
   * Получить список участников группового чата
   *
   * @param chatId - ID чата
   * @returns Список участников с информацией о пользователях
   *
   * @spec
   * - Включает всех участников чата
   * - Для каждого участника получает информацию из users (отдельный запрос)
   * - Сортировка: OWNER first, then ADMIN, then MEMBER
   */
 async getChatParticipants(chatId: string): Promise<ChatParticipantsListResponse> {
   // 1. Получить все записи conversation_participants для чата
   const participants = await prisma.conversationParticipant.findMany({
     where: { conversationId: chatId },
   });

   // 2. Собрать все userId для загрузки профилей
   const userIds = participants.map((p) => p.userId);
   const users = userIds.length > 0
     ? await prisma.user.findMany({
         where: { id: { in: userIds } },
         select: {
           id: true,
           email: true,
           name: true,
           profile: {
             select: {
               first_name: true,
               last_name: true,
               avatar: true,
             },
           },
         },
       })
     : [];

   // 3. Создать мапу userId -> user для быстрого доступа
   const userMap = new Map(users.map((u) => [u.id, u]));

   // 4. Преобразовать в доменный формат
   const participantItems: ChatParticipantListItem[] = participants.map((p) => {
     const user = userMap.get(p.userId);
     const profile = user?.profile;
     const firstName = profile?.first_name ?? '';
     const lastName = profile?.last_name ?? '';
     // Используем имя из профиля, если пусто - используем name, если пусто - email
     let displayName = [firstName, lastName].filter(Boolean).join(' ');
     if (!displayName && user?.name) {
       displayName = user.name;
     }
     if (!displayName && user?.email) {
       displayName = user.email.split('@')[0];
     }
     displayName = displayName || 'Удалённый пользователь';

     return {
       userId: p.userId,
       role: p.role as ParticipantRole,
       displayName,
       isOwner: p.role === 'OWNER',
       isCurrent: false, // Будет установлено в сервисе после получения currentUserId
     };
   });

   // 5. Сортировка: OWNER first, then ADMIN, then MEMBER
   const roleOrder: Record<ParticipantRole, number> = {
     OWNER: 0,
     ADMIN: 1,
     MEMBER: 2,
   };

   participantItems.sort((a, b) => roleOrder[a.role] - roleOrder[b.role]);

   return {
     participants: participantItems,
     count: participantItems.length,
   };
 }

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
   * - Проверяет что пользователь ещё не участник (бросает ParticipantAlreadyExistsError если есть)
   * - Выполняется в транзакции
   */
  async addChatParticipant(
    chatId: string,
    userId: string,
    role: ParticipantRole
  ): Promise<ConversationParticipant> {
    // 1. Проверить что пользователь уже не участник
    const existing = await prisma.conversationParticipant.findFirst({
      where: {
        conversationId: chatId,
        userId,
      },
    });

    if (existing) {
      throw new ParticipantAlreadyExistsError();
    }

    // 2. Создать запись в транзакции
    const participant = await prisma.$transaction(async (tx) => {
      return tx.conversationParticipant.create({
        data: {
          conversationId: chatId,
          userId,
          role,
        },
      });
    });

    return {
      id: participant.id,
      conversationId: participant.conversationId,
      userId: participant.userId,
      role: participant.role as ParticipantRole,
      lastReadAt: participant.lastReadAt,
      joinedAt: participant.joinedAt,
    };
  }

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
  async getChatParticipant(
    chatId: string,
    userId: string
  ): Promise<ConversationParticipant | null> {
    return prisma.conversationParticipant.findFirst({
      where: {
        conversationId: chatId,
        userId,
      },
    });
  }

  /**
   * Обновить роль участника в чате
   *
   * @param chatId - ID чата
   * @param userId - ID пользователя, у которого обновляется роль
   * @param newRole - Новая роль
   * @returns Обновлённая запись conversation_participant
   *
   * @spec
   * - Обновляет запись в conversation_participants
   * - Выполняется в транзакции
   */
  async updateParticipantRole(
    chatId: string,
    userId: string,
    newRole: ParticipantRole
  ): Promise<ConversationParticipant> {
    return await prisma.$transaction(async (tx) => {
      const updated = await tx.conversationParticipant.update({
        where: {
          conversationId_userId: {
            conversationId: chatId,
            userId,
          },
        },
        data: {
          role: newRole,
        },
      });

      return {
        id: updated.id,
        conversationId: updated.conversationId,
        userId: updated.userId,
        role: updated.role as ParticipantRole,
        lastReadAt: updated.lastReadAt,
        joinedAt: updated.joinedAt,
      };
    });
  }

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
  async removeChatParticipant(
    chatId: string,
    userId: string
  ): Promise<void> {
    return await prisma.$transaction(async (tx) => {
      await tx.conversationParticipant.delete({
        where: {
          conversationId_userId: {
            conversationId: chatId,
            userId,
          },
        },
      });
    });
  }

  /**
   * Получить ID заблокированных пользователей
   *
   * @returns Массив ID заблокированных пользователей
   *
   * @spec
   * - Используется для исключения заблокированных пользователей из поиска
   * - В текущей реализации возвращает пустой массив, так как в модели User нет поля isBlocked
   */
  async getBlockedUserIds(): Promise<string[]> {
    // TODO: реализовать поле isBlocked в модели User и добавить валидацию
    return [];
  }

  /**
   * Получить информацию об участнике чата с деталями пользователя
   *
   * @param chatId - ID чата
   * @param userId - ID пользователя
   * @returns ChatParticipantListItem или null если не найден
   *
   * @spec
   * - Загружает информацию о пользователе (имя, фамилия) для displayName
   * - Возвращает null если участник не найден
   */
  async getChatParticipantWithDetails(
    chatId: string,
    userId: string
  ): Promise<ChatParticipantListItem | null> {
    return getChatParticipantWithDetails(chatId, userId);
  }
}

/**
 * Сопоставить Prisma Message → доменный тип Message
 */
function mapMessageToDomain(m: any): Message {
  return {
    id: m.id,
    conversationId: m.conversationId,
    senderId: m.senderId,
    content: m.content,
    replyToId: m.replyToId,
    isDeleted: m.isDeleted,
    deletedBy: m.deletedBy,
    deletedAt: m.deletedAt,
    createdAt: m.createdAt,
    updatedAt: m.updatedAt,
  };
}

/**
 * Получить информацию об участнике чата с деталями пользователя
 *
 * @param chatId - ID чата
 * @param userId - ID пользователя
 * @param currentUserId - ID текущего пользователя (для isCurrent флага)
 * @returns ChatParticipantListItem или null
 */
export async function getChatParticipantWithDetails(
  chatId: string,
  userId: string
): Promise<ChatParticipantListItem | null> {
  const participant = await prisma.conversationParticipant.findUnique({
    where: {
      conversationId_userId: {
        conversationId: chatId,
        userId,
      },
    },
    include: {
      user: {
        select: {
          name: true,
          email: true,
          profile: {
            select: {
              first_name: true,
              last_name: true,
            },
          },
        },
      },
    },
  });

  if (!participant) {
    return null;
  }

  const profile = participant.user?.profile;
  const firstName = profile?.first_name ?? '';
  const lastName = profile?.last_name ?? '';
  let displayName = [firstName, lastName].filter(Boolean).join(' ');
  if (!displayName && participant.user?.name) {
    displayName = participant.user.name;
  }
  if (!displayName && participant.user?.email) {
    displayName = participant.user.email.split('@')[0];
  }
  displayName = displayName || 'Удалённый пользователь';

  return {
    userId: participant.userId,
    role: participant.role as ParticipantRole,
    displayName,
    isOwner: participant.role === 'OWNER',
    isCurrent: false, // Будет установлено в сервисе
  };
}
