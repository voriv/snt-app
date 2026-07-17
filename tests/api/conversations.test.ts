/**
 * @file tests/api/conversations.test.ts
 * @description API-тесты для списка личных диалогов (US-21-01)
 *
 * @spec
 * - Hoisted мокирование для корректной работы с импортами в route.ts
 * - Мокирование auth() и DI контейнера
 * - Проверяет HTTP-статусы (200, 400, 401)
 * - Проверяет форматы ответов
 * - Проверяет обработку query параметров (search, limit, page)
 * - Проверяет пустой результат
 *
 * @see docs/tests/api-tests.md
 * @see docs/user-stories/US-21-01-просмотр-личных-диалогов.md
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// Hoisted mock объекты
const commsServiceMock = vi.hoisted(() => ({
  getUserConversations: vi.fn(),
}));

const authMock = vi.hoisted(() => vi.fn());

// Моки модулей
vi.mock('../../src/lib/auth', () => ({
  auth: authMock,
}));

vi.mock('../../src/di/container', () => {
  return {
    getContainer: vi.fn(() => ({
      getCommsService: vi.fn(() => commsServiceMock),
    })),
  };
});

// Импорт функции из API route ПОСЛЕ мокирования
import { GET } from '../../src/app/api/v1/conversations/route';

// Создание мок-запроса
function createMockRequest(method: 'GET', path: string, query?: Record<string, string>) {
  let url = `http://localhost${path}`;
  if (query && Object.keys(query).length > 0) {
    const params = new URLSearchParams(query).toString();
    url = `${url}?${params}`;
  }

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

describe('GET /api/v1/conversations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 200 with conversations when authorized', async () => {
    // Мокируем успешную сессию
    authMock.mockResolvedValue({
      user: {
        id: 'user-1',
        email: 'test@example.com',
        roles: ['MEMBER'],
        name: 'test',
      },
      expires: new Date(Date.now() + 3600000).toISOString(),
    });

    // Мокируем сервис
    commsServiceMock.getUserConversations.mockResolvedValue({
      items: [
        {
          conversationId: 'conv-1',
          participantId: 'user-2',
          participantName: 'Иван Петров',
          participantAvatar: null,
          lastMessagePreview: 'Привет, как дела?',
          lastMessageAt: new Date('2024-01-15T10:00:00.000Z'),
          unreadCount: 2,
        },
      ],
      total: 1,
    });

    const request = createMockRequest('GET', '/api/v1/conversations');
    const response = await GET(request);

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json).toMatchObject({
      success: true,
      data: {
        items: expect.any(Array),
        total: 1,
      },
    });
  });

  it('should return 401 without auth', async () => {
    // Мокируем отсутствие сессии
    authMock.mockResolvedValue(null);

    const request = createMockRequest('GET', '/api/v1/conversations');
    const response = await GET(request);

    expect(response.status).toBe(401);
    const json = await response.json();
    expect(json).toMatchObject({
      success: false,
      error: { code: 'UNAUTHORIZED' },
    });
  });

  it('should return 401 when session has no user id', async () => {
    // Мокируем сессию без user.id
    authMock.mockResolvedValue({
      user: {
        id: null,
        email: 'test@example.com',
        roles: ['MEMBER'],
      },
      expires: new Date(Date.now() + 3600000).toISOString(),
    });

    const request = createMockRequest('GET', '/api/v1/conversations');
    const response = await GET(request);

    expect(response.status).toBe(401);
    const json = await response.json();
    expect(json).toMatchObject({
      success: false,
      error: { code: 'UNAUTHORIZED' },
    });
  });

  it('should pass query parameters to service', async () => {
    authMock.mockResolvedValue({
      user: {
        id: 'user-1',
        email: 'test@example.com',
        roles: ['MEMBER'],
        name: 'test',
      },
      expires: new Date(Date.now() + 3600000).toISOString(),
    });

    commsServiceMock.getUserConversations.mockResolvedValue({
      items: [],
      total: 0,
    });

    const request = createMockRequest('GET', '/api/v1/conversations', {
      search: 'Иван',
      limit: '10',
      page: '2',
    });
    await GET(request);

    expect(commsServiceMock.getUserConversations).toHaveBeenCalledWith('user-1', {
      search: 'Иван',
      limit: '10',
      page: '2',
    });
  });

  it('should return empty conversations list when user has no dialogs', async () => {
    authMock.mockResolvedValue({
      user: {
        id: 'user-new',
        email: 'new@example.com',
        roles: ['MEMBER'],
        name: 'new',
      },
      expires: new Date(Date.now() + 3600000).toISOString(),
    });

    commsServiceMock.getUserConversations.mockResolvedValue({
      items: [],
      total: 0,
    });

    const request = createMockRequest('GET', '/api/v1/conversations');
    const response = await GET(request);

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json).toMatchObject({
      success: true,
      data: {
        items: [],
        total: 0,
      },
    });
  });

  it('should return conversations with correct structure', async () => {
    authMock.mockResolvedValue({
      user: {
        id: 'user-1',
        email: 'test@example.com',
        roles: ['MEMBER'],
        name: 'test',
      },
      expires: new Date(Date.now() + 3600000).toISOString(),
    });

    commsServiceMock.getUserConversations.mockResolvedValue({
      items: [
        {
          conversationId: 'conv-1',
          participantId: 'user-2',
          participantName: 'Иван Петров',
          participantAvatar: '/avatars/ivan.jpg',
          lastMessagePreview: 'Привет, как дела?',
          lastMessageAt: new Date('2024-01-15T10:00:00.000Z'),
          unreadCount: 2,
        },
        {
          conversationId: 'conv-2',
          participantId: 'user-3',
          participantName: 'Мария Сидорова',
          participantAvatar: null,
          lastMessagePreview: 'Добрый день!',
          lastMessageAt: new Date('2024-01-14T08:00:00.000Z'),
          unreadCount: 0,
        },
      ],
      total: 2,
    });

    const request = createMockRequest('GET', '/api/v1/conversations');
    const response = await GET(request);

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.data.items).toHaveLength(2);
    expect(json.data.items[0]).toMatchObject({
      conversationId: 'conv-1',
      participantId: 'user-2',
      participantName: 'Иван Петров',
      unreadCount: 2,
    });
    expect(json.data.items[1]).toMatchObject({
      conversationId: 'conv-2',
      participantId: 'user-3',
      participantName: 'Мария Сидорова',
      unreadCount: 0,
    });
  });

  it('should return 400 when validation error occurs', async () => {
    authMock.mockResolvedValue({
      user: {
        id: 'user-1',
        email: 'test@example.com',
        roles: ['MEMBER'],
        name: 'test',
      },
      expires: new Date(Date.now() + 3600000).toISOString(),
    });

    // Мокируем ошибку валидации (ZodError)
    const zodError = new Error('Поисковый запрос должен содержать минимум 2 символа');
    zodError.name = 'ZodError';
    (zodError as any).code = 'VALIDATION_ERROR';
    (zodError as any).statusCode = 400;
    commsServiceMock.getUserConversations.mockRejectedValue(zodError);

    const request = createMockRequest('GET', '/api/v1/conversations', {
      search: 'И', // слишком короткий поиск
    });
    const response = await GET(request);

    expect(response.status).toBe(400);
    const json = await response.json();
    expect(json).toMatchObject({
      success: false,
      error: { code: 'VALIDATION_ERROR' },
    });
  });

  it('should return 500 on unknown error', async () => {
    authMock.mockResolvedValue({
      user: {
        id: 'user-1',
        email: 'test@example.com',
        roles: ['MEMBER'],
        name: 'test',
      },
      expires: new Date(Date.now() + 3600000).toISOString(),
    });

    commsServiceMock.getUserConversations.mockRejectedValue(
      new Error('Database connection failed')
    );

    const request = createMockRequest('GET', '/api/v1/conversations');
    const response = await GET(request);

    expect(response.status).toBe(500);
    const json = await response.json();
    expect(json).toMatchObject({
      success: false,
      error: { code: 'UNKNOWN_ERROR' },
    });
  });

  it('should pass empty query when no query params provided', async () => {
    authMock.mockResolvedValue({
      user: {
        id: 'user-1',
        email: 'test@example.com',
        roles: ['MEMBER'],
        name: 'test',
      },
      expires: new Date(Date.now() + 3600000).toISOString(),
    });

    commsServiceMock.getUserConversations.mockResolvedValue({
      items: [],
      total: 0,
    });

    const request = createMockRequest('GET', '/api/v1/conversations');
    await GET(request);

    expect(commsServiceMock.getUserConversations).toHaveBeenCalledWith('user-1', {});
  });
});
