/**
 * @file tests/api/comms-unread-counts.test.ts
 * @description API-тесты для счётчиков непрочитанных (US-21-37)
 *
 * @spec
 * - AC-6: GET /api/v1/comms/unread-counts возвращает { messages, chats }
 * - 401 без авторизации
 * - 500 при ошибке сервиса
 *
 * @see docs/user-stories/US-21-37-счетчики-непрочитанных-на-вкладках.md
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Hoisted mock объекты
const commsServiceMock = vi.hoisted(() => ({
  getUnreadCounts: vi.fn(),
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
import { GET } from '../../src/app/api/v1/comms/unread-counts/route';

describe('GET /api/v1/comms/unread-counts (US-21-37)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // AC-6: API /api/v1/comms/unread-counts
  describe('AC-6: Загрузка счётчиков при открытии вкладки', () => {
    it('should return 200 with unread counts when authorized', async () => {
      authMock.mockResolvedValue({
        user: {
          id: 'user-1',
          email: 'test@example.com',
          roles: ['MEMBER'],
          name: 'test',
        },
        expires: new Date(Date.now() + 3600000).toISOString(),
      });

      commsServiceMock.getUnreadCounts.mockResolvedValue({
        messages: 5,
        chats: 3,
      });

      const response = await GET();

      expect(response.status).toBe(200);
      const json = await response.json();
      expect(json).toMatchObject({
        success: true,
        data: {
          messages: 5,
          chats: 3,
        },
      });
    });

    it('should return zero counts when no unread messages', async () => {
      authMock.mockResolvedValue({
        user: {
          id: 'user-1',
          email: 'test@example.com',
          roles: ['MEMBER'],
          name: 'test',
        },
        expires: new Date(Date.now() + 3600000).toISOString(),
      });

      commsServiceMock.getUnreadCounts.mockResolvedValue({
        messages: 0,
        chats: 0,
      });

      const response = await GET();

      expect(response.status).toBe(200);
      const json = await response.json();
      expect(json).toMatchObject({
        success: true,
        data: {
          messages: 0,
          chats: 0,
        },
      });
    });

    it('should call service with correct userId from session', async () => {
      authMock.mockResolvedValue({
        user: {
          id: 'user-abc',
          email: 'test@example.com',
          roles: ['MEMBER'],
          name: 'test',
        },
        expires: new Date(Date.now() + 3600000).toISOString(),
      });

      commsServiceMock.getUnreadCounts.mockResolvedValue({
        messages: 1,
        chats: 2,
      });

      await GET();

      expect(commsServiceMock.getUnreadCounts).toHaveBeenCalledWith('user-abc');
    });
  });

  // Без авторизации
  describe('Authorization', () => {
    it('should return 401 without auth', async () => {
      authMock.mockResolvedValue(null);

      const response = await GET();

      expect(response.status).toBe(401);
      const json = await response.json();
      expect(json).toMatchObject({
        success: false,
        error: { code: 'UNAUTHORIZED' },
      });
    });

    it('should return 401 when session has no user id', async () => {
      authMock.mockResolvedValue({
        user: {
          id: null,
          email: 'test@example.com',
          roles: ['MEMBER'],
        },
        expires: new Date(Date.now() + 3600000).toISOString(),
      });

      const response = await GET();

      expect(response.status).toBe(401);
      const json = await response.json();
      expect(json).toMatchObject({
        success: false,
        error: { code: 'UNAUTHORIZED' },
      });
    });
  });

  // Ошибки сервиса
  describe('Error handling', () => {
    it('should return 500 when service throws', async () => {
      authMock.mockResolvedValue({
        user: {
          id: 'user-1',
          email: 'test@example.com',
          roles: ['MEMBER'],
          name: 'test',
        },
        expires: new Date(Date.now() + 3600000).toISOString(),
      });

      commsServiceMock.getUnreadCounts.mockRejectedValue(new Error('DB error'));

      const response = await GET();

      expect(response.status).toBe(500);
      const json = await response.json();
      expect(json).toMatchObject({
        success: false,
        error: 'Не удалось загрузить счётчики',
      });
    });
  });
});
