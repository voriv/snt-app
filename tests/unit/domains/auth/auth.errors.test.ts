/**
 * @domain auth
 * @description Unit-тесты для классов ошибок домена Auth
 *
 * @spec
 * - Каждый класс ошибок наследуется от правильного базового класса
 * - HTTP статус-коды соответствуют семантике ошибок
 * - Сообщения содержат корректные детали
 */
import { describe, it, expect } from 'vitest';
import { UserDuplicateError, UserInvalidDataError, InvalidCredentialsError } from '@/domains/auth/auth.errors';
import { ConflictError } from '@/shared/errors/ConflictError';
import { ValidationError } from '@/shared/errors/ValidationError';
import { UnauthorizedError } from '@/shared/errors/UnauthorizedError';

describe('Auth Domain Errors', () => {
  describe('UserDuplicateError', () => {
    it('should extend ConflictError', () => {
      const error = new UserDuplicateError('test@example.com');
      expect(error).toBeInstanceOf(ConflictError);
      expect(error).toBeInstanceOf(UserDuplicateError);
    });

    it('should have correct error code', () => {
      const error = new UserDuplicateError('test@example.com');
      // Наследует код от ConflictError
      expect(error.code).toBe('CONFLICT_ERROR');
    });

    it('should have correct HTTP status code', () => {
      const error = new UserDuplicateError('test@example.com');
      expect(error.statusCode).toBe(409);
    });

    it('should have message with email', () => {
      const email = 'ivan@example.com';
      const error = new UserDuplicateError(email);
      expect(error.message).toContain(email);
      expect(error.message).toContain('уже зарегистрирован');
    });
  });

  describe('UserInvalidDataError', () => {
    it('should extend ValidationError', () => {
      const error = new UserInvalidDataError('Неверные данные');
      expect(error).toBeInstanceOf(ValidationError);
      expect(error).toBeInstanceOf(UserInvalidDataError);
    });

    it('should have correct error code', () => {
      const error = new UserInvalidDataError('Неверные данные');
      // Наследует код от ValidationError
      expect(error.code).toBe('VALIDATION_ERROR');
    });

    it('should have correct HTTP status code', () => {
      const error = new UserInvalidDataError('Неверные данные');
      expect(error.statusCode).toBe(400);
    });

    it('should preserve custom message', () => {
      const message = 'Email должен быть валидным';
      const error = new UserInvalidDataError(message);
      expect(error.message).toBe(message);
    });
  });

  describe('InvalidCredentialsError', () => {
    it('should extend UnauthorizedError', () => {
      const error = new InvalidCredentialsError();
      expect(error).toBeInstanceOf(UnauthorizedError);
      expect(error).toBeInstanceOf(InvalidCredentialsError);
    });

    it('should have correct error code', () => {
      const error = new InvalidCredentialsError();
      // Наследует код от UnauthorizedError
      expect(error.code).toBe('UNAUTHORIZED');
    });

    it('should have correct HTTP status code', () => {
      const error = new InvalidCredentialsError();
      expect(error.statusCode).toBe(401);
    });

    it('should have generic message (security requirement)', () => {
      const error = new InvalidCredentialsError();
      expect(error.message).toBe('Неверный email или пароль');
      // Сообщение не должно раскрывать, что именно неверно (BR-3 из US-3)
      expect(error.message).not.toContain('email не найден');
      expect(error.message).not.toContain('пароль неверный');
    });
  });
});
