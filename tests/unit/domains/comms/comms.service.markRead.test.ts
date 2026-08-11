/**
 * @file comms.service.markRead.test.ts
 * @domain comms
 * @description Unit-тесты для CommsService.markConversationAsRead и getMessagesWithReadStatus (B-026)
 *
 * @spec
 * - markConversationAsRead: валидация conversationId через markAsReadSchema (UUID)
 * - markConversationAsRead: делегирует в repository.markAsRead(conversationId, userId)
 * - markConversationAsRead: прокидывает ParticipantNotFoundError из repository (не-участник)
 * - markConversationAsRead: идемпотентность — повторный вызов не ошибается (AC-4)
 * - getMessagesWithReadStatus: корректно возвращает сообщения с read status из repository
 *
 * @traces US-39-01 AC-1, AC-2, AC-4
 * @traces US-39-02 AC-1, AC-2, AC-3, AC-6
 * @task B-026-T7-1
 */
import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { CommsService } from '@/domains/comms/comms.service';
import type { ICommsRepository } from '@/domains/comms/comms.repository.interface';
import type { MessageWithReadStatus } from '@/domains/comms/comms.types';
import { ParticipantNotFoundError } from '@/domains/comms/comms.errors';

// Валидные UUID для markAsReadSchema
const VALID_CONVERSATION_ID = '11111111-1111-4111-8111-111111111111';
const VALID_CONVERSATION_ID_2 = '22222222-2222-4222-8222-222222222222';
const USER_ID = 'user-1';
const OTHER_USER_ID = 'user-2';

/**
 * Создаёт мок репозитория ICommsRepository с реализацией markAsRead/getMessagesWithReadStatus
 */
function createMockRepository(
  overrides: Partial<ICommsRepository> = {}
): ICommsRepository {
  return {
    markAsRead: vi.fn().mockResolvedValue(undefined),
    getMessagesWithReadStatus: vi.fn().mockResolvedValue([]),
    ...overrides,
  } as unknown as ICommsRepository;
}

function createMessageWithReadStatus(
  overrides?: Partial<MessageWithReadStatus>
): MessageWithReadStatus {
  return {
    id: 'msg-1',
    conversationId: VALID_CONVERSATION_ID,
    senderId: OTHER_USER_ID,
    senderName: 'Иван Петров',
    senderEmail: 'ivan@example.com',
    senderAvatarUrl: null,
    content: 'Привет!',
    replyToId: null,
    isDeleted: false,
    deletedBy: null,
    deletedAt: null,
    createdAt: new Date('2024-01-15T10:00:00.000Z'),
    updatedAt: new Date('2024-01-15T10:00:00.000Z'),
    isReadByRecipient: false,
    readByCount: undefined,
    totalParticipants: undefined,
    ...overrides,
  };
}

describe('CommsService.markConversationAsRead (US-39-01)', () => {
  let repository: ICommsRepository;
  let service: CommsService;

  beforeEach(() => {
    repository = createMockRepository();
    service = new CommsService(repository);
  });

  // AC-1 / AC-2: делегирует в repository.markAsRead
  it('должен делегировать в repository.markAsRead с корректными аргументами (AC-1/AC-2)', async () => {
    await service.markConversationAsRead(VALID_CONVERSATION_ID, USER_ID);

    expect(repository.markAsRead).toHaveBeenCalledTimes(1);
    expect(repository.markAsRead).toHaveBeenCalledWith(VALID_CONVERSATION_ID, USER_ID);
  });

  // AC-4: идемпотентность
  it('должен быть идемпотентным при повторном вызове (AC-4)', async () => {
    await service.markConversationAsRead(VALID_CONVERSATION_ID, USER_ID);
    await service.markConversationAsRead(VALID_CONVERSATION_ID, USER_ID);

    expect(repository.markAsRead).toHaveBeenCalledTimes(2);
  });

  // ParticipantNotFoundError пробрасывается из repository (не-участник)
  it('должен пробросить ParticipantNotFoundError, если пользователь не участник', async () => {
    (repository.markAsRead as Mock).mockRejectedValue(
      new ParticipantNotFoundError(VALID_CONVERSATION_ID, USER_ID)
    );

    await expect(
      service.markConversationAsRead(VALID_CONVERSATION_ID, USER_ID)
    ).rejects.toThrow(ParticipantNotFoundError);
  });

  // Валидация: не-UUID conversationId → ошибка (ZodError)
  it('должен выбрасывать ошибку валидации при некорректном conversationId', async () => {
    await expect(
      service.markConversationAsRead('not-a-uuid', USER_ID)
    ).rejects.toThrow();

    // repository не должен вызываться при невалидном ID
    expect(repository.markAsRead).not.toHaveBeenCalled();
  });

  it('должен корректно обрабатывать валидный conversationId (не бросает ошибку)', async () => {
    await expect(
      service.markConversationAsRead(VALID_CONVERSATION_ID, USER_ID)
    ).resolves.toBeUndefined();
  });
});

