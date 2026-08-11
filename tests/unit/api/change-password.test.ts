/**
 * @file tests/api/change-password.test.ts
 * @description API-тесты для смены пароля
 *
 * @spec
 * - PUT /api/v1/auth/password
 * - 401 при отсутствии авторизации
 * - 200 при успешной смене
 * - 401 при неверном текущем пароле
 * - 400 при совпадении паролей (новый = текущий)
 * - 422 при валидации (короткий пароль, несовпадение)
 *
 * @covers AC-9.1 — успешная смена пароля
 * @covers AC-9.2 — проверка текущего пароля
 * @covers AC-9.3 — новый пароль отличается от текущего
 * @covers AC-9.4 — валидация минимальной длины
 * @covers AC-9.5 — совпадение подтверждения пароля
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';

// ============================================================================
// Hoisted Mocks
// ============================================================================

const authMock = vi.hoisted(() => vi.fn());

const mockChangePassword = vi.hoisted(() => vi.fn());

const mockAuthService = vi.hoisted(() => ({
  changePassword: mockChangePassword,
}));

vi.mock('@/lib/auth', () => ({
  auth: authMock,
}));

vi.mock('@/di/container', () => ({
  createAuthService: () => mockAuthService,
}));

// Mock shared errors to ensure classes are properly resolved
vi.mock('@/domains/auth/auth.errors', async (importOriginal) => {
  const actual = await importOriginal();
  return actual;
});

vi.mock('@/shared/errors', async (importOriginal) => {
  const actual = await importOriginal();
  return actual;
});

// Import route AFTER mocking
import { PUT } from '@/app/api/v1/auth/password/route';
import { InvalidCurrentPasswordError, NewPasswordMatchesCurrentError } from '@/domains/auth/auth.errors';

// ============================================================================
// Helpers
// ============================================================================

function createMockRequest(method: string, path: string, body?: unknown): NextRequest {
  const url = `http://localhost${path}`;
  const headers = new Headers();
  if (body !== undefined && body !== null) {
    headers.set('Content-Type', 'application/json');
  }
  return {
    method,
    url,
    headers,
    nextUrl: new URL(url),
    json: async () => body ?? {},
    text: async () => (body ? JSON.stringify(body) : ''),
  } as unknown as NextRequest;
}

function createSession(email: string) {
  return {
    user: {
      id: 'user-1',
      email,
      roles: ['MEMBER'],
      name: email.split('@')[0],
    },
    expires: new Date(Date.now() + 3600000).toISOString(),
  };
}

// ============================================================================
// PUT /api/v1/auth/password Tests
// ============================================================================

describe('PUT /api/v1/auth/password', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('authorization', () => {
    it('should return 401 when not authenticated', async () => {
      authMock.mockResolvedValue(null);

      const request = createMockRequest('PUT', '/api/v1/auth/password', {
        currentPassword: 'old123456',
        newPassword: 'new123456',
        confirmPasswordNew: 'new123456',
      });

      const response = await PUT(request);

      expect(response.status).toBe(401);
      const json = await response.json();
      expect(json).toEqual({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Unauthorized',
        },
      });
    });

    it('should return 401 when session has no email', async () => {
      authMock.mockResolvedValue({
        user: { id: 'user-1', name: 'test' },
        expires: new Date().toISOString(),
      });

      const request = createMockRequest('PUT', '/api/v1/auth/password', {
        currentPassword: 'old123456',
        newPassword: 'new123456',
        confirmPasswordNew: 'new123456',
      });

      const response = await PUT(request);

      expect(response.status).toBe(401);
    });
  });

  describe('success', () => {
    it('should return 200 when password changed successfully', async () => {
      authMock.mockResolvedValue(createSession('test@example.com'));
      mockChangePassword.mockResolvedValue(undefined);

      const request = createMockRequest('PUT', '/api/v1/auth/password', {
        currentPassword: 'correctOldPassword',
        newPassword: 'newSecurePassword123',
        confirmPasswordNew: 'newSecurePassword123',
      });

      const response = await PUT(request);

      expect(response.status).toBe(200);
      const json = await response.json();
      expect(json).toEqual({
        success: true,
        message: 'Пароль успешно изменён',
      });

      expect(mockChangePassword).toHaveBeenCalledWith('test@example.com', expect.any(Object));
    });

    it('should call service with correct email from session', async () => {
      authMock.mockResolvedValue(createSession('user@test.org'));
      mockChangePassword.mockResolvedValue(undefined);

      const body = {
        currentPassword: 'oldPass',
        newPassword: 'newPass123',
        confirmPasswordNew: 'newPass123',
      };
      const request = createMockRequest('PUT', '/api/v1/auth/password', body);

      await PUT(request);

      expect(mockChangePassword).toHaveBeenCalledWith('user@test.org', body);
    });
  });

  describe('error - invalid current password', () => {
    it('should return 401 when current password is wrong', async () => {
      authMock.mockResolvedValue(createSession('test@example.com'));
      mockChangePassword.mockRejectedValue(new InvalidCurrentPasswordError());

      const request = createMockRequest('PUT', '/api/v1/auth/password', {
        currentPassword: 'wrongPassword',
        newPassword: 'newSecurePassword123',
        confirmPasswordNew: 'newSecurePassword123',
      });

      const response = await PUT(request);

      expect(response.status).toBe(401);
      const json = await response.json();
      expect(json.success).toBe(false);
      expect(json.error.message).toBe('Неверный текущий пароль');
    });
  });

  describe('error - new password matches current', () => {
    it('should return 400 when new password matches current', async () => {
      authMock.mockResolvedValue(createSession('test@example.com'));
      mockChangePassword.mockRejectedValue(new NewPasswordMatchesCurrentError());

      const request = createMockRequest('PUT', '/api/v1/auth/password', {
        currentPassword: 'samePassword',
        newPassword: 'samePassword',
        confirmPasswordNew: 'samePassword',
      });

      const response = await PUT(request);

      expect(response.status).toBe(400);
      const json = await response.json();
      expect(json.success).toBe(false);
      expect(json.error.message).toBe('Новый пароль не может совпадать с текущим');
    });
  });

  describe('error - validation (400 via UserInvalidDataError)', () => {
    // NOTE: The service wraps ZodError into UserInvalidDataError before it reaches
    // the API route. Therefore, validation errors return 400 (ValidationError.statusCode)
    // instead of 422, and carry the UserInvalidDataError code.

    it('should return 400 when new password is too short (wrapped as UserInvalidDataError)', async () => {
      authMock.mockResolvedValue(createSession('test@example.com'));

      // Service wraps ZodError into UserInvalidDataError
      const { UserInvalidDataError } = await import('@/domains/auth/auth.errors');
      mockChangePassword.mockRejectedValue(
        new UserInvalidDataError('Пароль должен содержать минимум 6 символов')
      );

      const request = createMockRequest('PUT', '/api/v1/auth/password', {
        currentPassword: 'validOldPassword',
        newPassword: '12345',
        confirmPasswordNew: '12345',
      });

      const response = await PUT(request);

      expect(response.status).toBe(400);
      const json = await response.json();
      expect(json.success).toBe(false);
      expect(json.error.message).toBe('Пароль должен содержать минимум 6 символов');
    });

    it('should return 400 when passwords do not match (wrapped as UserInvalidDataError)', async () => {
      authMock.mockResolvedValue(createSession('test@example.com'));

      const { UserInvalidDataError } = await import('@/domains/auth/auth.errors');
      mockChangePassword.mockRejectedValue(
        new UserInvalidDataError('Пароли не совпадают')
      );

      const request = createMockRequest('PUT', '/api/v1/auth/password', {
        currentPassword: 'validOldPassword',
        newPassword: 'newPassword123',
        confirmPasswordNew: 'differentPassword456',
      });

      const response = await PUT(request);

      expect(response.status).toBe(400);
      const json = await response.json();
      expect(json.success).toBe(false);
      expect(json.error.message).toBe('Пароли не совпадают');
    });
  });

  describe('error - internal server error', () => {
    it('should return 500 for unexpected errors', async () => {
      authMock.mockResolvedValue(createSession('test@example.com'));
      mockChangePassword.mockRejectedValue(new Error('Database connection failed'));

      const request = createMockRequest('PUT', '/api/v1/auth/password', {
        currentPassword: 'validOldPassword',
        newPassword: 'newSecurePassword123',
        confirmPasswordNew: 'newSecurePassword123',
      });

      const response = await PUT(request);

      expect(response.status).toBe(500);
      const json = await response.json();
      expect(json.success).toBe(false);
      expect(json.error.code).toBe('INTERNAL_ERROR');
      expect(json.error.message).toBe('Ошибка сервера');
    });
  });
});
