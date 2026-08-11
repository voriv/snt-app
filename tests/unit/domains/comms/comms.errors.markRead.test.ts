/**
 * @file comms.errors.markRead.test.ts
 * @domain comms
 * @description Unit-тесты для ParticipantNotFoundError (B-026, US-39-01 AC-4)
 *
 * @spec
 * - ParticipantNotFoundError наследуется от NotFoundError
 * - Код ошибки PARTICIPANT_NOT_FOUND
 * - HTTP статус 404
 * - Сообщение включает conversationId и userId
 */
import { describe, it, expect } from 'vitest';
import { ParticipantNotFoundError } from '@/domains/comms/comms.errors';
import { NotFoundError } from '@/shared/errors';

describe('ParticipantNotFoundError (US-39-01 AC-4)', () => {
  const conversationId = '11111111-1111-4111-8111-111111111111';
  const userId = 'user-1';

  it('должен наследоваться от NotFoundError', () => {
    const error = new ParticipantNotFoundError(conversationId, userId);
    expect(error).toBeInstanceOf(NotFoundError);
  });

  it('должен иметь код PARTICIPANT_NOT_FOUND', () => {
    const error = new ParticipantNotFoundError(conversationId, userId);
    expect(error.code).toBe('PARTICIPANT_NOT_FOUND');
  });

  it('должен иметь HTTP статус 404', () => {
    const error = new ParticipantNotFoundError(conversationId, userId);
    expect(error.statusCode).toBe(404);
  });

  it('должен включать conversationId и userId в сообщение', () => {
    const error = new ParticipantNotFoundError(conversationId, userId);
    expect(error.message).toContain(conversationId);
    expect(error.message).toContain(userId);
  });

  it('должен иметь имя класса ParticipantNotFoundError', () => {
    const error = new ParticipantNotFoundError(conversationId, userId);
    expect(error.name).toBe('ParticipantNotFoundError');
  });
});
