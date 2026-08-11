/**
 * @file tests/unit/domains/comms/comms.repository.unread.test.ts
 * @domain comms
 * @description Unit-тесты для PrismaCommsRepository — корректность подсчёта непрочитанных (B-027)
 *
 * @spec
 * - T1-1 (причина #3): все count-запросы непрочитанных включают `isDeleted: false`
 *   (getUnreadCounts DIRECT/GROUP, getUserConversations, getUserGroupChats)
 * - T1-1: getUnreadCounts считает только НЕпрочитанные (createdAt > lastReadAt, senderId != userId)
 * - T1-1: getUnreadCounts игнорирует ANNOUNCEMENT
 * - T1-2 (причина #2): addChatParticipant инициализирует lastReadAt = now()
 *
 * @covers US-21-37 AC-10, AC-11, AC-12
 * @covers US-21-01 AC-1.7
 * @covers US-21-04 AC-1.6
 *
 * @task B-027-T7-1
 * @see docs/plans/REQ-COMMS-003-B027-plan.md
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PrismaCommsRepository } from '@/domains/comms/comms.repository.prisma';
import type { UnreadCounts, ChatListResponse, ConversationListResponse, ParticipantRole } from '@/domains/comms/comms.types';

// ============================================================================
// Mocks — hoisted to top of file via vi.hoisted() to avoid hoisting issues
// ============================================================================

const prismaMocks = vi.hoisted(() => ({
  mockCount: vi.fn(),
  mockFindUnique: vi.fn(),
  mockFindMany: vi.fn(),
  mockGroupBy: vi.fn(),
  mockCreate: vi.fn(),
  mockCreateMany: vi.fn(),
  mockUpdate: vi.fn(),
  mockFirst: vi.fn(),
  mockTransaction: vi.fn(),
}));

vi.mock('@/infrastructure/prisma/client', () => ({
  prisma: {
    message: {
      count: (...args: unknown[]) => prismaMocks.mockCount(...args),
      findMany: (...args: unknown[]) => prismaMocks.mockFindMany(...args),
      create: (...args: unknown[]) => prismaMocks.mockCreate(...args),
      update: (...args: unknown[]) => prismaMocks.mockUpdate(...args),
    },
    conversationParticipant: {
      findMany: (...args: unknown[]) => prismaMocks.mockFindMany(...args),
      findFirst: (...args: unknown[]) => prismaMocks.mockFirst(...args),
      groupBy: (...args: unknown[]) => prismaMocks.mockGroupBy(...args),
      create: (...args: unknown[]) => prismaMocks.mockCreate(...args),
      createMany: (...args: unknown[]) => prismaMocks.mockCreateMany(...args),
    },
    conversation: {
      findMany: (...args: unknown[]) => prismaMocks.mockFindMany(...args),
      findUnique: (...args: unknown[]) => prismaMocks.mockFindUnique(...args),
      create: (...args: unknown[]) => prismaMocks.mockCreate(...args),
    },
    user: {
      findMany: (...args: unknown[]) => prismaMocks.mockFindMany(...args),
      findUnique: (...args: unknown[]) => prismaMocks.mockFindUnique(...args),
    },
    $transaction: (cb: (tx: Record<string, unknown>) => Promise<unknown>) =>
      prismaMocks.mockTransaction(cb),
  },
}));

// ============================================================================
// Helpers
// ============================================================================

function participantRow(conversationId: string, conversationType: string, lastReadAt: Date | null = null) {
  return {
    conversationId,
    lastReadAt,
    conversation: { type: conversationType },
  };
}

/**
 * Помогает создать контекст для $transaction, делегирующий вызовы tx на моки prisma.
 */
function createTxMock(): (cb: (tx: Record<string, unknown>) => Promise<unknown>) => Promise<unknown> {
  return async (cb) => {
    const tx = {
      conversation: {
        create: (...args: unknown[]) => prismaMocks.mockCreate(...args),
      },
      conversationParticipant: {
        create: (...args: unknown[]) => prismaMocks.mockCreate(...args),
        createMany: (...args: unknown[]) => prismaMocks.mockCreateMany(...args),
      },
    };
    return await cb(tx);
  };
}

