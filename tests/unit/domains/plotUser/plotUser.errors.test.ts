/**
 * Тесты для ошибок домена PlotUser
 */
import { describe, it, expect } from 'vitest';
import {
  PlotUserRoleNotFoundError,
  PlotUserRoleDuplicateError,
  PlotUserRoleInvalidDataError,
} from '@/domains/plotUser/plotUser.errors';
import { NotFoundError, ConflictError, ValidationError } from '@/shared/errors';

describe('PlotUser Domain Errors', () => {
  describe('PlotUserRoleNotFoundError', () => {
    it('should extend NotFoundError', () => {
      const error = new PlotUserRoleNotFoundError('Test message');
      expect(error).toBeInstanceOf(NotFoundError);
      expect(error).toBeInstanceOf(PlotUserRoleNotFoundError);
    });

    it('should have correct error code', () => {
      const error = new PlotUserRoleNotFoundError('User not found');
      expect(error.code).toBe('NOT_FOUND');
    });

    it('should have correct HTTP status code', () => {
      const error = new PlotUserRoleNotFoundError('Plot not found');
      expect(error.statusCode).toBe(404);
    });

    it('should have custom message', () => {
      const message = 'Пользователь с ID \'abc123\' не найден';
      const error = new PlotUserRoleNotFoundError(message);
      // BaseNotFoundError добавляет префикс "Record with id" и суффикс " not found"
      expect(error.message).toBe(`Record with id ${message} not found`);
    });

    it('should have correct message format with id', () => {
      const userId = 'abc123';
      const message = `Пользователь с ID '${userId}' не найден`;
      const error = new PlotUserRoleNotFoundError(message);
      // BaseNotFoundError добавляет префикс "Record with id" и суффикс " not found"
      expect(error.message).toBe(`Record with id ${message} not found`);
    });
  });

  describe('PlotUserRoleDuplicateError', () => {
    it('should extend ConflictError', () => {
      const error = new PlotUserRoleDuplicateError();
      expect(error).toBeInstanceOf(ConflictError);
      expect(error).toBeInstanceOf(PlotUserRoleDuplicateError);
    });

    it('should have correct error code', () => {
      const error = new PlotUserRoleDuplicateError();
      // ConflictError использует 'CONFLICT_ERROR' как код ошибки
      expect(error.code).toBe('CONFLICT_ERROR');
    });

    it('should have correct HTTP status code', () => {
      const error = new PlotUserRoleDuplicateError();
      expect(error.statusCode).toBe(409);
    });

    it('should have default message', () => {
      const error = new PlotUserRoleDuplicateError();
      expect(error.message).toBe(
        'Для этого пользователя и участка уже существует активная связь'
      );
    });

    it('should have custom message', () => {
      const message = 'У пользователя \'abc123\' уже существует активная связь с участком \'xyz789\' с ролью 1';
      const error = new PlotUserRoleDuplicateError(message);
      expect(error.message).toBe(message);
    });
  });

  describe('PlotUserRoleInvalidDataError', () => {
    it('should extend ValidationError', () => {
      const error = new PlotUserRoleInvalidDataError('Test message');
      expect(error).toBeInstanceOf(ValidationError);
      expect(error).toBeInstanceOf(PlotUserRoleInvalidDataError);
    });

    it('should have correct error code', () => {
      const error = new PlotUserRoleInvalidDataError('Invalid email');
      expect(error.code).toBe('VALIDATION_ERROR');
    });

    it('should have correct HTTP status code', () => {
      const error = new PlotUserRoleInvalidDataError('Invalid data');
      expect(error.statusCode).toBe(400);
    });

    it('should have custom message', () => {
      const message = 'Дата истечения должна быть больше текущего времени';
      const error = new PlotUserRoleInvalidDataError(message);
      expect(error.message).toBe(message);
    });
  });
});
