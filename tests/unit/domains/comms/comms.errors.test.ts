/**
 * @file comms.errors.test.ts
 * @domain comms
 * @description Tests for comms domain errors (US-21-01)
 *
 * @spec
 * - ConversationNotFoundError has HTTP 404 status
 * - ConversationNotFoundError has NOT_FOUND code
 * - ConversationNotFoundError message contains conversation ID
 * - ConversationAccessDeniedError has HTTP 403 status
 * - ConversationAccessDeniedError has FORBIDDEN code
 * - ConversationAccessDeniedError accepts custom message
 * - MessageNotFoundError has HTTP 404 status
 * - MessageNotFoundError message contains message ID
 */

import { describe, it, expect } from 'vitest';
import {
  ConversationNotFoundError,
  ConversationAccessDeniedError,
  MessageNotFoundError,
} from '@/domains/comms/comms.errors';
import { NotFoundError, ForbiddenError } from '@/shared/errors';

describe('ConversationNotFoundError', () => {
  it('should extend NotFoundError', () => {
    const error = new ConversationNotFoundError('conv-123');
    expect(error).toBeInstanceOf(NotFoundError);
  });

  it('should have HTTP 404 status code', () => {
    const error = new ConversationNotFoundError('conv-123');
    expect(error.statusCode).toBe(404);
  });

  it('should have NOT_FOUND code', () => {
    const error = new ConversationNotFoundError('conv-123');
    expect(error.code).toBe('NOT_FOUND');
  });

  it('should include conversation ID in message', () => {
    const error = new ConversationNotFoundError('conv-abc-456');
    expect(error.message).toContain('conv-abc-456');
  });

  it('should include resource name in message', () => {
    const error = new ConversationNotFoundError('conv-123');
    expect(error.message).toContain('Conversation');
  });

  it('should have correct error structure', () => {
    const error = new ConversationNotFoundError('conv-123');
    expect(error).toMatchObject({
      message: expect.stringContaining('conv-123'),
      statusCode: 404,
      code: 'NOT_FOUND',
    });
  });
});

describe('ConversationAccessDeniedError', () => {
  it('should extend ForbiddenError', () => {
    const error = new ConversationAccessDeniedError();
    expect(error).toBeInstanceOf(ForbiddenError);
  });

  it('should have HTTP 403 status code', () => {
    const error = new ConversationAccessDeniedError();
    expect(error.statusCode).toBe(403);
  });

  it('should have FORBIDDEN code', () => {
    const error = new ConversationAccessDeniedError();
    expect(error.code).toBe('FORBIDDEN');
  });

  it('should have default message', () => {
    const error = new ConversationAccessDeniedError();
    expect(error.message).toBe('У вас нет доступа к этому диалогу');
  });

  it('should accept custom message', () => {
    const error = new ConversationAccessDeniedError('Кастомное сообщение об ошибке');
    expect(error.message).toBe('Кастомное сообщение об ошибке');
  });

  it('should have correct error structure with custom message', () => {
    const error = new ConversationAccessDeniedError('Пользователь не является участником');
    expect(error).toMatchObject({
      message: 'Пользователь не является участником',
      statusCode: 403,
      code: 'FORBIDDEN',
    });
  });
});

describe('MessageNotFoundError', () => {
  it('should extend NotFoundError', () => {
    const error = new MessageNotFoundError('msg-123');
    expect(error).toBeInstanceOf(NotFoundError);
  });

  it('should have HTTP 404 status code', () => {
    const error = new MessageNotFoundError('msg-123');
    expect(error.statusCode).toBe(404);
  });

  it('should have NOT_FOUND code', () => {
    const error = new MessageNotFoundError('msg-123');
    expect(error.code).toBe('NOT_FOUND');
  });

  it('should include message ID in message', () => {
    const error = new MessageNotFoundError('msg-abc-456');
    expect(error.message).toContain('msg-abc-456');
  });

  it('should include resource name in message', () => {
    const error = new MessageNotFoundError('msg-123');
    expect(error.message).toContain('Message');
  });

  it('should have correct error structure', () => {
    const error = new MessageNotFoundError('msg-123');
    expect(error).toMatchObject({
      message: expect.stringContaining('msg-123'),
      statusCode: 404,
      code: 'NOT_FOUND',
    });
  });
});
