/**
 * @file auth.test.ts
 * @description Интеграционные тесты для AuthRepository
 * Проверяют прямое взаимодействие с БД через Prisma
 *
 * @spec
 * - beforeEach создаёт тестовые данные
 * - afterEach очищает все тестовые данные через deleteMany()
 * - Проверяет авторизацию пользователей через email
 * - Тестирует валидацию паролей
 * - Тестирует поиск пользователей
 *
 * @see docs/tests/integration-tests.md
 */

import { describe, it, expect, beforeEach, afterEach, afterAll } from 'vitest';
import bcrypt from 'bcryptjs';
import { AuthRepository } from '@/domains/auth/auth.repository.prisma';
import { createUniqueEmail } from '../helpers';
import { prisma } from '../setup';

describe('AuthRepository (Integration)', () => {
  let repo: AuthRepository;

  beforeEach(async () => {
    repo = new AuthRepository();
  });

  afterEach(async () => {
    // Полная очистка БД после каждого теста для изоляции
    // Порядок важен из-за FK constraints: сначала зависимые таблицы, потом родительские
    await prisma.plotUserRoleHistory.deleteMany();
    await prisma.plotUserRole.deleteMany();
    await prisma.userRole.deleteMany();
    await prisma.userProfile.deleteMany();
    await prisma.plot.deleteMany();
    await prisma.user.deleteMany();
  });

  describe('findByEmail', () => {
    it('should return user data when found', async () => {
      const email = createUniqueEmail('find');
      await prisma.user.create({
        data: {
          email,
          name: 'Test User',
          password: '$2a$10$test',
        },
      });

      const result = await repo.findByEmail(email);

      expect(result).not.toBeNull();
      expect(result!.email).toBe(email);
      expect(result!.name).toBe('Test User');
    });

    it('should return null when user not found', async () => {
      const result = await repo.findByEmail('non-existent@example.com');
      expect(result).toBeNull();
    });

    it('should be case-sensitive for email lookup', async () => {
      const email = createUniqueEmail('case');
      await prisma.user.create({
        data: {
          email,
          name: 'Test User',
          password: '$2a$10$test',
        },
      });

      const result = await repo.findByEmail(email.toUpperCase());
      expect(result).toBeNull();
    });
  });

  describe('findByEmailWithPassword', () => {
    it('should return user with password hash when found', async () => {
      const email = createUniqueEmail('password');
      const password = 'test-password-' + Date.now();
      const bcryptHash = await bcrypt.hash(password, 10);

      await prisma.user.create({
        data: {
          email,
          name: 'Test Password User',
          password: bcryptHash,
        },
      });

      const result = await repo.findByEmailWithPassword(email);

      expect(result).not.toBeNull();
      expect(result!.email).toBe(email);
      expect(result!.name).toBe('Test Password User');
      expect(result!.passwordHash).toBe(bcryptHash);
    });

    it('should return null when user not found', async () => {
      const result = await repo.findByEmailWithPassword('non-existent@example.com');
      expect(result).toBeNull();
    });
  });
});

afterAll(async () => {
  // Очистка тестовых данных после завершения файла
  await prisma.userRole.deleteMany();
  await prisma.userProfile.deleteMany();
  await prisma.user.deleteMany();
  await prisma.$disconnect();
});