describe('CommsService.getMessagesWithReadStatus (US-39-02)', () => {
  let repository: ICommsRepository;
  let service: CommsService;

  beforeEach(() => {
    repository = createMockRepository();
    service = new CommsService(repository);
  });

  it('должен делегировать в repository.getMessagesWithReadStatus', async () => {
    await service.getMessagesWithReadStatus(VALID_CONVERSATION_ID, USER_ID);

    expect(repository.getMessagesWithReadStatus).toHaveBeenCalledTimes(1);
    expect(repository.getMessagesWithReadStatus).toHaveBeenCalledWith(
      VALID_CONVERSATION_ID,
      USER_ID
    );
  });

  // AC-1 US-39-02: DIRECT — isReadByRecipient=false
  it('должен возвращать isReadByRecipient=false для непрочитанного сообщения (AC-1)', async () => {
    (repository.getMessagesWithReadStatus as Mock).mockResolvedValue([
      createMessageWithReadStatus({ isReadByRecipient: false }),
    ]);

    const messages = await service.getMessagesWithReadStatus(VALID_CONVERSATION_ID, USER_ID);

    expect(messages).toHaveLength(1);
    expect(messages[0].isReadByRecipient).toBe(false);
    // Для DIRECT readByCount/totalParticipants не определены
    expect(messages[0].readByCount).toBeUndefined();
    expect(messages[0].totalParticipants).toBeUndefined();
  });

  // AC-2 US-39-02: DIRECT — isReadByRecipient=true
  it('должен возвращать isReadByRecipient=true для прочитанного сообщения (AC-2)', async () => {
    (repository.getMessagesWithReadStatus as Mock).mockResolvedValue([
      createMessageWithReadStatus({ isReadByRecipient: true }),
    ]);

    const messages = await service.getMessagesWithReadStatus(VALID_CONVERSATION_ID, USER_ID);

    expect(messages[0].isReadByRecipient).toBe(true);
  });

  // AC-3 / AC-6 US-39-02: GROUP — readByCount/totalParticipants
  it('должен возвращать readByCount/totalParticipants для GROUP (AC-3, AC-6)', async () => {
    (repository.getMessagesWithReadStatus as Mock).mockResolvedValue([
      createMessageWithReadStatus({
        isReadByRecipient: true,
        readByCount: 3,
        totalParticipants: 4,
      }),
      createMessageWithReadStatus({
        isReadByRecipient: false,
        readByCount: 0,
        totalParticipants: 4,
      }),
    ]);

    const messages = await service.getMessagesWithReadStatus(VALID_CONVERSATION_ID, USER_ID);

    expect(messages[0].readByCount).toBe(3);
    expect(messages[0].totalParticipants).toBe(4);
    // AC-6: нулевой счётчик
    expect(messages[1].readByCount).toBe(0);
    expect(messages[1].totalParticipants).toBe(4);
  });

  it('должен возвращать пустой массив, если сообщений нет', async () => {
    const messages = await service.getMessagesWithReadStatus(VALID_CONVERSATION_ID, USER_ID);
    expect(messages).toEqual([]);
  });

  it('должен выбрасывать ошибку валидации при некорректном conversationId', async () => {
    await expect(
      service.getMessagesWithReadStatus('bad-id', USER_ID)
    ).rejects.toThrow();

    expect(repository.getMessagesWithReadStatus).not.toHaveBeenCalled();
  });
});