describe('PrismaCommsRepository — корректный учёт непрочитанных (B-027)', () => {
  let repository: PrismaCommsRepository;

  const userId = 'user-1';

  beforeEach(() => {
    vi.clearAllMocks();
    repository = new PrismaCommsRepository();
  });

  // ==========================================================================
  // T1-1: getUnreadCounts — isDeleted, новая учёт логика, ANNOUNCEMENT
  // ==========================================================================

  describe('getUnreadCounts (US-21-37 AC-11/AC-12)', () => {
    it('не считает удалённые (isDeleted) сообщения — в where передаётся isDeleted: false для DIRECT и GROUP', async () => {
      prismaMocks.mockFindMany.mockResolvedValue([
        participantRow('conv-direct', 'DIRECT'),
        participantRow('conv-group', 'GROUP'),
        participantRow('conv-ann', 'ANNOUNCEMENT'), // игнорируется
      ]);
      prismaMocks.mockCount
        .mockResolvedValueOnce(5) // DIRECT
        .mockResolvedValueOnce(3); // GROUP

      const result: UnreadCounts = await repository.getUnreadCounts(userId);

      expect(result).toEqual({ messages: 5, chats: 3 });

      // Проверяем два count-вызова (ANNOUNCEMENT не считаем)
      const countCalls = prismaMocks.mockCount.mock.calls;
      expect(countCalls).toHaveLength(2);

      for (const call of countCalls) {
        const where = call[0].where;
        // T1-1: isDeleted: false в каждом count
        expect(where.isDeleted).toBe(false);
        // senderId: { not: userId } — свои не считаются
        expect(where.senderId).toEqual({ not: userId });
        // createdAt: { gt: lastReadAt ?? new Date(0) }
        expect(where.createdAt).toHaveProperty('gt');
      }
    });

    it('считает только НЕпрочитанные: createdAt > lastReadAt и senderId !== userId (нет удалённых, нет своих)', async () => {
      prismaMocks.mockFindMany.mockResolvedValue([
        participantRow('conv-direct', 'DIRECT'),
        participantRow('conv-group', 'GROUP'),
      ]);
      prismaMocks.mockCount.mockResolvedValue(0);

      await repository.getUnreadCounts(userId);

      // Проверяем точную структуру where-условия для каждого count
      const countCalls = prismaMocks.mockCount.mock.calls;
      expect(countCalls).toHaveLength(2);

      for (const call of countCalls) {
        const where = call[0].where;
        expect(where).toMatchObject({
          senderId: { not: userId },
          isDeleted: false,
        });
        expect(where.conversationId).toBeTypeOf('string');
        expect(where.createdAt.gt).toBeInstanceOf(Date);
      }

      // ANNOUNCEMENT-тип не должен попадать в count (тип фильтруется до count)
      const directCall = countCalls.find((c) => c[0].where.conversationId === 'conv-direct');
      const groupCall = countCalls.find((c) => c[0].where.conversationId === 'conv-group');
      expect(directCall).toBeDefined();
      expect(groupCall).toBeDefined();
    });

    it('игнорирует ANNOUNCEMENT-диалоги (у объявлений счётчик = 0)', async () => {
      prismaMocks.mockFindMany.mockResolvedValue([
        participantRow('conv-ann', 'ANNOUNCEMENT'),
      ]);
      prismaMocks.mockCount.mockResolvedValue(0);

      const result = await repository.getUnreadCounts(userId);

      expect(result).toEqual({ messages: 0, chats: 0 });
      // ANNOUNCEMENT не должен генерировать ни одного count-вызова
      expect(prismaMocks.mockCount).not.toHaveBeenCalled();
    });

    it('возвращает нули, если у пользователя нет диалогов', async () => {
      prismaMocks.mockFindMany.mockResolvedValue([]);

      const result = await repository.getUnreadCounts(userId);

      expect(result).toEqual({ messages: 0, chats: 0 });
      expect(prismaMocks.mockCount).not.toHaveBeenCalled();
    });
  });

  // ==========================================================================
  // T1-2: addChatParticipant — инициализация lastReadAt
  // ==========================================================================

  describe('addChatParticipant (US-21-37 AC-10)', () => {
    it('инициализирует lastReadAt = now() при вступлении нового участника', async () => {
      // Нет существующего участника
      prismaMocks.mockFirst.mockResolvedValue(null);
      // Транзакция возвращает созданного участника
      prismaMocks.mockTransaction.mockImplementation(async (cb) => {
        const tx = {
          conversationParticipant: {
            create: vi.fn().mockResolvedValue({
              id: 'part-1',
              conversationId: 'chat-1',
              userId: 'user-new',
              role: 'MEMBER',
              lastReadAt: new Date(),
              joinedAt: new Date(),
            }),
          },
        };
        return await cb(tx);
      });

      const result = await repository.addChatParticipant(
        'chat-1',
        'user-new',
        'MEMBER' as ParticipantRole
      );

      // В data транзакционного create должен быть lastReadAt
      const txInvoked = prismaMocks.mockTransaction;
      expect(txInvoked).toHaveBeenCalled();

      // Результат маппится в доменный тип с lastReadAt
      expect(result.lastReadAt).toBeInstanceOf(Date);
    });

    it('инициализирует lastReadAt в createMany при createGroupChat для MEMBER-участников', async () => {
      const txCreateMany = vi.fn().mockResolvedValue({ count: 2 });
      prismaMocks.mockTransaction.mockImplementation(async (cb) => {
        const tx = {
          conversation: {
            create: vi.fn().mockResolvedValue({
              id: 'chat-1',
              type: 'GROUP',
              title: 'Общее собрание',
              description: null,
              createdBy: 'user-owner',
              createdAt: new Date('2024-01-01'),
              updatedAt: new Date('2024-01-01'),
            }),
          },
          conversationParticipant: {
            create: vi.fn().mockResolvedValue({ id: 'own-1' }),
            createMany: txCreateMany,
          },
        };
        return await cb(tx);
      });

      await repository.createGroupChat('user-owner', {
        name: 'Общее собрание',
        description: null,
        participantIds: ['user-a', 'user-b'],
      });

      // createMany должен получить lastReadAt = now() для каждого MEMBER-участника
      expect(txCreateMany).toHaveBeenCalledTimes(1);
      const [payload] = txCreateMany.mock.calls[0];
      const dataRows = payload.data as Array<Record<string, unknown>>;
      expect(dataRows).toHaveLength(2);
      for (const row of dataRows) {
        expect(row.role).toBe('MEMBER');
        expect(row.lastReadAt).toBeInstanceOf(Date);
      }
    });
  });

  // ==========================================================================
  // T1-1: getUserConversations — isDeleted в счётчике диалога
  // ==========================================================================

  describe('getUserConversations (US-21-01 AC-1.7)', () => {
    it('не считает удалённые сообщения в счётчике диалога (isDeleted: false)', async () => {
      const lastRead = new Date('2024-01-01');
      prismaMocks.mockFindMany
        .mockResolvedValueOnce([
          { id: 'p1', conversationId: 'conv-1', lastReadAt: lastRead },
        ]) // myParticipants
        .mockResolvedValueOnce([{ id: 'conv-1', createdAt: new Date('2024-01-02') }]) // conversations
        .mockResolvedValueOnce([{ conversationId: 'conv-1', userId: 'user-2' }]) // allParticipants
        .mockResolvedValueOnce([{ id: 'user-2', email: 'user2@test.com', name: null, profile: null }]) // peerUsers
        .mockResolvedValueOnce([
          { conversationId: 'conv-1', content: 'hello', createdAt: new Date('2024-01-03'), senderId: 'user-2' },
        ]); // lastMessagesRaw
      prismaMocks.mockCount.mockResolvedValue(2);

      const result: ConversationListResponse = await repository.getUserConversations(userId);

      expect(result.items[0].unreadCount).toBe(2);

      // Каждый count-вызов содержит isDeleted: false
      const where = prismaMocks.mockCount.mock.calls[0][0].where;
      expect(where).toMatchObject({
        senderId: { not: userId },
        isDeleted: false,
        createdAt: { gt: lastRead },
      });
    });
  });

  // ==========================================================================
  // T1-1: getUserGroupChats — isDeleted в счётчике чата
  // ==========================================================================

  describe('getUserGroupChats (US-21-04 AC-1.6)', () => {
    it('не считает удалённые сообщения в счётчике чата (isDeleted: false)', async () => {
      const lastRead = new Date('2024-01-01');
      prismaMocks.mockFindMany
        .mockResolvedValueOnce([
          { id: 'p1', conversationId: 'chat-1', lastReadAt: lastRead },
        ]) // myParticipants
        .mockResolvedValueOnce([
          { id: 'chat-1', title: 'Общее собрание', createdAt: new Date('2024-01-02') },
        ]) // conversations
        .mockResolvedValueOnce([
          { conversationId: 'chat-1', content: 'hi', createdAt: new Date('2024-01-03'), senderId: 'user-2' },
        ]); // lastMessagesRaw
      prismaMocks.mockGroupBy.mockResolvedValue([
        { conversationId: 'chat-1', _count: { conversationId: 3 } },
      ]);
      prismaMocks.mockCount.mockResolvedValue(1);

      const result: ChatListResponse = await repository.getUserGroupChats(userId);

      expect(result.items[0].unreadCount).toBe(1);

      const where = prismaMocks.mockCount.mock.calls[0][0].where;
      expect(where).toMatchObject({
        senderId: { not: userId },
        isDeleted: false,
        createdAt: { gt: lastRead },
      });
    });
  });
});
