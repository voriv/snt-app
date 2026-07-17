/**
 * @file comms.test.ts
 * @description Интеграционные тесты для Comms API (сообщения)
 * Проверяют прямое взаимодействие с БД через Prisma
 *
 * @spec
 * - beforeEach очищает все тестовые данные через deleteMany()
 * - Создаются тестовые пользователи и диалоги
 * - Проверяют CRUD операции сообщений
 * - Тестируют бизнес-правила (участие в диалоге, владение сообщением)
 *
 * @see docs/user-stories/US-21-03-отправка-личных-сообщений.md
 * @see docs/tests/integration-tests.md
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { CommsService } from '@/domains/comms/comms.service';
import { PrismaCommsRepository } from '@/domains/comms/comms.repository.prisma';
import {
  ConversationNotFoundError,
  ConversationAccessDeniedError,
  MessageNotFoundError,
  CannotDeleteOthersMessageError,
} from '@/domains/comms/comms.errors';
import {
  createUniqueName,
  createUniqueEmail,
} from '../helpers';
import { prisma } from '../setup';

/**
 * Создаёт тестового пользователя с профилем в БД
 */
async function createTestUser(): Promise<{ id: string }> {
  const user = await prisma.user.create({
    data: {
      email: createUniqueEmail(),
      name: createUniqueName(),
      password: '$2a$10$test',
      profile: { create: { theme: 'light' } },
    },
    select: { id: true },
  });
  return user;
}

/**
 * Очищает все связанные таблицы comms
 */
async function cleanupComms(): Promise<void> {
  await prisma.message.deleteMany();
  await prisma.conversationParticipant.deleteMany();
  await prisma.conversation.deleteMany();
}

describe('CommsService Messages (Integration)', () => {
  let service: CommsService;
  let user1: { id: string };
  let user2: { id: string };
  let conversationId: string;

  beforeEach(async () => {
    // Очистка comms таблиц
    await cleanupComms();

    // Создаём тестовых пользователей
    user1 = await createTestUser();
    user2 = await createTestUser();

    // Создаём диалог
    const conversation = await prisma.conversation.create({
      data: {
        type: 'DIRECT',
        createdBy: user1.id,
        participants: {
          create: [
            { userId: user1.id, role: 'MEMBER' },
            { userId: user2.id, role: 'MEMBER' },
          ],
        },
      },
      include: { participants: true },
    });
    conversationId = conversation.id;

    // Создаём сервис
    service = new CommsService(new PrismaCommsRepository());
  });

  afterEach(async () => {
    await cleanupComms();
    // Удаляем тестовых пользователей
    await prisma.userProfile.deleteMany();
    await prisma.user.deleteMany();
  });

  describe('getConversationMessages', () => {
    it('should return 200 with messages when user is participant', async () => {
      // Создаём сообщения
      await prisma.message.create({
        data: {
          conversationId,
          senderId: user1.id,
          content: 'Привет!',
        },
      });
      await prisma.message.create({
        data: {
          conversationId,
          senderId: user2.id,
          content: 'Как дела?',
        },
      });

      const messages = await service.getConversationMessages(conversationId, user1.id);

      expect(messages).toHaveLength(2);
      expect(messages[0]).toHaveProperty('content', 'Привет!');
      expect(messages[1]).toHaveProperty('content', 'Как дела?');
    });

    it('should return 200 with empty array when no messages', async () => {
      const messages = await service.getConversationMessages(conversationId, user1.id);

      expect(messages).toEqual([]);
    });

    it('should throw ConversationNotFoundError when conversation does not exist', async () => {
      await expect(
        service.getConversationMessages('non-existent-conv-id', user1.id)
      ).rejects.toThrow(ConversationNotFoundError);
    });

    it('should throw ConversationAccessDeniedError when user is not participant', async () => {
      const outsider = await createTestUser();

      await expect(
        service.getConversationMessages(conversationId, outsider.id)
      ).rejects.toThrow(ConversationAccessDeniedError);
    });
  });

  describe('sendMessage', () => {
    it('should create message and return 201', async () => {
      const message = await service.sendMessage(user1.id, conversationId, {
        content: 'Новое сообщение',
      });

      expect(message).toHaveProperty('id');
      expect(message.content).toBe('Новое сообщение');
      expect(message.senderId).toBe(user1.id);
      expect(message.conversationId).toBe(conversationId);
      expect(message.isDeleted).toBe(false);

      // Проверяем что сообщение сохранено в БД
      const dbMessage = await prisma.message.findUnique({
        where: { id: message.id },
      });
      expect(dbMessage).not.toBeNull();
      expect(dbMessage?.content).toBe('Новое сообщение');
    });

    it('should create message with replyToId', async () => {
      // Создаём исходное сообщение
      const original = await prisma.message.create({
        data: {
          conversationId,
          senderId: user2.id,
          content: 'Исходное сообщение',
        },
      });

      const reply = await service.sendMessage(user1.id, conversationId, {
        content: 'Ответ на сообщение',
        replyToId: original.id,
      });

      expect(reply.replyToId).toBe(original.id);
    });

    it('should throw ConversationNotFoundError when conversation does not exist', async () => {
      await expect(
        service.sendMessage(user1.id, 'non-existent-conv-id', { content: 'Текст' })
      ).rejects.toThrow(ConversationNotFoundError);
    });

    it('should throw ConversationAccessDeniedError when user is not participant', async () => {
      const outsider = await createTestUser();

      await expect(
        service.sendMessage(outsider.id, conversationId, { content: 'Текст' })
      ).rejects.toThrow(ConversationAccessDeniedError);
    });

    it('should throw ValidationError when content is empty', async () => {
      await expect(
        service.sendMessage(user1.id, conversationId, { content: '' })
      ).rejects.toThrow();
    });

    it('should throw error when content exceeds 4000 chars', async () => {
      const longContent = 'a'.repeat(4001);
      await expect(
        service.sendMessage(user1.id, conversationId, { content: longContent })
      ).rejects.toThrow();
    });
  });

  describe('deleteMessage', () => {
    it('should soft delete own message', async () => {
      // Создаём сообщение
      const message = await prisma.message.create({
        data: {
          conversationId,
          senderId: user1.id,
          content: 'Удалю это',
        },
      });

      // Удаляем
      await service.deleteMessage(user1.id, message.id);

      // Проверяем что сообщение помечено как удалённое
      const dbMessage = await prisma.message.findUnique({
        where: { id: message.id },
      });
      expect(dbMessage?.isDeleted).toBe(true);
      expect(dbMessage?.deletedBy).toBe(user1.id);
      expect(dbMessage?.deletedAt).not.toBeNull();
    });

    it('should throw MessageNotFoundError when message does not exist', async () => {
      await expect(
        service.deleteMessage(user1.id, 'non-existent-message-id')
      ).rejects.toThrow(MessageNotFoundError);
    });

    it('should throw CannotDeleteOthersMessageError when trying to delete others message', async () => {
      // Создаём сообщение от user2
      const message = await prisma.message.create({
        data: {
          conversationId,
          senderId: user2.id,
          content: 'Моё сообщение',
        },
      });

      // user1 пытается удалить
      await expect(
        service.deleteMessage(user1.id, message.id)
      ).rejects.toThrow(CannotDeleteOthersMessageError);

      // Проверяем что сообщение не удалено
      const dbMessage = await prisma.message.findUnique({
        where: { id: message.id },
      });
      expect(dbMessage?.isDeleted).toBe(false);
    });
  });
});
