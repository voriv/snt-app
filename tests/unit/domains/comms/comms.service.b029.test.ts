/**
 * @file tests/unit/domains/comms/comms.service.b029.test.ts
 * @domain comms
 * @description Unit-тесты для запрета дублирующихся личных диалогов (B-029) на service-слое
 *
 * @covers REQ-COMMS-004 AC-01 (создание нового диалога)
 * @covers REQ-COMMS-004 AC-02 (существующий диалог → ConversationAlreadyExistsError)
 * @covers REQ-COMMS-004 AC-03 (race condition: DuplicateConversationError → ConversationAlreadyExistsError)
 * @covers REQ-COMMS-004 EC-01 (self-dialog → CannotMessageSelfError)
 *
 * @spec
 * - Изолированные unit-тесты с мок-репозиторием (без БД)
 * - Проверяет что startConversation бросает ConversationAlreadyExistsError(existing.id)
 * - Проверяет цепочку race condition: DuplicateConversationError → ConversationAlreadyExistsError
 *
 * @task B-029 T6-1
 * @see docs/plans/REQ-COMMS-004-B029-plan.md → T3-1, T6-1
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CommsService } from '@/domains/comms/comms.service';
import type { ICommsRepository } from '@/domains/comms/comms.repository.interface';
import type { Conversation, CreateConversationResult } from '@/domains/comms/comms.types';
import {
  ConversationAlreadyExistsError,
  CannotMessageSelfError,
  DuplicateConversationError,
} from '@/domains/comms/comms.errors';

function createMockRepository(overrides: Partial<ICommsRepository> = {}): ICommsRepository {
  return {
    getUserConversations: vi.fn(),
    getUserGroupChats: vi.fn(),
    findById: vi.fn(),
    isParticipant: vi.fn(),
    userExists: vi.fn().mockResolvedValue(true),
    findConversationBetween: vi.fn(),
    createConversation: vi.fn(),
    getConversationMessages: vi.fn(),
    createMessage: vi.fn(),
    findMessageById: vi.fn(),
    getMessageSender: vi.fn(),
    softDeleteMessage: vi.fn(),
    createGroupChat: vi.fn(),
    groupChatExistsByName: vi.fn(),
    updateChat: vi.fn(),
    getChatParticipants: vi.fn(),
    getChatParticipant: vi.fn(),
    addChatParticipant: vi.fn(),
    getBlockedUserIds: vi.fn(),
    updateParticipantRole: vi.fn().mockResolvedValue(null),
    removeChatParticipant: vi.fn().mockResolvedValue(undefined),
    getChatParticipantWithDetails: vi.fn().mockResolvedValue(null),
    getUnreadCounts: vi.fn(),
    ...overrides,
  } as ICommsRepository;
}

function createTestConversation(overrides?: Partial<Conversation>): Conversation {
  const now = new Date('2024-01-01T00:00:00.000Z');
  return {
    id: 'conv-123',
    type: 'DIRECT',
    title: null,
    description: null,
    plotId: null,
    createdBy: 'user-1',
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

describe('CommsService.startConversation (B-029 T6-1)', () => {
  let service: CommsService;
  let mockRepo: ICommsRepository;

  beforeEach(() => {
    vi.clearAllMocks();
    mockRepo = createMockRepository();
    service = new CommsService(mockRepo);
  });

  describe('AC-01: создание нового диалога', () => {
    it('создаёт новый диалог и возвращает { conversationId, isNew: true }', async () => {
      const newConversation: Conversation = createTestConversation({ id: 'conv-new' });
      vi.mocked(mockRepo.findConversationBetween).mockResolvedValue(null);
      vi.mocked(mockRepo.createConversation).mockResolvedValue(newConversation);

      const result = await service.startConversation('user-1', { participantId: 'user-2' });

      expect(result).toEqual<CreateConversationResult>({
        conversationId: 'conv-new',
        isNew: true,
      });
      expect(mockRepo.findConversationBetween).toHaveBeenCalledWith('user-1', 'user-2');
      expect(mockRepo.createConversation).toHaveBeenCalledWith(
        'DIRECT',
        ['user-1', 'user-2'],
        'user-1'
      );
    });
  });

  describe('AC-02: существующий диалог', () => {
    it('бросает ConversationAlreadyExistsError(existing.id), если диалог уже существует', async () => {
      const existing = createTestConversation({ id: 'conv-existing' });
      vi.mocked(mockRepo.findConversationBetween).mockResolvedValue(existing);

      await expect(
        service.startConversation('user-1', { participantId: 'user-2' })
      ).rejects.toThrow(ConversationAlreadyExistsError);

      expect(mockRepo.createConversation).not.toHaveBeenCalled();
    });

    it('сохраняет conversationId в брошенной ошибке (AC-02: 409 с conversationId)', async () => {
      const existing = createTestConversation({ id: 'conv-existing' });
      vi.mocked(mockRepo.findConversationBetween).mockResolvedValue(existing);

      try {
        await service.startConversation('user-1', { participantId: 'user-2' });
        expect.unreachable('expected error');
      } catch (err) {
        expect(err).toBeInstanceOf(ConversationAlreadyExistsError);
        expect((err as ConversationAlreadyExistsError).conversationId).toBe('conv-existing');
      }
    });
  });

  describe('AC-03: race condition (DuplicateConversationError)', () => {
    it('преобразует DuplicateConversationError в ConversationAlreadyExistsError(existingConversationId)', async () => {
      vi.mocked(mockRepo.findConversationBetween).mockResolvedValue(null);
      vi.mocked(mockRepo.createConversation).mockRejectedValue(
        new DuplicateConversationError('conv-race')
      );

      await expect(
        service.startConversation('user-1', { participantId: 'user-2' })
      ).rejects.toThrow(ConversationAlreadyExistsError);

      const err = await service
        .startConversation('user-1', { participantId: 'user-2' })
        .catch((e: unknown) => e);
      expect(err).toBeInstanceOf(ConversationAlreadyExistsError);
      expect((err as ConversationAlreadyExistsError).conversationId).toBe('conv-race');
    });

    it('пробрасывает не-DuplicateConversationError дальше (не 409)', async () => {
      vi.mocked(mockRepo.findConversationBetween).mockResolvedValue(null);
      vi.mocked(mockRepo.createConversation).mockRejectedValue(new Error('DB error'));

      await expect(
        service.startConversation('user-1', { participantId: 'user-2' })
      ).rejects.toThrow('DB error');
    });
  });

  describe('EC-01: диалог с самим собой', () => {
    it('бросает CannotMessageSelfError при participantId === currentUserId', async () => {
      await expect(
        service.startConversation('user-1', { participantId: 'user-1' })
      ).rejects.toThrow(CannotMessageSelfError);
      expect(mockRepo.findConversationBetween).not.toHaveBeenCalled();
      expect(mockRepo.createConversation).not.toHaveBeenCalled();
    });
  });
});
