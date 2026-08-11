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
import { Prisma } from '@prisma/client';
import type {
  ChatListResponse,
  ChatParticipantListItem,
  ChatParticipantsListResponse,
  Conversation,
  ConversationListResponse,
  ConversationParticipant,
  CreateChatData,
  Message,
  MessageWithReadStatus,
  ParticipantRole,
  UnreadCounts,
  UpdateChatData,
} from './comms.types';
import type { ICommsRepository, GetUserConversationsOptions, CreateMessageData } from './comms.repository.interface';
import { CannotEditChatError, DuplicateConversationError, ParticipantAlreadyExistsError, ParticipantNotFoundError } from './comms.errors';

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
   *   - Непрочитанные (count messages where createdAt > lastReadAt AND senderId !== userId
   *     AND isDeleted = false — B-027, причина #3: удалённые сообщения не учитываются)
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

    type UserData = { id: string; email: string | null; name: string | null; profile: { first_name: string; last_name: string; avatar: string | null } | null } | null;
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
    /**
     * B-031: Защита non-null assertion для participantMap.get().
     *
     * Ранее использовался оператор `!` (`participantMap.get(conversation.id)!`),
     * что при отсутствии participant в Map приводило к TypeError и HTTP 500.
     *
     * Паттерн обработки: `return null` внутри `.map()` callback (НЕ `continue` —
     * запрещён в `.map()`), последующая фильтрация через type guard
     * `.filter((item): item is NonNullable<typeof item> => item !== null)`.
     *
     * @task B031-T2-1
     * @see docs/specs/comms/B-031-component-spec.md (раздел 3.2.1)
     * @see docs/plans/REQ-COMMS-004-B031-plan.md (задача T2-1)
     */
    const items = (
      await Promise.all(
        conversations.map(async (conversation) => {
          const participant = participantMap.get(conversation.id);
          if (!participant) {
            // B031-T2-1: корректная обработка отсутствующего participant
            // вместо non-null assertion, которое приводило к TypeError → 500
            console.warn(
              `[CommsRepository] Participant not found for conversation ${conversation.id}, skipping`
            );
            return null;
          }
          const peerId = peerByConversation.get(conversation.id) ?? '';
          const peerUser = peerId ? userMap.get(peerId) : null;

        // Формирование имени собеседника
        // Приоритет: 1) firstName+lastName из профиля, 2) user.name, 3) user.email, 4) "Удалённый пользователь"
        const profile = peerUser?.profile;
        const firstName = profile?.first_name ?? '';
        const lastName = profile?.last_name ?? '';
        const fullName = [firstName, lastName].filter(Boolean).join(' ');
        const userName = peerUser?.name ?? '';
        const userEmail = peerUser?.email ?? '';
        const participantName = fullName || userName || userEmail || 'Удалённый пользователь';

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
            isDeleted: false,
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
      )
      // B031-T2-1: фильтруем диалоги без participant (return null выше)
      // type guard сужает тип до NonNullable
    ).filter((item): item is NonNullable<typeof item> => item !== null);

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
   * Проверить существование пользователя по ID
   *
   * @param userId - ID пользователя
   * @returns true если пользователь существует
   *
   * @spec
   * - Простой findUnique по id (select id)
   * - Возвращает false если пользователь не найден (НЕ бросает ошибку)
   *
   * @b030 B-030 (Д2): используется в startConversation перед createConversation,
   * чтобы несуществующий собеседник давал 4xx, а не P2003 (внешний ключ) → 200.
   */
  async userExists(userId: string): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });
    return user !== null;
  }

  /**
   * Найти личный (DIRECT) диалог между двумя пользователями
   *
   * @param userAId - ID первого пользователя
   * @param userBId - ID второго пользователя
   * @returns Объект Conversation или null если не найден
   *
   * @spec
   * - Ищет диалог типа DIRECT, где участниками являются оба пользователя
   * - Порядок userA/userB не важен (A,B = B,A)
   * - Возвращает null если диалог не найден (НЕ бросает ошибку)
   *
   * @optimization B-029 T2-1 (P2-3): единый findMany вместо N+1 цикла.
   * Запрос participant-записей обоих пользователей за один SQL-запрос,
   * группировка по conversationId в памяти, выбор общего conversationId,
   * затем одна проверка type='DIRECT'.
   *
   * @traces B-029 T2-1, AC-04 (REQ-COMMS-004)
   */
  async findConversationBetween(userAId: string, userBId: string): Promise<Conversation | null> {
    // Найти participant-записи для обоих пользователей одним запросом
    const participants = await prisma.conversationParticipant.findMany({
      where: { userId: { in: [userAId, userBId] } },
      select: { conversationId: true, userId: true },
    });

    if (participants.length === 0) {
      return null;
    }

    // Сгруппировать userId по conversationId
    const convParticipants = new Map<string, Set<string>>();
    for (const p of participants) {
      let set = convParticipants.get(p.conversationId);
      if (!set) {
        set = new Set<string>();
        convParticipants.set(p.conversationId, set);
      }
      set.add(p.userId);
    }

    // Найти conversationId, где оба пользователя являются участниками
    const commonConvId = Array.from(convParticipants.entries()).find(
      ([, userIds]) => userIds.has(userAId) && userIds.has(userBId)
    )?.[0];

    if (!commonConvId) {
      return null;
    }

    // Проверить что это DIRECT диалог (не GROUP/ANNOUNCEMENT)
    const conversation = await prisma.conversation.findFirst({
      where: { id: commonConvId, type: 'DIRECT' },
    });

    if (!conversation) {
      return null;
    }

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
   * - lastReadAt = now() инициализируется для всех участников (B-027, причина #2:
   *   история до создания диалога не считается непрочитанной)
   * - Выполняется в транзакции
   *
   * @b029 B-029 T2-1 (BR-06, NFR-03):
   * - Для DIRECT-диалогов вычисляется pairKey = sorted(participantIds).join('|')
   *   и сохраняется на диалоге (conversation.create data) — одна строка на диалог,
   *   что гарантирует корректную работу partial unique index при дубликате.
   * - При P2002 (unique constraint violation на pair_key) — race condition:
   *   вызывается findConversationBetween для определения ID уже существующего
   *   диалога и бросается DuplicateConversationError(existingId).
   *   Service-слой преобразует её в ConversationAlreadyExistsError.
   * - Для GROUP/ANNOUNCEMENT pairKey = undefined (NULL в БД, индекс не применяется).
   *
   * @throws {DuplicateConversationError} при race condition (P2002 на pair_key)
   *
   * @traces B-029 T2-1, AC-03 (REQ-COMMS-004)
   */
  async createConversation(
    type: 'DIRECT',
    participantIds: string[],
    createdBy: string
  ): Promise<Conversation> {
    try {
      const conversation = await prisma.$transaction(async (tx) => {
        // B-029: Вычислить pairKey для DIRECT-диалога ДО вставки.
        // Сортировка IDs гарантирует детерминированный ключ независимо от порядка
        // аргументов (A,B === B,A) — совпадает с backfill-логикой миграции
        // (MIN/MAX user_id). Хранится на диалоге — одна строка на диалог.
        const pairKey =
          type === 'DIRECT'
            ? [...participantIds].sort().join('|')
            : undefined;

        // Создать конверсацию
        const newConversation = await tx.conversation.create({
          data: {
            type,
            createdBy,
            // B-029: pairKey передаётся только для DIRECT (для GROUP = undefined → NULL)
            pairKey,
          },
        });

        // Создать участников
        // Для DIRECT-диалогов: инициализируем lastReadAt = now(), чтобы при
        // создании диалога его история (пустая на момент создания) не считалась
        // как непрочитанная (B-027, причина #2 — консистентность с GROUP).
        await tx.conversationParticipant.createMany({
          data: participantIds.map((userId, index) => ({
            conversationId: newConversation.id,
            userId,
            role: index === 0 ? 'OWNER' : 'MEMBER',
            lastReadAt: new Date(),
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
    } catch (error) {
      // B-029: обработка race condition — параллельный запрос создал диалог первым.
      // Unique constraint violation на pair_key (partial unique index).
      // Repository НЕ знает о ConversationAlreadyExistsError (service-level) —
      // использует собственный DuplicateConversationError с existingConversationId.
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        const existing = await this.findConversationBetween(
          participantIds[0],
          participantIds[1]
        );
        if (existing) {
          throw new DuplicateConversationError(existing.id);
        }
      }

      // B-030 (Д2, страховка): P2003 — внешний ключ нарушен (собеседник
      // не существует). Service уже проверяет через userExists, но защищаемся и здесь,
      // чтобы несуществующий участник никогда не давал 200 с сырым P2003.
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2003'
      ) {
        throw new ParticipantNotFoundError(participantIds[0], participantIds[1]);
      }

      throw error;
    }
  }

  /**
   * Получить все сообщения диалога
   *
   * @param conversationId - ID диалога
   * @returns Массив сообщений с данными отправителя, отсортированных по времени (ASC)
   *
   * @spec
   * - Возвращает все сообщения включая удалённые (фильтрация на уровне UI)
   * - Сортировка: по createdAt ASC (хронологический порядок)
   * - Включает данные отправителя (sender) для отображения имени/email
   * - senderName формируется как "firstName lastName" из профиля пользователя
   * - senderEmail берётся из User.email, если профиль отсутствует
   * - senderAvatarUrl берётся из UserProfile.avatarUrl
   */
  async getConversationMessages(conversationId: string): Promise<Message[]> {
    const messages = await prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
      include: {
        sender: {
          include: {
            profile: true,
          },
        },
      },
    });

    return messages.map(mapMessageToDomain);
  }

  /**
   * Создать новое сообщение
   *
   * @param data - Данные для создания сообщения
   * @returns Созданный объект Message с данными отправителя
   *
   * @spec
   * - Создаёт запись в messages
   * - isDeleted по умолчанию false
   * - Включает данные отправителя (sender включается через findUnique после создания)
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

    // После создания загружаем сообщение с данными отправителя
    const messageWithSender = await prisma.message.findUnique({
      where: { id: message.id },
      include: {
        sender: {
          include: {
            profile: true,
          },
        },
      },
    });

    return mapMessageToDomain(messageWithSender ?? message);
  }

  /**
   * Найти сообщение по идентификатору
   *
   * @param messageId - Уникальный идентификатор сообщения
   * @returns Объект Message с данными отправителя или null если не найден
   *
   * @spec
   * - Возвращает null если не найден (НЕ бросает ошибку)
   * - Включает данные отправителя (sender) для отображения имени/email
   */
  async findMessageById(messageId: string): Promise<Message | null> {
    const message = await prisma.message.findUnique({
      where: { id: messageId },
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
   *   - Непрочитанные (count messages where createdAt > lastReadAt AND senderId !== userId
   *     AND isDeleted = false — B-027, причина #3: удалённые сообщения не учитываются)
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
            isDeleted: false,
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
   *
   * @spec
   * - Создаёт запись в conversations (type = GROUP)
   * - Создатель получает роль OWNER без инициализации lastReadAt (чата ещё нет →
   *   история пуста, B-027, причина #2 — основатель ничего не «пропускает»)
   * - Добавляемые участники (MEMBER) инициализируются lastReadAt = now(), чтобы
   *   будущие сообщения корректно учитывались как непрочитанные (B-027, причина #2)
   * - Выполняется в транзакции
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
        // lastReadAt = now() для участников, добавляемых при создании чата:
        // новый чат не имеет истории до момента создания, поэтому все будущие
        // сообщения корректно учитываются как непрочитанные (для основателя
        // OWNER lastReadAt остаётся неинициализированным — он и так прочитал
        // историю, т.к. чат только что создан им; B-027, причина #2).
        await tx.conversationParticipant.createMany({
          data: participantIds.map((userId) => ({
            conversationId: conversation.id,
            userId,
            role: 'MEMBER',
            lastReadAt: new Date(),
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
    
      const updateData: Prisma.ConversationUpdateInput = {};
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
   * - Инициализирует lastReadAt = now(): новый участник не видит историю чата,
   *   отправленную до вступления, как непрочитанную (B-027, причина #2)
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
      // lastReadAt = now(): новый участник не должен видеть историю чата
      // (отправленную до вступления) как непрочитанную — учитываются только
      // сообщения, отправленные после вступления (B-027, причина #2).
      return tx.conversationParticipant.create({
        data: {
          conversationId: chatId,
          userId,
          role,
          lastReadAt: new Date(),
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

  /**
   * Отметить все сообщения в диалоге как прочитанные для пользователя
   *
   * @param conversationId - ID диалога
   * @param userId - ID пользователя
   *
   * @spec
   * - Проверяет существование participant (conversationId, userId)
   * - Если не найден — бросает ParticipantNotFoundError (404)
   * - UPDATE conversation_participants SET last_read_at = now()
   * - Идемпотентно: повторный вызов не выбрасывает ошибку (AC-4)
   *
   * @traces US-39-01 AC-1, AC-2, AC-4
   * @task B-026-T2-2
   */
  async markAsRead(conversationId: string, userId: string): Promise<void> {
    // Шаг 1: Проверить существование participant
    const participant = await prisma.conversationParticipant.findUnique({
      where: {
        conversationId_userId: {
          conversationId,
          userId,
        },
      },
      select: { id: true },
    });

    if (!participant) {
      throw new ParticipantNotFoundError(conversationId, userId);
    }

    // Шаг 2: Обновить lastReadAt = now() (идемпотентно)
    await prisma.conversationParticipant.update({
      where: {
        conversationId_userId: {
          conversationId,
          userId,
        },
      },
      data: {
        lastReadAt: new Date(),
      },
    });
  }

  /**
   * Получить сообщения диалога со статусом прочтения
   *
   * @param conversationId - ID диалога
   * @param userId - ID текущего пользователя
   * @returns Массив сообщений с полями статуса прочтения, отсортированный по createdAt ASC
   *
   * @spec
   * - Шаг 1: Получить тип диалога (DIRECT/GROUP/ANNOUNCEMENT)
   * - Шаг 2: Получить все сообщения (is_deleted = false) с sender
   * - Шаг 3: Получить всех участников диалога
   * - DIRECT: isReadByRecipient = recipient.lastReadAt >= message.createdAt
   *   (recipient — единственный participant с userId != senderId)
   * - GROUP: readByCount = COUNT(participants WHERE lastReadAt >= createdAt AND userId != senderId)
   *   totalParticipants = COUNT(participants WHERE userId != senderId)
   * - ANNOUNCEMENT: read status не применяется (isReadByRecipient=false)
   * - Сортировка: createdAt ASC
   *
   * @traces US-39-02 AC-1, AC-2, AC-3, AC-6
   * @task B-026-T2-2
   */
  async getMessagesWithReadStatus(
    conversationId: string,
    userId: string
  ): Promise<MessageWithReadStatus[]> {
    // Шаг 1: Получить тип диалога
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      select: { type: true },
    });

    if (!conversation) {
      return [];
    }

    const conversationType = conversation.type;

    // Шаг 2: Получить все не удалённые сообщения с данными отправителя
    const messages = await prisma.message.findMany({
      where: {
        conversationId,
        isDeleted: false,
      },
      orderBy: { createdAt: 'asc' },
      include: {
        sender: {
          include: {
            profile: true,
          },
        },
      },
    });

    if (messages.length === 0) {
      return [];
    }

    // Шаг 3: Получить всех участников диалога с lastReadAt
    const participants = await prisma.conversationParticipant.findMany({
      where: { conversationId },
      select: {
        userId: true,
        lastReadAt: true,
      },
    });

    // Быстрый доступ к lastReadAt по userId
    const lastReadAtMap = new Map<string, Date | null>(
      participants.map((p) => [p.userId, p.lastReadAt])
    );

    // DIRECT: precompute recipient — единственный participant с userId != currentUserId
    let directRecipientLastReadAt: Date | null = null;
    if (conversationType === 'DIRECT') {
      const recipient = participants.find((p) => p.userId !== userId);
      directRecipientLastReadAt = recipient?.lastReadAt ?? null;
    }

    // GROUP: totalParticipants по каждому сообщению = количество участников кроме автора
    // Поскольку участники диалога не зависят от сообщения — кэшируем общий набор
    // (senderId может совпадать с одним из участников — он исключается)
    const participantUserIds = participants.map((p) => p.userId);

    // Шаг 4: Маппинг сообщений → MessageWithReadStatus
    return messages.map((m) => {
      const baseMessage = mapMessageToDomain(m);
      const createdAt = m.createdAt;

      if (conversationType === 'DIRECT') {
        // isReadByRecipient: recipient.lastReadAt >= message.createdAt
        const isRead =
          directRecipientLastReadAt !== null &&
          directRecipientLastReadAt >= createdAt;

        return {
          ...baseMessage,
          isReadByRecipient: isRead,
        };
      }

      if (conversationType === 'GROUP') {
        // Количество получателей кроме автора
        const recipients = participantUserIds.filter(
          (uid) => uid !== m.senderId
        );
        const totalParticipants = recipients.length;

        // Количество прочитавших среди получателей
        let readByCount = 0;
        for (const uid of recipients) {
          const lastRead = lastReadAtMap.get(uid) ?? null;
          if (lastRead !== null && lastRead >= createdAt) {
            readByCount += 1;
          }
        }

        return {
          ...baseMessage,
          isReadByRecipient: readByCount > 0,
          readByCount,
          totalParticipants,
        };
      }

      // ANNOUNCEMENT и прочие: read status не применяется
      return {
        ...baseMessage,
        isReadByRecipient: false,
      };
    });
  }

  /**
   * Подсчитать непрочитанные сообщения по категориям для пользователя
   *
   * @param userId - ID текущего пользователя
   * @returns Счётчики непрочитанных сообщений
   *
   * @covers AC-6 (US-21-37): API /api/v1/comms/unread-counts
   * @see component-spec.md → 3.1.3
   *
   * @spec
   * - messages: сумма непрочитанных в DIRECT диалогах
   * - chats: сумма непрочитанных в GROUP чатах
   * - Непрочитанное = createdAt > lastReadAt AND senderId !== userId AND isDeleted = false
   *   (B-027, причина #3: удалённые сообщения исключаются из счётчиков)
   */
  async getUnreadCounts(userId: string): Promise<UnreadCounts> {
    // Step 1: Получить все записи участника пользователя с типом диалога за один запрос
    const participants = await prisma.conversationParticipant.findMany({
      where: { userId },
      select: {
        conversationId: true,
        lastReadAt: true,
        conversation: {
          select: { type: true },
        },
      },
    });

    // Нет диалогов — нет непрочитанных
    if (participants.length === 0) {
      return { messages: 0, chats: 0 };
    }

    // Step 2: Разделить участников по типу диалога
    const directParticipants = participants.filter(
      (p) => p.conversation.type === 'DIRECT'
    );
    const groupParticipants = participants.filter(
      (p) => p.conversation.type === 'GROUP'
    );

    // Step 3: Подсчитать непрочитанные для каждого участника параллельно
    // Непрочитанное сообщение: createdAt > lastReadAt (или lastReadAt is null) && senderId !== userId
    const [directCounts, groupCounts] = await Promise.all([
      Promise.all(
        directParticipants.map((p) =>
          prisma.message.count({
            where: {
              conversationId: p.conversationId,
              senderId: { not: userId },
              isDeleted: false,
              createdAt: { gt: p.lastReadAt ?? new Date(0) },
            },
          })
        )
      ),
      Promise.all(
        groupParticipants.map((p) =>
          prisma.message.count({
            where: {
              conversationId: p.conversationId,
              senderId: { not: userId },
              isDeleted: false,
              createdAt: { gt: p.lastReadAt ?? new Date(0) },
            },
          })
        )
      ),
    ]);

    // Step 4: Суммировать счётчики по категориям
    const messages = directCounts.reduce((sum, count) => sum + count, 0);
    const chats = groupCounts.reduce((sum, count) => sum + count, 0);

    return { messages, chats };
  }
}

/**
 * Сопоставить Prisma Message → доменный тип Message
 *
 * @spec
 * - Если sender (с profile) включён в Prisma-запрос — извлекает senderName, senderEmail, senderAvatarUrl
 * - senderName формируется как "firstName lastName" из профиля, при отсутствии — User.name
 * - senderEmail берётся из User.email
 * - senderAvatarUrl берётся из UserProfile.avatarUrl
 * - Если sender отсутствует (не включён или удалён) — поля остаются пустыми
 *   (UI обработает это как "Удалённый пользователь")
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapMessageToDomain(m: any): Message {
  // Извлечение данных отправителя, если они включены в запрос
  let senderName = '';
  let senderEmail = '';
  let senderAvatarUrl: string | null = null;

  if (m.sender) {
    const profile = m.sender.profile;
    const firstName = profile?.first_name || '';
    const lastName = profile?.last_name || '';
    const fullName = `${firstName} ${lastName}`.trim();

    senderName = fullName || (m.sender.name || '');
    senderEmail = m.sender.email || '';
    senderAvatarUrl = profile?.avatar_url || null;
  }

  return {
    id: m.id,
    conversationId: m.conversationId,
    senderId: m.senderId,
    senderName,
    senderEmail,
    senderAvatarUrl,
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
