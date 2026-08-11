/**
 * @domain auth
 * @description Unit-тесты для AuthService.changePassword()
 *
 * @spec
 * - Успешная смена пароля
 * - Отклонение при неверном текущем пароле → InvalidCurrentPasswordError
 * - Отклонение когда новый = текущий → NewPasswordMatchesCurrentError
 * - Отклонение при коротком пароле (<6) → UserInvalidDataError (ZodError обёртка)
 * - Отклонение при несовпадении паролей → UserInvalidDataError (ZodError обёртка)
 * - Отклонение при отсутствии пользователя → UserInvalidDataError
 *
 * @covers AC-9.1 — успешная смена пароля
 * @covers AC-9.2 — проверка текущего пароля
 * @covers AC-9.3 — новый пароль отличается от текущего
 * @covers AC-9.4 — клиентская валидация (min 6)
 * @covers AC-9.5 — совпадение newPassword и confirmPasswordNew
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';

// ============================================================================
// Mocks — hoisted to top of file to avoid hoisting issues with vi.mock
// ============================================================================

const bcryptMock = vi.hoisted(() => ({
  mockHash: vi.fn(),
  mockCompare: vi.fn(),
}));

vi.mock('bcryptjs', () => ({
  default: {
    hash: bcryptMock.mockHash,
    compare: bcryptMock.mockCompare,
  },
}));

import type { IAuthRepository } from '@/domains/auth/auth.repository.interface';
import type { UserWithPassword } from '@/domains/auth/auth.types';
import { AuthService } from '@/domains/auth/auth.service';
import {
  InvalidCurrentPasswordError,
  NewPasswordMatchesCurrentError,
  UserInvalidDataError,
} from '@/domains/auth/auth.errors';

// ============================================================================
// Helpers
// ============================================================================

function createMockUserWithPassword(overrides?: Partial<UserWithPassword>): UserWithPassword {
  return {
    id: 'usr_123',
    email: 'test@example.com',
    name: 'Test User',
    passwordHash: '$2a$10$oldHash...',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-02'),
    ...overrides,
  };
}

// ============================================================================
// AuthService.changePassword Tests
// ============================================================================

describe('AuthService.changePassword', () => {
  let service: AuthService;
  let mockFindByEmailWithPassword: ReturnType<typeof vi.fn>;
  let mockUpdatePassword: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();

    // Сбрасываем bcrypt моки
    bcryptMock.mockHash.mockReset().mockImplementation((_password: string, _saltRounds: number) =>
      Promise.resolve('new_hashed_password')
    );
    bcryptMock.mockCompare.mockReset().mockResolvedValue(true);

    mockFindByEmailWithPassword = vi.fn();
    mockUpdatePassword = vi.fn();

    const mockRepo: IAuthRepository = {
      findByEmail: vi.fn(),
      findByEmailWithPassword: mockFindByEmailWithPassword,
      create: vi.fn(),
      updatePassword: mockUpdatePassword,
    };

    service = new AuthService(mockRepo);
  });

  describe('successful password change', () => {
    it('should successfully change password with valid data', async () => {
      const userData = createMockUserWithPassword();
      mockFindByEmailWithPassword.mockResolvedValueOnce(userData);
      mockUpdatePassword.mockResolvedValueOnce(undefined);

      // bcrypt.compare для текущего пароля → true (верный)
      bcryptMock.mockCompare.mockResolvedValueOnce(true);
      // bcrypt.compare для нового пароля → false (отличается от текущего)
      bcryptMock.mockCompare.mockResolvedValueOnce(false);

      const data = {
        currentPassword: 'correctOldPassword',
        newPassword: 'newSecurePassword123',
        confirmPasswordNew: 'newSecurePassword123',
      };

      await service.changePassword('test@example.com', data);

      // Проверяем что репозиторий был вызван
      expect(mockFindByEmailWithPassword).toHaveBeenCalledWith('test@example.com');
      expect(mockUpdatePassword).toHaveBeenCalledWith('usr_123', 'new_hashed_password');

      // Проверяем что bcrypt.hash был вызван с новым паролем
      expect(bcryptMock.mockHash).toHaveBeenCalledWith('newSecurePassword123', 10);
    });

    it('should return void on success', async () => {
      const userData = createMockUserWithPassword();
      mockFindByEmailWithPassword.mockResolvedValueOnce(userData);
      mockUpdatePassword.mockResolvedValueOnce(undefined);

      bcryptMock.mockCompare.mockResolvedValueOnce(true);
      bcryptMock.mockCompare.mockResolvedValueOnce(false);

      const data = {
        currentPassword: 'correctOldPassword',
        newPassword: 'newSecurePassword123',
        confirmPasswordNew: 'newSecurePassword123',
      };

      const result = await service.changePassword('test@example.com', data);
      expect(result).toBeUndefined();
    });
  });

  describe('invalid current password', () => {
    it('should throw InvalidCurrentPasswordError when current password is wrong', async () => {
      const userData = createMockUserWithPassword();
      mockFindByEmailWithPassword.mockResolvedValueOnce(userData);

      // bcrypt.compare для текущего пароля → false (неверный)
      bcryptMock.mockCompare.mockResolvedValueOnce(false);

      const data = {
        currentPassword: 'wrongPassword',
        newPassword: 'newSecurePassword123',
        confirmPasswordNew: 'newSecurePassword123',
      };

      try {
        await service.changePassword('test@example.com', data);
        expect.unreachable('should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(InvalidCurrentPasswordError);
        expect((error as Error).message).toBe('Неверный текущий пароль');
      }

      // updatePassword не должен быть вызван
      expect(mockUpdatePassword).not.toHaveBeenCalled();
      expect(bcryptMock.mockHash).not.toHaveBeenCalled();
    });
  });

  describe('new password matches current', () => {
    it('should throw NewPasswordMatchesCurrentError when new password equals current', async () => {
      const userData = createMockUserWithPassword();
      mockFindByEmailWithPassword.mockResolvedValueOnce(userData);

      // bcrypt.compare для текущего пароля → true (верный)
      bcryptMock.mockCompare.mockResolvedValueOnce(true);
      // bcrypt.compare для нового пароля → true (совпадает с текущим!)
      bcryptMock.mockCompare.mockResolvedValueOnce(true);

      const data = {
        currentPassword: 'samePassword',
        newPassword: 'samePassword',
        confirmPasswordNew: 'samePassword',
      };

      try {
        await service.changePassword('test@example.com', data);
        expect.unreachable('should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(NewPasswordMatchesCurrentError);
        expect((error as Error).message).toBe('Новый пароль не может совпадать с текущим');
      }

      expect(mockUpdatePassword).not.toHaveBeenCalled();
    });
  });

  describe('validation errors (Zod)', () => {
    it('should throw UserInvalidDataError for password less than 6 characters', async () => {
      const data = {
        currentPassword: 'validPassword',
        newPassword: '12345', // только 5 символов
        confirmPasswordNew: '12345',
      };

      await expect(
        service.changePassword('test@example.com', data)
      ).rejects.toThrow(UserInvalidDataError);

      // findByEmailWithPassword не должен быть вызван — валидация на первом шаге
      expect(mockFindByEmailWithPassword).not.toHaveBeenCalled();
      expect(mockUpdatePassword).not.toHaveBeenCalled();
    });

    it('should throw UserInvalidDataError for empty new password', async () => {
      const data = {
        currentPassword: 'validPassword',
        newPassword: '',
        confirmPasswordNew: '',
      };

      await expect(
        service.changePassword('test@example.com', data)
      ).rejects.toThrow(UserInvalidDataError);

      expect(mockFindByEmailWithPassword).not.toHaveBeenCalled();
    });

    it('should throw UserInvalidDataError when passwords do not match', async () => {
      const data = {
        currentPassword: 'validPassword',
        newPassword: 'newPassword123',
        confirmPasswordNew: 'differentPassword456',
      };

      await expect(
        service.changePassword('test@example.com', data)
      ).rejects.toThrow(UserInvalidDataError);

      expect(mockFindByEmailWithPassword).not.toHaveBeenCalled();
    });

    it('should throw UserInvalidDataError for missing currentPassword', async () => {
      const data = {
        newPassword: 'newPassword123',
        confirmPasswordNew: 'newPassword123',
      };

      await expect(
        service.changePassword('test@example.com', data)
      ).rejects.toThrow(UserInvalidDataError);

      expect(mockFindByEmailWithPassword).not.toHaveBeenCalled();
    });

    it('should throw UserInvalidDataError for missing newPassword', async () => {
      const data = {
        currentPassword: 'validPassword',
        confirmPasswordNew: 'newPassword123',
      };

      await expect(
        service.changePassword('test@example.com', data)
      ).rejects.toThrow(UserInvalidDataError);

      expect(mockFindByEmailWithPassword).not.toHaveBeenCalled();
    });

    it('should throw UserInvalidDataError for missing confirmPasswordNew', async () => {
      const data = {
        currentPassword: 'validPassword',
        newPassword: 'newPassword123',
      };

      await expect(
        service.changePassword('test@example.com', data)
      ).rejects.toThrow(UserInvalidDataError);

      expect(mockFindByEmailWithPassword).not.toHaveBeenCalled();
    });
  });

  describe('user not found', () => {
    it('should throw UserInvalidDataError when user does not exist', async () => {
      mockFindByEmailWithPassword.mockResolvedValueOnce(null);

      const data = {
        currentPassword: 'anyPassword',
        newPassword: 'newSecurePassword123',
        confirmPasswordNew: 'newSecurePassword123',
      };

      try {
        await service.changePassword('nonexistent@example.com', data);
        expect.unreachable('should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(UserInvalidDataError);
        expect((error as Error).message).toBe('Пользователь не найден');
      }

      expect(mockUpdatePassword).not.toHaveBeenCalled();
    });
  });

  describe('boundary cases', () => {
    it('should accept new password with exactly 6 characters (minimum)', async () => {
      const userData = createMockUserWithPassword();
      mockFindByEmailWithPassword.mockResolvedValueOnce(userData);
      mockUpdatePassword.mockResolvedValueOnce(undefined);

      bcryptMock.mockCompare.mockResolvedValueOnce(true);
      bcryptMock.mockCompare.mockResolvedValueOnce(false);

      const data = {
        currentPassword: 'correctOldPassword',
        newPassword: '123456', // ровно 6 символов
        confirmPasswordNew: '123456',
      };

      await service.changePassword('test@example.com', data);

      expect(mockUpdatePassword).toHaveBeenCalled();
    });

    it('should accept password with spaces (spaces are part of password)', async () => {
      const userData = createMockUserWithPassword();
      mockFindByEmailWithPassword.mockResolvedValueOnce(userData);
      mockUpdatePassword.mockResolvedValueOnce(undefined);

      bcryptMock.mockCompare.mockResolvedValueOnce(true);
      bcryptMock.mockCompare.mockResolvedValueOnce(false);

      const data = {
        currentPassword: 'my old password',
        newPassword: 'my new password with spaces',
        confirmPasswordNew: 'my new password with spaces',
      };

      await service.changePassword('test@example.com', data);

      expect(mockUpdatePassword).toHaveBeenCalled();
      expect(bcryptMock.mockHash).toHaveBeenCalledWith('my new password with spaces', 10);
    });
  });
});
