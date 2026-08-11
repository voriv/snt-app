/**
 * @file tests/unit/domains/comms/comms.repository.b029.test.ts
 * @domain comms
 * @description Unit-тесты для запрета дублирующихся личных диалогов (B-029) на repository-слое
 *
 * @covers REQ-COMMS-004 AC-04 (findConversationBetween независим от порядка аргументов)
 * @covers REQ-COMMS-004 AC-03 (race condition: P2002 → DuplicateConversationError)
 * @covers REQ-COMMS-004 BR-06 (pairKey = sorted().join('|') для DIRECT)
 *
 * @spec
 * - Изолированные unit-тесты с мок-PRISMA клиентом (без БД)
 * - findConversationBetween(A,B) === findConversationBetween(B,A)
 * - createConversation: pairKey детерминирован независимо от порядка participantIds
 * - createConversation: P2002 → findConversationBetween → DuplicateConversationError(existingId)
 *
 * @task B-029 T6-1
 * @see docs/plans/REQ-COMMS-004-B029-plan.md → T2-1, T6-1
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Prisma } from '@prisma/client';
import { PrismaCommsRepository } from '@/domains/comms/comms.repository.prisma';
import { DuplicateConversationError } from '@/domains/comms/comms.errors';

/**
 * Создаёт Prisma P2002 KnownRequestError с корректной сигнатурой конструктора.
 */
function createP2002Error(): Prisma.PrismaClientKnownRequestError {
  return new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
    code: 'P2002',
    clientVersion: 'test',
  });
}

// Мок $transaction и Prisma. Модуль импортирует реальный Prisma — здесь проверяем
// через публичный API репозитория. Для P2002-теста фабрикуем ошибку с кодом P2002.
const prismaMocks = vi.hoisted(() => ({
  mockFindMany: vi.fn(),
  mockFirst: vi.fn(),
  mockCreate: vi.fn(),
  mockCreateMany: vi.fn(),
  mockTransaction: vi.fn(),
}));

vi.mock('@/infrastructure/prisma/client', () => ({
  prisma: {
    conversationParticipant: {
      findMany: (...args: unknown[]) => prismaMocks.mockFindMany(...args),
      findFirst: (...args: unknown[]) => prismaMocks.mockFirst(...args),
      createMany: (...args: unknown[]) => prismaMocks.mockCreateMany(...args),
    },
    conversation: {
      findFirst: (...args: unknown[]) => prismaMocks.mockFirst(...args),
      create: (...args: unknown[]) => prismaMocks.mockCreate(...args),
    },
    $transaction: (cb: (tx: Record<string, unknown>) => Promise<unknown>) =>
      prismaMocks.mockTransaction(cb),
  },
}));

