/**
 * @file tests/unit/domains/comms/comms.repository.b031.test.ts
 * @domain comms
 * @description Unit-тесты для null-фильтрации в getUserConversations (B-031 T4-1)
 *
 * @covers REQ-COMMS-004 B-031 (защита non-null assertion → TypeError → HTTP 500)
 * @covers B031-T2-1 (паттерн return null + type-guard filter)
 *
 * @spec
 * - Изолированные unit-тесты с мок-PRISMA клиентом (без БД)
 * - Получение диалогов с отсутствующим participant не бросает исключение
 * - Проблемный диалог исключается из результата (null-элемент фильтруется)
 * - Итоговый массив не содержит null-элементов
 *
 * @task B031-T4-1
 * @see docs/plans/REQ-COMMS-004-B031-plan.md → T2-1, T4-1
 * @see docs/specs/comms/B-031-component-spec.md (раздел 3.3.2)
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PrismaCommsRepository } from '@/domains/comms/comms.repository.prisma';

/**
 * B031: Моки с уникальными именами (суффикс b031), чтобы исключить любой
 * конфликт с именами моков других тестов (например, b029).
 */
const b031Mocks = vi.hoisted(() => ({
  mockFindMany: vi.fn(),
  mockFindFirst: vi.fn(),
  mockCreate: vi.fn(),
  mockCreateMany: vi.fn(),
  mockTransaction: vi.fn(),
  mockCount: vi.fn(),
}));

vi.mock('@/infrastructure/prisma/client', () => ({
  prisma: {
    conversationParticipant: {
      findMany: (...args: unknown[]) => b031Mocks.mockFindMany(...args),
      findFirst: (...args: unknown[]) => b031Mocks.mockFindFirst(...args),
      createMany: (...args: unknown[]) => b031Mocks.mockCreateMany(...args),
    },
    conversation: {
      findMany: (...args: unknown[]) => b031Mocks.mockFindMany(...args),
      findFirst: (...args: unknown[]) => b031Mocks.mockFindFirst(...args),
      create: (...args: unknown[]) => b031Mocks.mockCreate(...args),
    },
    user: {
      findMany: (...args: unknown[]) => b031Mocks.mockFindMany(...args),
    },
    message: {
      findMany: (...args: unknown[]) => b031Mocks.mockFindMany(...args),
      count: (...args: unknown[]) => b031Mocks.mockCount(...args),
    },
    $transaction: (cb: (tx: Record<string, unknown>) => Promise<unknown>) =>
      b031Mocks.mockTransaction(cb),
  },
}));

describe('PrismaCommsRepository (B-031 T4-1: null-фильтрация в getUserConversations)', () => {
  let repository: PrismaCommsRepository;
  const userId = 'user-a';

  /**
   * Настраивает моки так, чтобы `conversation.findMany` (шаг 2) вернул диалог
   * conv-3, у которого НЕТ соответствующего участника в participantMap.
   *
   * participantMap строится из myParticipants (шаг 1), отфильтрованных по
   * directConversationIds (шаг 2). Чтобы участник реально отсутствовал в Map,
   * шаг 2 (conversations) должен вернуть БОЛЬШЕ диалогов, чем шаг 1
   * (myParticipants) — тем самым моделируем рассинхронизацию данных.
   * Диалоги conv-1 и conv-2 имеют корректных участников, conv-3 — нет.
   */
  function seedConversationsWithMissingParticipant(): void {
    // Шаг 1: myParticipants → в participantMap попадут ТОЛЬКО conv-1 и conv-2
    b031Mocks.mockFindMany.mockResolvedValueOnce([
      { conversationId: 'conv-1', userId },
      { conversationId: 'conv-2', userId },
    ]);

    // Шаг 2: conversations (DIRECT) → возвращаем conv-3 ДОПОЛНИТЕЛЬНО.
    // directConversationIds = [conv-1, conv-2, conv-3], но в participantMap
    // лежат только conv-1/conv-2 → для conv-3 participant отсутствует.
    b031Mocks.mockFindMany.mockResolvedValueOnce([
      { id: 'conv-1', createdAt: new Date('2024-01-01T00:00:00.000Z') },
      { id: 'conv-2', createdAt: new Date('2024-01-02T00:00:00.000Z') },
      { id: 'conv-3', createdAt: new Date('2024-01-03T00:00:00.000Z') },
    ]);

    // Шаг 3: все участники DIRECT диалогов (peers) — у conv-3 нет peer-записи
    b031Mocks.mockFindMany.mockResolvedValueOnce([
      { conversationId: 'conv-1', userId: 'peer-1' },
      { conversationId: 'conv-2', userId: 'peer-2' },
    ]);

    // Шаг 5: профили собеседников
    b031Mocks.mockFindMany.mockResolvedValueOnce([
      { id: 'peer-1', email: 'one@example.com', name: 'Первый', profile: { first_name: null, last_name: null, avatar: null } },
      { id: 'peer-2', email: 'two@example.com', name: 'Второй', profile: { first_name: null, last_name: null, avatar: null } },
    ]);

    // Шаг 6: последние сообщения — пусто (lastMessageMap не заполняется)
    b031Mocks.mockFindMany.mockResolvedValueOnce([]);

    // Шаг 7: message.count для unreadCount каждого оставшегося диалога
    // (conv-1 и conv-2 — по одному вызову count каждый)
    b031Mocks.mockCount.mockResolvedValue(0);
  }

  beforeEach(() => {
    vi.clearAllMocks();
    repository = new PrismaCommsRepository();
  });

  it('пропускает диалог с отсутствующим участником и возвращает результат без null (B-031 T4-1)', async () => {
    // Спай console.warn, чтобы проверить лог о пропущенном участнике
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    seedConversationsWithMissingParticipant();

    // Act: метод должен обработать ситуацию без TypeError
    const response = await repository.getUserConversations(userId);

    // Assert: проблемный диалог исключён (null-элемент отфильтрован)
    expect(response.items).toHaveLength(2);
    expect(response.total).toBe(2);

    // Assert: в результате нет диалога conv-3 (он отфильтрован как null)
    const ids = response.items.map((item) => item.conversationId);
    expect(ids).not.toContain('conv-3');
    expect(ids).toEqual(expect.arrayContaining(['conv-1', 'conv-2']));

    // Assert: ни один элемент не является null/undefined
    for (const item of response.items) {
      expect(item).not.toBeNull();
      expect(item).not.toBeUndefined();
    }

    // Assert: предупреждение о пропущенном участнике залогировано
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('conv-3')
    );
    warnSpy.mockRestore();
  });

  it('НЕ бросает исключение (регрессионная защита B031-T2-1)', async () => {
    seedConversationsWithMissingParticipant();

    // Act: метод не должен бросать TypeError → HTTP 500
    let error: unknown = null;
    let response: Awaited<ReturnType<PrismaCommsRepository['getUserConversations']>> | undefined;
    try {
      response = await repository.getUserConversations(userId);
    } catch (e) {
      error = e;
    }

    // Assert: исключение не возникло
    expect(error).toBeNull();
    // Assert: результат корректен (без проблемного диалога)
    expect(response).toBeDefined();
    expect(response!.items.length).toBe(2);
    expect(response!.items.map((i) => i.conversationId)).not.toContain('conv-3');
  });
});
