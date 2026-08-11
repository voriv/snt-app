/**
 * @file tests/api/comms-read.test.ts
 * @description API-тесты для отметки прочитанных и read receipts (B-026)
 *
 * @covers US-39-01 AC-1: PATCH /api/v1/conversations/:id/read
 * @covers US-39-01 AC-2: PATCH /api/v1/chats/:id/read
 * @covers US-39-01 AC-4: Идемпотентность вызова
 * @covers US-39-02 AC-1, AC-2, AC-3, AC-6: GET /api/v1/conversations/:id/messages — read status
 *
 * @spec
 * - Hoisted мокирование для корректной работы с импортами в route.ts
 * - Мокирование auth() и DI контейнера
 * - Проверяет HTTP-статусы (200, 400, 401, 404, 500)
 * - Проверяет форматы ответов
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { z } from 'zod';
import { ParticipantNotFoundError } from '@/domains/comms/comms.errors';
import { markAsReadSchema } from '@/domains/comms/comms.validators';

// Hoisted mock объекты для сервиса
const commsServiceMock = vi.hoisted(() => ({
  markConversationAsRead: vi.fn(),
  getMessagesWithReadStatus: vi.fn(),
}));

const authMock = vi.hoisted(() => vi.fn());

// Моки модулей
vi.mock('../../src/lib/auth', () => ({ auth: authMock }));

vi.mock('../../src/di/container', () => ({
  getContainer: vi.fn(() => ({
    getCommsService: vi.fn(() => commsServiceMock),
  })),
}));

// Импорт route-хендлеров ПОСЛЕ мокирования
import { PATCH as patchConversationRead } from '../../src/app/api/v1/conversations/[id]/read/route';
import { PATCH as patchChatRead } from '../../src/app/api/v1/chats/[id]/read/route';
import { GET as getMessages } from '../../src/app/api/v1/conversations/[id]/messages/route';

const VALID_CONV_ID = '11111111-1111-4111-8111-111111111111';
const VALID_CHAT_ID = '22222222-2222-4222-8222-222222222222';

function createMockRequest(method: string, path: string): NextRequest {
  const url = `http://localhost${path}`;
  return {
    method,
    url,
    headers: new Headers(),
    nextUrl: new URL(url),
    json: async () => ({}),
    arrayBuffer: async () => new ArrayBuffer(0),
    text: async () => '',
  } as unknown as NextRequest;
}

function mockSession(userId = 'user-1') {
  authMock.mockResolvedValue({
    user: { id: userId, email: 'test@example.com', roles: ['MEMBER'], name: 'test' },
    expires: new Date(Date.now() + 3600000).toISOString(),
  });
}

function createBaseError(code: string, message: string, statusCode: number) {
  const err = new Error(message) as Error & { code: string; statusCode: number };
  err.code = code;
  err.statusCode = statusCode;
  return err;
}

describe('PATCH /api/v1/conversations/:id/read (US-39-01 AC-1, AC-4)', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    commsServiceMock.markConversationAsRead.mockResolvedValue(undefined);
    commsServiceMock.getMessagesWithReadStatus.mockResolvedValue([]);
  });

  it('AC-1: должен вернуть 200 { success: true } для участника', async () => {
    mockSession();
    commsServiceMock.markConversationAsRead.mockResolvedValue(undefined);

    const req = createMockRequest(
      'PATCH',
      `/api/v1/conversations/${VALID_CONV_ID}/read`
    );
    const response = await patchConversationRead(req, {
      params: Promise.resolve({ id: VALID_CONV_ID }),
    });

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json).toMatchObject({ success: true });
    expect(commsServiceMock.markConversationAsRead).toHaveBeenCalledWith(
      VALID_CONV_ID,
      'user-1'
    );
  });

  it('AC-4: должен быть идемпотентным при повторном вызове', async () => {
    mockSession();
    commsServiceMock.markConversationAsRead.mockResolvedValue(undefined);

    const req = createMockRequest(
      'PATCH',
      `/api/v1/conversations/${VALID_CONV_ID}/read`
    );
    const params = { params: Promise.resolve({ id: VALID_CONV_ID }) };

    await patchConversationRead(req, params);
    const second = await patchConversationRead(req, params);

    expect(second.status).toBe(200);
    expect(commsServiceMock.markConversationAsRead).toHaveBeenCalledTimes(2);
  });

  it('должен вернуть 404 при ParticipantNotFoundError (не-участник)', async () => {
    mockSession();
    commsServiceMock.markConversationAsRead.mockRejectedValue(
      new ParticipantNotFoundError(VALID_CONV_ID, 'user-1')
    );

    const req = createMockRequest(
      'PATCH',
      `/api/v1/conversations/${VALID_CONV_ID}/read`
    );
    const response = await patchConversationRead(req, {
      params: Promise.resolve({ id: VALID_CONV_ID }),
    });

    expect(response.status).toBe(404);
    const json = await response.json();
    expect(json).toMatchObject({
      success: false,
      error: { code: 'PARTICIPANT_NOT_FOUND' },
    });
  });

  it('должен вернуть 401 без авторизации', async () => {
    authMock.mockResolvedValue(null);

    const req = createMockRequest(
      'PATCH',
      `/api/v1/conversations/${VALID_CONV_ID}/read`
    );
    const response = await patchConversationRead(req, {
      params: Promise.resolve({ id: VALID_CONV_ID }),
    });

    expect(response.status).toBe(401);
    const json = await response.json();
    expect(json).toMatchObject({
      success: false,
      error: { code: 'UNAUTHORIZED' },
    });
  });

  it('должен вернуть 400 при ZodError (невалидный id) из сервиса', async () => {
    mockSession();
    // Сервис бросает ZodError при невалидном UUID (валидация markAsReadSchema)
    const zodError = markAsReadSchema.safeParse({ id: 'bad-id' });
    commsServiceMock.markConversationAsRead.mockRejectedValue(
      (zodError as { error: unknown }).error
    );

    const req = createMockRequest('PATCH', '/api/v1/conversations/bad-id/read');
    const response = await patchConversationRead(req, {
      params: Promise.resolve({ id: 'bad-id' }),
    });

    expect(response.status).toBe(400);
    const json = await response.json();
    expect(json).toMatchObject({
      success: false,
      error: { code: 'VALIDATION_ERROR' },
    });
  });
});

describe('PATCH /api/v1/chats/:id/read (US-39-01 AC-2, AC-4)', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    commsServiceMock.markConversationAsRead.mockResolvedValue(undefined);
    commsServiceMock.getMessagesWithReadStatus.mockResolvedValue([]);
  });

  it('AC-2: должен вернуть 200 { success: true } для участника чата', async () => {
    mockSession('user-group');
    commsServiceMock.markConversationAsRead.mockResolvedValue(undefined);

    const req = createMockRequest('PATCH', `/api/v1/chats/${VALID_CHAT_ID}/read`);
    const response = await patchChatRead(req, {
      params: Promise.resolve({ id: VALID_CHAT_ID }),
    });

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json).toMatchObject({ success: true });
    expect(commsServiceMock.markConversationAsRead).toHaveBeenCalledWith(
      VALID_CHAT_ID,
      'user-group'
    );
  });

  it('AC-4: должен быть идемпотентным', async () => {
    mockSession();
    commsServiceMock.markConversationAsRead.mockResolvedValue(undefined);

    const req = createMockRequest('PATCH', `/api/v1/chats/${VALID_CHAT_ID}/read`);
    const params = { params: Promise.resolve({ id: VALID_CHAT_ID }) };

    await patchChatRead(req, params);
    const second = await patchChatRead(req, params);

    expect(second.status).toBe(200);
    expect(commsServiceMock.markConversationAsRead).toHaveBeenCalledTimes(2);
  });

  it('должен вернуть 404 при ParticipantNotFoundError', async () => {
    mockSession();
    commsServiceMock.markConversationAsRead.mockRejectedValue(
      new ParticipantNotFoundError(VALID_CHAT_ID, 'user-1')
    );

    const req = createMockRequest('PATCH', `/api/v1/chats/${VALID_CHAT_ID}/read`);
    const response = await patchChatRead(req, {
      params: Promise.resolve({ id: VALID_CHAT_ID }),
    });

    expect(response.status).toBe(404);
  });

  it('должен вернуть 401 без авторизации', async () => {
    authMock.mockResolvedValue(null);

    const req = createMockRequest('PATCH', `/api/v1/chats/${VALID_CHAT_ID}/read`);
    const response = await patchChatRead(req, {
      params: Promise.resolve({ id: VALID_CHAT_ID }),
    });

    expect(response.status).toBe(401);
  });
});

describe('GET /api/v1/conversations/:id/messages — read status (US-39-02)', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    commsServiceMock.markConversationAsRead.mockResolvedValue(undefined);
    commsServiceMock.getMessagesWithReadStatus.mockResolvedValue([]);
  });

  it('AC-1/AC-2: должен возвращать isReadByRecipient для DIRECT', async () => {
    mockSession();
    commsServiceMock.getMessagesWithReadStatus.mockResolvedValue([
      {
        id: 'm1',
        conversationId: VALID_CONV_ID,
        senderId: 'user-2',
        senderName: 'Иван',
        content: 'Доставлено',
        replyToId: null,
        isDeleted: false,
        deletedBy: null,
        deletedAt: null,
        createdAt: '2024-01-15T10:00:00.000Z',
        updatedAt: '2024-01-15T10:00:00.000Z',
        isReadByRecipient: false,
      },
      {
        id: 'm2',
        conversationId: VALID_CONV_ID,
        senderId: 'user-2',
        senderName: 'Иван',
        content: 'Прочитано',
        replyToId: null,
        isDeleted: false,
        deletedBy: null,
        deletedAt: null,
        createdAt: '2024-01-15T10:05:00.000Z',
        updatedAt: '2024-01-15T10:05:00.000Z',
        isReadByRecipient: true,
      },
    ]);

    const req = createMockRequest(
      'GET',
      `/api/v1/conversations/${VALID_CONV_ID}/messages`
    );
    const response = await getMessages(req, {
      params: Promise.resolve({ id: VALID_CONV_ID }),
    });

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.success).toBe(true);
    expect(json.data).toHaveLength(2);
    expect(json.data[0].isReadByRecipient).toBe(false);
    expect(json.data[1].isReadByRecipient).toBe(true);
  });

  it('AC-3/AC-6: должен возвращать readByCount/totalParticipants для GROUP', async () => {
    mockSession();
    commsServiceMock.getMessagesWithReadStatus.mockResolvedValue([
      {
        id: 'g1',
        conversationId: VALID_CONV_ID,
        senderId: 'user-1',
        content: 'Счётчик 3 из 4',
        replyToId: null,
        isDeleted: false,
        deletedBy: null,
        deletedAt: null,
        createdAt: '2024-01-15T10:00:00.000Z',
        updatedAt: '2024-01-15T10:00:00.000Z',
        isReadByRecipient: true,
        readByCount: 3,
        totalParticipants: 4,
      },
      {
        id: 'g2',
        conversationId: VALID_CONV_ID,
        senderId: 'user-1',
        content: 'Ноль прочитавших',
        replyToId: null,
        isDeleted: false,
        deletedBy: null,
        deletedAt: null,
        createdAt: '2024-01-15T10:10:00.000Z',
        updatedAt: '2024-01-15T10:10:00.000Z',
        isReadByRecipient: false,
        readByCount: 0,
        totalParticipants: 4,
      },
    ]);

    const req = createMockRequest(
      'GET',
      `/api/v1/conversations/${VALID_CONV_ID}/messages`
    );
    const response = await getMessages(req, {
      params: Promise.resolve({ id: VALID_CONV_ID }),
    });

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.data[0]).toMatchObject({ readByCount: 3, totalParticipants: 4 });
    expect(json.data[1]).toMatchObject({ readByCount: 0, totalParticipants: 4 });
  });

  it('должен вернуть 401 без авторизации', async () => {
    authMock.mockResolvedValue(null);

    const req = createMockRequest(
      'GET',
      `/api/v1/conversations/${VALID_CONV_ID}/messages`
    );
    const response = await getMessages(req, {
      params: Promise.resolve({ id: VALID_CONV_ID }),
    });

    expect(response.status).toBe(401);
  });

  it('должен вернуть 404 при ошибке диалога (не-участник)', async () => {
    mockSession();
    commsServiceMock.getMessagesWithReadStatus.mockRejectedValue(
      createBaseError('CONVERSATION_ACCESS_DENIED', 'Нет доступа', 403)
    );

    const req = createMockRequest(
      'GET',
      `/api/v1/conversations/${VALID_CONV_ID}/messages`
    );
    const response = await getMessages(req, {
      params: Promise.resolve({ id: VALID_CONV_ID }),
    });

    expect(response.status).toBe(403);
    const json = await response.json();
    expect(json).toMatchObject({
      success: false,
      error: { code: 'CONVERSATION_ACCESS_DENIED' },
    });
  });

  it('должен вернуть 500 при неизвестной ошибке', async () => {
    mockSession();
    commsServiceMock.getMessagesWithReadStatus.mockRejectedValue(
      new Error('DB error')
    );

    const req = createMockRequest(
      'GET',
      `/api/v1/conversations/${VALID_CONV_ID}/messages`
    );
    const response = await getMessages(req, {
      params: Promise.resolve({ id: VALID_CONV_ID }),
    });

    expect(response.status).toBe(500);
    const json = await response.json();
    expect(json).toMatchObject({
      success: false,
      error: { code: 'UNKNOWN_ERROR' },
    });
  });
});