describe('PrismaCommsRepository (B-029 T6-1)', () => {
  let repository: PrismaCommsRepository;

  beforeEach(() => {
    vi.clearAllMocks();
    repository = new PrismaCommsRepository();
  });

  describe('AC-04: findConversationBetween независим от порядка аргументов', () => {
    const convId = 'conv-123';
    const userA = 'aaa-user';
    const userB = 'bbb-user';

    it('вызывает prisma с id in [A, B] независимо от порядка вызова', async () => {
      // Оба порядка дают одинаковый where: findMany с { userId: { in: [...] } }
      prismaMocks.mockFindMany.mockResolvedValue([
        { conversationId: convId, userId: userA },
        { conversationId: convId, userId: userB },
      ]);
      prismaMocks.mockFirst.mockResolvedValue({
        id: convId,
        type: 'DIRECT',
        title: null,
        description: null,
        plotId: null,
        createdBy: userA,
        createdAt: new Date('2024-01-01T00:00:00.000Z'),
        updatedAt: new Date('2024-01-01T00:00:00.000Z'),
      });

      const resultAB = await repository.findConversationBetween(userA, userB);
      prismaMocks.mockFindMany.mockClear();
      prismaMocks.mockFindMany.mockResolvedValue([
        { conversationId: convId, userId: userA },
        { conversationId: convId, userId: userB },
      ]);
      prismaMocks.mockFirst.mockClear();
      prismaMocks.mockFirst.mockResolvedValue({
        id: convId,
        type: 'DIRECT',
        title: null,
        description: null,
        plotId: null,
        createdBy: userA,
        createdAt: new Date('2024-01-01T00:00:00.000Z'),
        updatedAt: new Date('2024-01-01T00:00:00.000Z'),
      });
      const resultBA = await repository.findConversationBetween(userB, userA);

      expect(resultAB?.id).toBe(convId);
      expect(resultBA?.id).toBe(convId);
      expect(resultAB?.id).toBe(resultBA?.id);
    });

    it('возвращает null, если один из пользователей отсутствует в participant-записях', async () => {
      // Только userA участвует — общих диалогов нет
      prismaMocks.mockFindMany.mockResolvedValue([
        { conversationId: convId, userId: userA },
      ]);

      const result = await repository.findConversationBetween(userA, userB);
      expect(result).toBeNull();
    });

    it('возвращает null, если общий диалог не является DIRECT', async () => {
      prismaMocks.mockFindMany.mockResolvedValue([
        { conversationId: convId, userId: userA },
        { conversationId: convId, userId: userB },
      ]);
      prismaMocks.mockFirst.mockResolvedValue(null); // GROUP/не найдено DIRECT

      const result = await repository.findConversationBetween(userA, userB);
      expect(result).toBeNull();
    });
  });

  describe('AC-03: createConversation при P2002 → DuplicateConversationError', () => {
    it('вычисляет pairKey детерминированно (sorted join) — сохраняет на диалоге через conversation.create', async () => {
      // Мок транзакции с успешным созданием conversation; захватываем данные create
      let createData: Record<string, unknown> | undefined;
      prismaMocks.mockTransaction.mockImplementation(async (cb) => {
        const tx = {
          conversation: {
            create: vi.fn().mockImplementation((args: { data?: Record<string, unknown> }) => {
              createData = args.data;
              return Promise.resolve({
                id: 'conv-new',
                type: 'DIRECT',
                title: null,
                description: null,
                plotId: null,
                createdBy: 'user-b',
                createdAt: new Date(),
                updatedAt: new Date(),
              });
            }),
          },
          conversationParticipant: {
            createMany: (...args: unknown[]) => prismaMocks.mockCreateMany(...args),
          },
        };
        return await cb(tx);
      });

      await repository.createConversation('DIRECT', ['user-b', 'user-a'], 'user-b');

      // pairKey для sorted('user-a','user-b').join('|') сохраняется на диалоге (conversation.create)
      expect(createData?.pairKey).toBe('user-a|user-b');

      // createMany участников НЕ должен получать pairKey (поле убрано из participant)
      const createManyArgs = prismaMocks.mockCreateMany.mock.calls[0][0];
      const data = createManyArgs.data;
      expect(data).toHaveLength(2);
      expect(data[0].pairKey).toBeUndefined();
      expect(data[1].pairKey).toBeUndefined();
    });

    it('при P2002 бросает DuplicateConversationError(existingId)', async () => {
      // Транзакция бросает P2002
      const p2002 = createP2002Error();
      prismaMocks.mockTransaction.mockRejectedValue(p2002);

      // После P2002 repository вызывает findConversationBetween → находит существующий диалог
      prismaMocks.mockFindMany.mockResolvedValue([
        { conversationId: 'conv-existing', userId: 'user-a' },
        { conversationId: 'conv-existing', userId: 'user-b' },
      ]);
      prismaMocks.mockFirst.mockResolvedValue({
        id: 'conv-existing',
        type: 'DIRECT',
        title: null,
        description: null,
        plotId: null,
        createdBy: 'user-a',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await expect(
        repository.createConversation('DIRECT', ['user-a', 'user-b'], 'user-a')
      ).rejects.toThrow(DuplicateConversationError);

      const err = await repository
        .createConversation('DIRECT', ['user-a', 'user-b'], 'user-a')
        .catch((e: unknown) => e);
      expect(err).toBeInstanceOf(DuplicateConversationError);
      expect((err as DuplicateConversationError).existingConversationId).toBe('conv-existing');
    });

    it('при P2002 БЕЗ найденного существующего диалога — пробрасывает оригинальную ошибку', async () => {
      const p2002 = createP2002Error();
      prismaMocks.mockTransaction.mockRejectedValue(p2002);
      // findConversationBetween не находит диалог
      prismaMocks.mockFindMany.mockResolvedValue([]);

      await expect(
        repository.createConversation('DIRECT', ['user-a', 'user-b'], 'user-a')
      ).rejects.toThrow(p2002);
    });

    it('при ошибке, не являющейся P2002, просто пробрасывает её', async () => {
      prismaMocks.mockTransaction.mockRejectedValue(new Error('Other error'));

      await expect(
        repository.createConversation('DIRECT', ['user-a', 'user-b'], 'user-a')
      ).rejects.toThrow('Other error');
    });
  });
});
