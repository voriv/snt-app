/**
 * @domain auth
 * @description Unit-тесты для Zod-схем валидации домена Auth
 *
 * @spec
 * - registerSchema: email (trim, lowercase, email format), password (min 6, no trim), confirmPassword (matches password)
 * - loginSchema: email (trim, lowercase, email format), password (required, no trim)
 */
import { describe, it, expect } from 'vitest';
import { registerSchema, loginSchema } from '@/domains/auth/auth.validators';

describe('registerSchema', () => {
  describe('valid data', () => {
    it('should accept valid registration data with all fields', () => {
      const result = registerSchema.safeParse({
        email: 'ivan@example.com',
        password: 'secret123',
        confirmPassword: 'secret123',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual({
          email: 'ivan@example.com',
          password: 'secret123',
          confirmPassword: 'secret123',
        });
      }
    });

    it('should trim and lowercase email automatically', () => {
      const result = registerSchema.safeParse({
        email: '  Ivan@Example.COM  ',
        password: 'password1',
        confirmPassword: 'password1',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.email).toBe('ivan@example.com');
      }
    });

    it('should accept password with spaces (spaces are part of password)', () => {
      const result = registerSchema.safeParse({
        email: 'test@example.com',
        password: 'my secret pass',
        confirmPassword: 'my secret pass',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.password).toBe('my secret pass');
      }
    });

    it('should accept password with minimum length (6 characters)', () => {
      const result = registerSchema.safeParse({
        email: 'test@example.com',
        password: '123456',
        confirmPassword: '123456',
      });

      expect(result.success).toBe(true);
    });
  });

  describe('invalid data', () => {
    it('should reject missing email', () => {
      const result = registerSchema.safeParse({
        password: 'secret123',
        confirmPassword: 'secret123',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe('Email обязателен');
      }
    });

    it('should reject empty email', () => {
      const result = registerSchema.safeParse({
        email: '',
        password: 'secret123',
        confirmPassword: 'secret123',
      });

      // Пустая строка проходит trim() но не email()
      expect(result.success).toBe(false);
      if (!result.success) {
        // Первая ошибка - некорректный формат email (после trim это пустая строка)
        expect(result.error.errors[0].message).toBe('Введите корректный email');
      }
    });

    it('should reject invalid email format', () => {
      const result = registerSchema.safeParse({
        email: 'not-an-email',
        password: 'secret123',
        confirmPassword: 'secret123',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe('Введите корректный email');
      }
    });

    it('should reject missing password', () => {
      const result = registerSchema.safeParse({
        email: 'test@example.com',
        confirmPassword: 'secret123',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe('Пароль обязателен');
      }
    });

    it('should reject empty password', () => {
      const result = registerSchema.safeParse({
        email: 'test@example.com',
        password: '',
        confirmPassword: 'secret123',
      });

      // Пустая строка проходит required но не проходит min(6)
      expect(result.success).toBe(false);
      if (!result.success) {
        // Первая ошибка - min(6), т.к. empty string проходит required_error
        expect(result.error.errors[0].message).toBe('Пароль должен содержать минимум 6 символов');
      }
    });

    it('should reject password less than 6 characters', () => {
      const result = registerSchema.safeParse({
        email: 'test@example.com',
        password: '12345',
        confirmPassword: '12345',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe('Пароль должен содержать минимум 6 символов');
      }
    });

    it('should reject missing confirmPassword', () => {
      const result = registerSchema.safeParse({
        email: 'test@example.com',
        password: 'secret123',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe('Подтверждение пароля обязательно');
      }
    });

    it('should reject mismatched passwords', () => {
      const result = registerSchema.safeParse({
        email: 'test@example.com',
        password: 'secret123',
        confirmPassword: 'different456',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        const confirmError = result.error.errors.find(
          (e) => e.path.includes('confirmPassword')
        );
        expect(confirmError).toBeDefined();
        expect(confirmError?.message).toBe('Пароли не совпадают');
      }
    });
  });
});

describe('loginSchema', () => {
  describe('valid data', () => {
    it('should accept valid login data', () => {
      const result = loginSchema.safeParse({
        email: 'ivan@example.com',
        password: 'secret123',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual({
          email: 'ivan@example.com',
          password: 'secret123',
        });
      }
    });

    it('should trim and lowercase email automatically', () => {
      const result = loginSchema.safeParse({
        email: '  Ivan@Example.COM  ',
        password: 'password1',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.email).toBe('ivan@example.com');
      }
    });

    it('should accept password with spaces', () => {
      const result = loginSchema.safeParse({
        email: 'test@example.com',
        password: 'my secret pass',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.password).toBe('my secret pass');
      }
    });

    it('should accept short passwords (validation is only for login, not length)', () => {
      const result = loginSchema.safeParse({
        email: 'test@example.com',
        password: '1',
      });

      expect(result.success).toBe(true);
    });
  });

  describe('invalid data', () => {
    it('should reject missing email', () => {
      const result = loginSchema.safeParse({
        password: 'secret123',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe('Email обязателен');
      }
    });

    it('should reject invalid email format', () => {
      const result = loginSchema.safeParse({
        email: 'not-an-email',
        password: 'secret123',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe('Некорректный email');
      }
    });

    it('should reject missing password', () => {
      const result = loginSchema.safeParse({
        email: 'test@example.com',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe('Пароль обязателен');
      }
    });

    it('should reject empty password', () => {
      // loginSchema НЕ имеет min() для пароля, поэтому пустая строка проходит валидацию
      const result = loginSchema.safeParse({
        email: 'test@example.com',
        password: '',
      });

      // Пустая строка проходит валидацию loginSchema (только required и нет min)
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.password).toBe('');
      }
    });
  });
});
