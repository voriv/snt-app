/**
 * @file comms.service.test.ts
 * @domain comms
 * @description Tests for CommsService business logic (US-21-01)
 *
 * @spec
 * - getUserConversations validates query params through Zod schema
 * - getUserConversations calls repository with parsed options
 * - findConversationById throws ConversationNotFoundError when not found
 * - findConversationById returns conversation when found
 * - isParticipant delegates to repository
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CommsService } from '@/domains/comms/comms.service';
import type { ICommsRepository } from '@/domains/comms/comms.repository.interface';
import type { Conversation, ConversationListResponse, CreateConversationResult, Message } from '@/domains/comms/comms.types';
import {
  ConversationNotFoundError,
  ConversationAlreadyExistsError,
  CannotMessageSelfError,
  ConversationAccessDeniedError,
  MessageNotFoundError,
  MessageTooLargeError,
  CannotDeleteOthersMessageError,
  ChatNameExistsError,
  BadRequestError,
} from '@/domains/comms/comms.errors';

// Helper to create a mock repository
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

// Helper to create a test conversation
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

// Helper to create a test conversation list response
function createTestConversationListResponse(overrides?: Partial<ConversationListResponse>): ConversationListResponse {
  return {
    items: [
      {
        conversationId: 'conv-1',
        participantId: 'user-2',
        participantName: 'Иван Петров',
        participantEmail: 'ivan@example.com',
        participantAvatar: null,
        lastMessagePreview: 'Привет, как дела?',
        lastMessageAt: new Date('2024-01-15T10:00:00.000Z'),
        unreadCount: 2,
      },
    ],
    total: 1,
    ...overrides,
  };
}

// Helper to create a test message
function createTestMessage(overrides?: Partial<Message>): Message {
  const now = new Date('2024-01-01T00:00:00.000Z');
  return {
    id: 'msg-123',
    conversationId: 'conv-123',
    senderId: 'user-1',
    content: 'Привет!',
    replyToId: null,
    isDeleted: false,
    deletedBy: null,
    deletedAt: null,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

describe('CommsService', () => {
  let service: CommsService;
  let mockRepo: ICommsRepository;

  beforeEach(() => {
    vi.clearAllMocks();
    mockRepo = createMockRepository();
    service = new CommsService(mockRepo);
  });

  describe('getUserConversations', () => {
    it('should return conversations with empty query', async () => {
      const expected = createTestConversationListResponse();
      vi.mocked(mockRepo.getUserConversations).mockResolvedValue(expected);

      const result = await service.getUserConversations('user-1');

      expect(result).toEqual(expected);
      expect(mockRepo.getUserConversations).toHaveBeenCalledWith('user-1', {
        search: undefined,
        limit: undefined,
        page: undefined,
      });
    });

    it('should return conversations with search query', async () => {
      const expected = createTestConversationListResponse();
      vi.mocked(mockRepo.getUserConversations).mockResolvedValue(expected);

      const result = await service.getUserConversations('user-1', { search: 'Иван' });

      expect(result).toEqual(expected);
      expect(mockRepo.getUserConversations).toHaveBeenCalledWith('user-1', {
        search: 'Иван',
        limit: undefined,
        page: undefined,
      });
    });

    it('should return conversations with limit and page query', async () => {
      const expected = createTestConversationListResponse();
      vi.mocked(mockRepo.getUserConversations).mockResolvedValue(expected);

      const result = await service.getUserConversations('user-1', { limit: '10', page: '2' });

      expect(result).toEqual(expected);
      expect(mockRepo.getUserConversations).toHaveBeenCalledWith('user-1', {
        search: undefined,
        limit: 10,
        page: 2,
      });
    });

    it('should return conversations with all query params', async () => {
      const expected = createTestConversationListResponse();
      vi.mocked(mockRepo.getUserConversations).mockResolvedValue(expected);

      const result = await service.getUserConversations('user-1', {
        search: 'Петров',
        limit: '5',
        page: '1',
      });

      expect(result).toEqual(expected);
      expect(mockRepo.getUserConversations).toHaveBeenCalledWith('user-1', {
        search: 'Петров',
        limit: 5,
        page: 1,
      });
    });

    it('should return empty response when no conversations', async () => {
      const expected: ConversationListResponse = { items: [], total: 0 };
      vi.mocked(mockRepo.getUserConversations).mockResolvedValue(expected);

      const result = await service.getUserConversations('user-empty');

      expect(result).toEqual(expected);
      expect(mockRepo.getUserConversations).toHaveBeenCalledWith('user-empty', {
        search: undefined,
        limit: undefined,
        page: undefined,
      });
    });

    it('should pass undefined query as empty object', async () => {
      const expected: ConversationListResponse = { items: [], total: 0 };
      vi.mocked(mockRepo.getUserConversations).mockResolvedValue(expected);

      const result = await service.getUserConversations('user-1', undefined);

      expect(result).toEqual(expected);
      expect(mockRepo.getUserConversations).toHaveBeenCalledWith('user-1', {
        search: undefined,
        limit: undefined,
        page: undefined,
      });
    });

    it('should throw ZodError when search is too short (1 char)', async () => {
      await expect(service.getUserConversations('user-1', { search: 'И' })).rejects.toThrow();
    });

    it('should throw ZodError when limit is out of range (0)', async () => {
      await expect(service.getUserConversations('user-1', { limit: '0' })).rejects.toThrow();
    });

    it('should throw ZodError when limit is out of range (101)', async () => {
      await expect(service.getUserConversations('user-1', { limit: '101' })).rejects.toThrow();
    });

    it('should throw ZodError when page is less than 1 (0)', async () => {
      await expect(service.getUserConversations('user-1', { page: '0' })).rejects.toThrow();
    });
  });

  describe('findConversationById', () => {
    it('should return conversation when found', async () => {
      const conversation = createTestConversation();
      vi.mocked(mockRepo.findById).mockResolvedValue(conversation);

      const result = await service.findConversationById('conv-123');

      expect(result).toEqual(conversation);
      expect(mockRepo.findById).toHaveBeenCalledWith('conv-123');
    });

    it('should throw ConversationNotFoundError when not found', async () => {
      vi.mocked(mockRepo.findById).mockResolvedValue(null);

      await expect(service.findConversationById('non-existent')).rejects.toThrow(
        ConversationNotFoundError
      );
      await expect(service.findConversationById('non-existent')).rejects.toMatchObject({
        code: 'NOT_FOUND',
        statusCode: 404,
      });
    });

    it('should throw ConversationNotFoundError with correct message', async () => {
      vi.mocked(mockRepo.findById).mockResolvedValue(null);

      try {
        await service.findConversationById('conv-404');
        // Should not reach here
        expect(false).toBe(true);
      } catch (error) {
        expect(error).toBeInstanceOf(ConversationNotFoundError);
        expect((error as Error).message).toContain('conv-404');
      }
    });
  });

  describe('isParticipant', () => {
    it('should return true when user is participant', async () => {
      vi.mocked(mockRepo.isParticipant).mockResolvedValue(true);

      const result = await service.isParticipant('conv-123', 'user-1');

      expect(result).toBe(true);
      expect(mockRepo.isParticipant).toHaveBeenCalledWith('conv-123', 'user-1');
    });

    it('should return false when user is not participant', async () => {
      vi.mocked(mockRepo.isParticipant).mockResolvedValue(false);

      const result = await service.isParticipant('conv-123', 'user-999');

      expect(result).toBe(false);
      expect(mockRepo.isParticipant).toHaveBeenCalledWith('conv-123', 'user-999');
    });
  });

  describe('startConversation (US-21-02)', () => {
    it('should create a new conversation when none exists', async () => {
      const newConversation: Conversation = createTestConversation({
        id: 'conv-new',
        createdBy: 'user-1',
      });

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

    it('should throw ConversationAlreadyExistsError when one already exists (B-029)', async () => {
      const existingConversation: Conversation = createTestConversation({ id: 'conv-existing' });

      vi.mocked(mockRepo.findConversationBetween).mockResolvedValue(existingConversation);

      await expect(
        service.startConversation('user-1', { participantId: 'user-2' })
      ).rejects.toThrow(ConversationAlreadyExistsError);
      expect(mockRepo.findConversationBetween).toHaveBeenCalledWith('user-1', 'user-2');
      expect(mockRepo.createConversation).not.toHaveBeenCalled();
    });

    it('should throw CannotMessageSelfError when trying to message self', async () => {
      await expect(
        service.startConversation('user-1', { participantId: 'user-1' })
      ).rejects.toThrow(CannotMessageSelfError);
      expect(mockRepo.findConversationBetween).not.toHaveBeenCalled();
      expect(mockRepo.createConversation).not.toHaveBeenCalled();
    });

    it('should throw BadRequestError when participant does not exist (B-030)', async () => {
      vi.mocked(mockRepo.userExists).mockResolvedValue(false);

      await expect(
        service.startConversation('user-1', { participantId: 'ghost-user' })
      ).rejects.toThrow(BadRequestError);
      expect(mockRepo.findConversationBetween).not.toHaveBeenCalled();
      expect(mockRepo.createConversation).not.toHaveBeenCalled();
    });

    it('should validate participantId is not empty', async () => {
      await expect(
        service.startConversation('user-1', { participantId: '' })
      ).rejects.toThrow();
    });

    it('should validate participantId is a string', async () => {
      await expect(
        // @ts-expect-error — intentionally passing invalid type to test validation
        service.startConversation('user-1', { participantId: 123 })
      ).rejects.toThrow();
    });
  });

  // ====================================================================
  // US-21-03: Отправка личных сообщений
  // ====================================================================

  describe('getConversationMessages (US-21-03)', () => {
    it('should return messages when user is participant', async () => {
      const conversation = createTestConversation();
      const messages = [
        createTestMessage({ id: 'msg-1', senderId: 'user-1', content: 'Привет!' }),
        createTestMessage({ id: 'msg-2', senderId: 'user-2', content: 'Как дела?' }),
      ];

      vi.mocked(mockRepo.findById).mockResolvedValue(conversation);
      vi.mocked(mockRepo.isParticipant).mockResolvedValue(true);
      vi.mocked(mockRepo.getConversationMessages).mockResolvedValue(messages);

      const result = await service.getConversationMessages('conv-123', 'user-1');

      expect(result).toEqual(messages);
      expect(mockRepo.findById).toHaveBeenCalledWith('conv-123');
      expect(mockRepo.isParticipant).toHaveBeenCalledWith('conv-123', 'user-1');
      expect(mockRepo.getConversationMessages).toHaveBeenCalledWith('conv-123');
    });

    it('should return empty array when no messages', async () => {
      const conversation = createTestConversation();

      vi.mocked(mockRepo.findById).mockResolvedValue(conversation);
      vi.mocked(mockRepo.isParticipant).mockResolvedValue(true);
      vi.mocked(mockRepo.getConversationMessages).mockResolvedValue([]);

      const result = await service.getConversationMessages('conv-123', 'user-1');

      expect(result).toEqual([]);
      expect(mockRepo.getConversationMessages).toHaveBeenCalledWith('conv-123');
    });

    it('should throw ConversationNotFoundError when conversation does not exist', async () => {
      vi.mocked(mockRepo.findById).mockResolvedValue(null);

      await expect(
        service.getConversationMessages('conv-nonexistent', 'user-1')
      ).rejects.toThrow(ConversationNotFoundError);
      expect(mockRepo.findById).toHaveBeenCalledWith('conv-nonexistent');
      expect(mockRepo.isParticipant).not.toHaveBeenCalled();
      expect(mockRepo.getConversationMessages).not.toHaveBeenCalled();
    });

    it('should throw ConversationAccessDeniedError when user is not participant', async () => {
      const conversation = createTestConversation();

      vi.mocked(mockRepo.findById).mockResolvedValue(conversation);
      vi.mocked(mockRepo.isParticipant).mockResolvedValue(false);

      await expect(
        service.getConversationMessages('conv-123', 'user-unauthorized')
      ).rejects.toThrow(ConversationAccessDeniedError);
      expect(mockRepo.findById).toHaveBeenCalledWith('conv-123');
      expect(mockRepo.isParticipant).toHaveBeenCalledWith('conv-123', 'user-unauthorized');
      expect(mockRepo.getConversationMessages).not.toHaveBeenCalled();
    });
  });

  describe('sendMessage (US-21-03)', () => {
    it('should create message successfully', async () => {
      const conversation = createTestConversation();
      const createdMessage = createTestMessage({
        id: 'msg-new',
        senderId: 'user-1',
        content: 'Новое сообщение',
        replyToId: null,
      });

      vi.mocked(mockRepo.findById).mockResolvedValue(conversation);
      vi.mocked(mockRepo.isParticipant).mockResolvedValue(true);
      vi.mocked(mockRepo.createMessage).mockResolvedValue(createdMessage);

      const result = await service.sendMessage('user-1', 'conv-123', { content: 'Новое сообщение' });

      expect(result).toEqual(createdMessage);
      expect(mockRepo.findById).toHaveBeenCalledWith('conv-123');
      expect(mockRepo.isParticipant).toHaveBeenCalledWith('conv-123', 'user-1');
      expect(mockRepo.createMessage).toHaveBeenCalledWith({
        conversationId: 'conv-123',
        senderId: 'user-1',
        content: 'Новое сообщение',
        replyToId: null,
      });
    });

    it('should create message with replyToId', async () => {
      const conversation = createTestConversation();
      const createdMessage = createTestMessage({
        id: 'msg-reply',
        senderId: 'user-1',
        content: 'Ответ на сообщение',
        replyToId: 'msg-original',
      });

      vi.mocked(mockRepo.findById).mockResolvedValue(conversation);
      vi.mocked(mockRepo.isParticipant).mockResolvedValue(true);
      vi.mocked(mockRepo.createMessage).mockResolvedValue(createdMessage);

      const result = await service.sendMessage('user-1', 'conv-123', {
        content: 'Ответ на сообщение',
        replyToId: 'msg-original',
      });

      expect(result).toEqual(createdMessage);
      expect(mockRepo.createMessage).toHaveBeenCalledWith({
        conversationId: 'conv-123',
        senderId: 'user-1',
        content: 'Ответ на сообщение',
        replyToId: 'msg-original',
      });
    });

    it('should throw ConversationNotFoundError when conversation does not exist', async () => {
      vi.mocked(mockRepo.findById).mockResolvedValue(null);

      await expect(
        service.sendMessage('user-1', 'conv-nonexistent', { content: 'Текст' })
      ).rejects.toThrow(ConversationNotFoundError);
      expect(mockRepo.findById).toHaveBeenCalledWith('conv-nonexistent');
      expect(mockRepo.isParticipant).not.toHaveBeenCalled();
      expect(mockRepo.createMessage).not.toHaveBeenCalled();
    });

    it('should throw ConversationAccessDeniedError when user is not participant', async () => {
      const conversation = createTestConversation();

      vi.mocked(mockRepo.findById).mockResolvedValue(conversation);
      vi.mocked(mockRepo.isParticipant).mockResolvedValue(false);

      await expect(
        service.sendMessage('user-unauthorized', 'conv-123', { content: 'Текст' })
      ).rejects.toThrow(ConversationAccessDeniedError);
      expect(mockRepo.findById).toHaveBeenCalledWith('conv-123');
      expect(mockRepo.isParticipant).toHaveBeenCalledWith('conv-123', 'user-unauthorized');
      expect(mockRepo.createMessage).not.toHaveBeenCalled();
    });

    it('should throw ValidationError when content is empty', async () => {
      await expect(
        service.sendMessage('user-1', 'conv-123', { content: '' })
      ).rejects.toThrow();
    });

    it('should throw ValidationError when content exceeds 4000 chars', async () => {
      const longContent = 'a'.repeat(4001);
      await expect(
        service.sendMessage('user-1', 'conv-123', { content: longContent })
      ).rejects.toThrow();
    });

    it('should accept content with exactly 4000 chars', async () => {
      const conversation = createTestConversation();
      const maxContent = 'a'.repeat(4000);
      const createdMessage = createTestMessage({ content: maxContent });

      vi.mocked(mockRepo.findById).mockResolvedValue(conversation);
      vi.mocked(mockRepo.isParticipant).mockResolvedValue(true);
      vi.mocked(mockRepo.createMessage).mockResolvedValue(createdMessage);

      const result = await service.sendMessage('user-1', 'conv-123', { content: maxContent });
      expect(result.content).toBe(maxContent);
    });

    it('should throw ValidationError when content is not a string', async () => {
      await expect(
        // @ts-expect-error — intentionally passing invalid type to test validation
        service.sendMessage('user-1', 'conv-123', { content: 123 })
      ).rejects.toThrow();
    });
  });

  describe('deleteMessage (US-21-03)', () => {
    it('should delete own message successfully', async () => {
      const message = createTestMessage({ id: 'msg-1', senderId: 'user-1' });

      vi.mocked(mockRepo.findMessageById).mockResolvedValue(message);
      vi.mocked(mockRepo.getMessageSender).mockResolvedValue('user-1');
      vi.mocked(mockRepo.softDeleteMessage).mockResolvedValue();

      await service.deleteMessage('user-1', 'msg-1');

      expect(mockRepo.findMessageById).toHaveBeenCalledWith('msg-1');
      expect(mockRepo.getMessageSender).toHaveBeenCalledWith('msg-1');
      expect(mockRepo.softDeleteMessage).toHaveBeenCalledWith('msg-1', 'user-1');
    });

    it('should throw MessageNotFoundError when message does not exist', async () => {
      vi.mocked(mockRepo.findMessageById).mockResolvedValue(null);

      await expect(
        service.deleteMessage('user-1', 'msg-nonexistent')
      ).rejects.toThrow(MessageNotFoundError);
      expect(mockRepo.findMessageById).toHaveBeenCalledWith('msg-nonexistent');
      expect(mockRepo.getMessageSender).not.toHaveBeenCalled();
      expect(mockRepo.softDeleteMessage).not.toHaveBeenCalled();
    });

    it('should throw CannotDeleteOthersMessageError when trying to delete others message', async () => {
      const message = createTestMessage({ id: 'msg-1', senderId: 'user-2' });

      vi.mocked(mockRepo.findMessageById).mockResolvedValue(message);
      vi.mocked(mockRepo.getMessageSender).mockResolvedValue('user-2');

      await expect(
        service.deleteMessage('user-1', 'msg-1')
      ).rejects.toThrow(CannotDeleteOthersMessageError);
      expect(mockRepo.findMessageById).toHaveBeenCalledWith('msg-1');
      expect(mockRepo.getMessageSender).toHaveBeenCalledWith('msg-1');
      expect(mockRepo.softDeleteMessage).not.toHaveBeenCalled();
    });

    it('should throw MessageNotFoundError with correct error code', async () => {
      vi.mocked(mockRepo.findMessageById).mockResolvedValue(null);

      try {
        await service.deleteMessage('user-1', 'msg-404');
        expect(false).toBe(true); // Should not reach here
      } catch (error) {
        expect(error).toBeInstanceOf(MessageNotFoundError);
        expect((error as any).code).toBe('NOT_FOUND');
        expect((error as any).statusCode).toBe(404);
      }
    });

    it('should throw CannotDeleteOthersMessageError with correct error code', async () => {
      const message = createTestMessage({ id: 'msg-1', senderId: 'user-2' });

      vi.mocked(mockRepo.findMessageById).mockResolvedValue(message);
      vi.mocked(mockRepo.getMessageSender).mockResolvedValue('user-2');

      try {
        await service.deleteMessage('user-1', 'msg-1');
        expect(false).toBe(true); // Should not reach here
      } catch (error) {
        expect(error).toBeInstanceOf(CannotDeleteOthersMessageError);
        expect((error as any).code).toBe('FORBIDDEN');
        expect((error as any).statusCode).toBe(403);
      }
    });
  });

  describe('updateChat (US-21-06)', () => {
    it('should update chat name and description successfully', async () => {
      const chat = createTestConversation({
        id: 'chat-1',
        type: 'GROUP',
        title: 'Старое название',
        description: 'Старое описание',
      });
      const updated = createTestConversation({
        id: 'chat-1',
        type: 'GROUP',
        title: 'Новое название',
        description: 'Новое описание',
      });

      vi.mocked(mockRepo.findById).mockResolvedValue(chat);
      vi.mocked(mockRepo.groupChatExistsByName).mockResolvedValue(false);
      vi.mocked(mockRepo.updateChat).mockResolvedValue(updated);

      const result = await service.updateChat('user-1', 'chat-1', {
        name: 'Новое название',
        description: 'Новое описание',
      });

      expect(result).toEqual(updated);
      expect(mockRepo.findById).toHaveBeenCalledWith('chat-1');
      expect(mockRepo.updateChat).toHaveBeenCalledWith('chat-1', 'user-1', {
        name: 'Новое название',
        description: 'Новое описание',
      });
    });

    it('should update only description without name', async () => {
      const chat = createTestConversation({
        id: 'chat-1',
        type: 'GROUP',
        title: 'Название',
        description: null,
      });
      const updated = createTestConversation({
        id: 'chat-1',
        type: 'GROUP',
        title: 'Название',
        description: 'Новое описание',
      });

      vi.mocked(mockRepo.findById).mockResolvedValue(chat);
      vi.mocked(mockRepo.updateChat).mockResolvedValue(updated);

      const result = await service.updateChat('user-1', 'chat-1', {
        description: 'Новое описание',
      });

      expect(result).toEqual(updated);
      expect(mockRepo.groupChatExistsByName).not.toHaveBeenCalled();
      expect(mockRepo.updateChat).toHaveBeenCalledWith('chat-1', 'user-1', {
        description: 'Новое описание',
      });
    });

    it('should throw ConversationNotFoundError when chat does not exist', async () => {
      vi.mocked(mockRepo.findById).mockResolvedValue(null);

      await expect(
        service.updateChat('user-1', 'chat-404', { name: 'Новое' })
      ).rejects.toThrow(ConversationNotFoundError);

      expect(mockRepo.updateChat).not.toHaveBeenCalled();
    });

    it('should throw ChatNameExistsError when new name is already taken', async () => {
      const chat = createTestConversation({
        id: 'chat-1',
        type: 'GROUP',
        title: 'Старое название',
      });

      vi.mocked(mockRepo.findById).mockResolvedValue(chat);
      vi.mocked(mockRepo.groupChatExistsByName).mockResolvedValue(true);

      await expect(
        service.updateChat('user-1', 'chat-1', { name: 'Занятое название' })
      ).rejects.toThrow(ChatNameExistsError);

      expect(mockRepo.updateChat).not.toHaveBeenCalled();
    });

    it('should not check name uniqueness when name is unchanged', async () => {
      const chat = createTestConversation({
        id: 'chat-1',
        type: 'GROUP',
        title: 'Текущее название',
      });
      const updated = createTestConversation({
        id: 'chat-1',
        type: 'GROUP',
        title: 'Текущее название',
        description: 'Новое описание',
      });

      vi.mocked(mockRepo.findById).mockResolvedValue(chat);
      vi.mocked(mockRepo.updateChat).mockResolvedValue(updated);

      await service.updateChat('user-1', 'chat-1', {
        name: 'Текущее название',
        description: 'Новое описание',
      });

      expect(mockRepo.groupChatExistsByName).not.toHaveBeenCalled();
    });
  });

  // ====================================================================
  // US-21-37: Счётчики непрочитанных на вкладках "Общение"
  // ====================================================================

  describe('getUnreadCounts (US-21-37)', () => {
    it('should return unread counts delegating to repository', async () => {
      const expected = { messages: 5, chats: 3 };
      vi.mocked(mockRepo.getUnreadCounts).mockResolvedValue(expected);

      const result = await service.getUnreadCounts('user-1');

      expect(result).toEqual(expected);
      expect(mockRepo.getUnreadCounts).toHaveBeenCalledWith('user-1');
    });

    it('should return zero counts when no unread messages', async () => {
      const expected = { messages: 0, chats: 0 };
      vi.mocked(mockRepo.getUnreadCounts).mockResolvedValue(expected);

      const result = await service.getUnreadCounts('user-1');

      expect(result).toEqual(expected);
      expect(mockRepo.getUnreadCounts).toHaveBeenCalledWith('user-1');
    });

    it('should return counts with only messages unread', async () => {
      const expected = { messages: 10, chats: 0 };
      vi.mocked(mockRepo.getUnreadCounts).mockResolvedValue(expected);

      const result = await service.getUnreadCounts('user-1');

      expect(result).toEqual(expected);
    });

    it('should return counts with only chats unread', async () => {
      const expected = { messages: 0, chats: 7 };
      vi.mocked(mockRepo.getUnreadCounts).mockResolvedValue(expected);

      const result = await service.getUnreadCounts('user-1');

      expect(result).toEqual(expected);
    });

    it('should pass through large counts from repository', async () => {
      const expected = { messages: 150, chats: 200 };
      vi.mocked(mockRepo.getUnreadCounts).mockResolvedValue(expected);

      const result = await service.getUnreadCounts('user-1');

      expect(result).toEqual(expected);
    });

    it('should propagate repository errors', async () => {
      vi.mocked(mockRepo.getUnreadCounts).mockRejectedValue(new Error('DB error'));

      await expect(service.getUnreadCounts('user-1')).rejects.toThrow('DB error');
    });
  });
});
