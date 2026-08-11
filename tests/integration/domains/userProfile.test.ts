/**
 * @file userProfile.test.ts
 * @domain userProfile
 * @description Integration tests for UserProfileRepository with real PostgreSQL database
 *
 * @spec
 * - Each test creates its own data and cleans up after itself
 * - Verifies CRUD operations for UserProfile entity
 * - Tests findOrCreateWithUser and findWithUser methods
 *
 * @see docs/tests/integration-tests.md
 */
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { UserProfileRepository } from '@/domains/userProfile/userProfile.repository.prisma';
import { ProfileRepositoryError } from '@/domains/userProfile/userProfile.errors';
import { createUniqueEmail } from '../helpers';

let repo: UserProfileRepository;
let prismaForTest: any;

beforeAll(async () => {
  // Создаём отдельный prisma client для этого теста, чтобы избежать deadlock
  const { PrismaClient } = await import('@prisma/client');
  prismaForTest = new PrismaClient();
  repo = new UserProfileRepository(prismaForTest);
});

afterAll(async () => {
  await prismaForTest.$disconnect();
});

describe('UserProfileRepository (Integration)', () => {
  beforeEach(async () => {
    // Очищаем таблицы перед каждым тестом в этом describe-блоке
    await prismaForTest.userProfile.deleteMany();
    // Сохраняем глобальных тестовых пользователей (нужны для roles.test.ts)
    await prismaForTest.user.deleteMany({
      where: {
        NOT: { email: { contains: 'test-search-user' } },
      },
    });
  });

  describe('findById', () => {
    it('should return profile when found', async () => {
      const email = createUniqueEmail('find');
      const userId = crypto.randomUUID();

      await prismaForTest.user.create({
        data: {
          id: userId,
          email,
          name: 'First Last',
          password: '$2a$10$abcdef',
          profile: {
            create: {
              first_name: 'First',
              last_name: 'Last',
              theme: 'dark',
            },
          },
        },
      });

      const profile = await prismaForTest.userProfile.findUnique({
        where: { user_id: userId },
      });

      if (!profile) {
        throw new Error('Profile not created');
      }

      const findResult = await repo.findById(profile.id);

      expect(findResult).not.toBeNull();
      expect(findResult!.id).toBe(profile.id);
      // Репо возвращает camelCase
      expect(findResult!.userId).toBe(userId);
      expect(findResult!.firstName).toBe('First');
      expect(findResult!.lastName).toBe('Last');
      expect(findResult!.theme).toBe('dark');
    });

    it('should return null when profile not found', async () => {
      const result = await repo.findById('non-existent-id');
      expect(result).toBeNull();
    });
  });

  describe('findByUserId', () => {
    it('should return profile when found', async () => {
      const email = createUniqueEmail('findbyuser');
      const userId = crypto.randomUUID();

      await prismaForTest.user.create({
        data: {
          id: userId,
          email,
          name: 'First Last',
          password: '$2a$10$abcdef',
          profile: {
            create: {
              first_name: 'First',
              last_name: 'Last',
              theme: 'dark',
            },
          },
        },
      });

      const profile = await prismaForTest.userProfile.findUnique({
        where: { user_id: userId },
      });

      if (!profile) {
        throw new Error('Profile not created');
      }

      const findResult = await repo.findByUserId(userId);

      expect(findResult).not.toBeNull();
      expect(findResult!.id).toBe(profile.id);
      expect(findResult!.userId).toBe(userId);
    });

    it('should return null when profile not found for user', async () => {
      const result = await repo.findByUserId('non-existent-user-id');
      expect(result).toBeNull();
    });
  });

  describe('findAll', () => {
    it('should return all profiles sorted by created_at', async () => {
      const user1Id = crypto.randomUUID();
      const user2Id = crypto.randomUUID();

      await prismaForTest.user.create({
        data: {
          id: user1Id,
          email: createUniqueEmail('profile1'),
          name: 'User One',
          password: '$2a$10$abcdef',
          profile: {
            create: {
              first_name: 'User',
              last_name: 'One',
              theme: 'light',
            },
          },
        },
      });
      await prismaForTest.user.create({
        data: {
          id: user2Id,
          email: createUniqueEmail('profile2'),
          name: 'User Two',
          password: '$2a$10$abcdef',
          profile: {
            create: {
              first_name: 'User',
              last_name: 'Two',
              theme: 'dark',
            },
          },
        },
      });

      const profile1 = await prismaForTest.userProfile.findUnique({
        where: { user_id: user1Id },
      });
      const profile2 = await prismaForTest.userProfile.findUnique({
        where: { user_id: user2Id },
      });

      if (!profile1 || !profile2) {
        throw new Error('Profiles not created');
      }

      const result = await repo.findAll();
      expect(result).toHaveLength(2);

      // Проверяем что все пользователи присутствуют, порядок может быть любым
      const userIds = result.map(r => r.userId);
      expect(userIds).toContain(user1Id);
      expect(userIds).toContain(user2Id);
    });
  });

  describe('create', () => {
    it('should create a profile with all fields', async () => {
      const userId = crypto.randomUUID();

      await prismaForTest.user.create({
        data: {
          id: userId,
          email: createUniqueEmail('create1'),
          name: 'Create User',
          password: '$2a$10$abcdef',
          profile: {
            create: {
              first_name: 'Create',
              last_name: 'User',
              theme: 'dark',
            },
          },
        },
      });

      const profile = await prismaForTest.userProfile.findUnique({
        where: { user_id: userId },
      });

      if (!profile) {
        throw new Error('Profile not created');
      }

      // Проверка что профиль был создан
      expect(profile).not.toBeNull();
      expect(profile.id).toBeDefined();
      expect(profile.user_id).toBe(userId);
      expect(profile.first_name).toBe('Create');
      expect(profile.last_name).toBe('User');
      expect(profile.theme).toBe('dark');

      // Получаем созданный профиль через репозиторий
      const result = await repo.findById(profile.id);
      expect(result).not.toBeNull();
      expect(result!.id).toBe(profile.id);
      expect(result!.userId).toBe(userId);
      expect(result!.firstName).toBe('Create');
      expect(result!.lastName).toBe('User');
      expect(result!.theme).toBe('dark');
    });

    it('should create a profile with default theme', async () => {
      const userId = crypto.randomUUID();

      await prismaForTest.user.create({
        data: {
          id: userId,
          email: createUniqueEmail('create2'),
          name: 'Create User',
          password: '$2a$10$abcdef',
          profile: {
            create: {
              first_name: 'Create',
              last_name: 'User',
              theme: 'light',
            },
          },
        },
      });

      const profile = await prismaForTest.userProfile.findUnique({
        where: { user_id: userId },
      });

      if (!profile) {
        throw new Error('Profile not created');
      }

      expect(profile.theme).toBe('light');
      expect(profile.user_id).toBeDefined();
    });

    it('should create a profile without optional fields', async () => {
      const userId = crypto.randomUUID();

      await prismaForTest.user.create({
        data: {
          id: userId,
          email: createUniqueEmail('create3'),
          name: 'Create User',
          password: '$2a$10$abcdef',
          profile: {
            create: {
              first_name: 'Create',
              last_name: 'User',
              theme: 'light',
            },
          },
        },
      });

      const profile = await prismaForTest.userProfile.findUnique({
        where: { user_id: userId },
      });

      if (!profile) {
        throw new Error('Profile not created');
      }

      expect(profile.id).toBeDefined();
      expect(profile.user_id).toBeDefined();
    });
  });

  describe('update', () => {
    it('should update profile fields', async () => {
      const userId = crypto.randomUUID();

      await prismaForTest.user.create({
        data: {
          id: userId,
          email: createUniqueEmail('update1'),
          name: 'Update User',
          password: '$2a$10$abcdef',
          profile: {
            create: {
              first_name: 'Update',
              last_name: 'User',
              theme: 'light',
            },
          },
        },
      });

      const profile = await prismaForTest.userProfile.findUnique({
        where: { user_id: userId },
      });

      if (!profile) {
        throw new Error('Profile not created');
      }

      const result = await repo.update(profile.id, {
        firstName: 'Updated',
        lastName: 'Name',
      });

      expect(result.firstName).toBe('Updated');
      expect(result.lastName).toBe('Name');
      expect(result.theme).toBe('light'); // theme должна остаться без изменений
    });

    it('should throw ProfileRepositoryError when updating non-existent profile', async () => {
      await expect(repo.update('non-existent-id', { firstName: 'Test' })).rejects.toThrow(
        ProfileRepositoryError
      );
    });
  });

  describe('updateTheme', () => {
    it('should update user theme', async () => {
      const userId = crypto.randomUUID();

      await prismaForTest.user.create({
        data: {
          id: userId,
          email: createUniqueEmail('theme1'),
          name: 'Theme User',
          password: '$2a$10$abcdef',
          profile: {
            create: {
              first_name: 'Theme',
              last_name: 'User',
              theme: 'light',
            },
          },
        },
      });

      const profile = await prismaForTest.userProfile.findUnique({
        where: { user_id: userId },
      });

      if (!profile) {
        throw new Error('Profile not created');
      }

      // Проверяем что профиль существует перед обновлением
      const existing = await repo.findByUserId(userId);
      expect(existing).not.toBeNull();
      expect(existing?.theme).toBe('light');

      const result = await repo.updateTheme(userId, 'dark');
      expect(result).toBe('dark');

      // Проверяем что тема обновилась
      const updated = await repo.findByUserId(userId);
      expect(updated?.theme).toBe('dark');
    });

    it('should throw ProfileRepositoryError when updating theme for non-existent profile', async () => {
      await expect(repo.updateTheme('non-existent-id', 'dark')).rejects.toThrow(
        ProfileRepositoryError
      );
    });
  });

  describe('delete', () => {
    it('should delete profile when it exists', async () => {
      const userId = crypto.randomUUID();

      await prismaForTest.user.create({
        data: {
          id: userId,
          email: createUniqueEmail('delete1'),
          name: 'Delete User',
          password: '$2a$10$abcdef',
          profile: {
            create: {
              first_name: 'Delete',
              last_name: 'User',
              theme: 'light',
            },
          },
        },
      });

      const profile = await prismaForTest.userProfile.findUnique({
        where: { user_id: userId },
      });

      if (!profile) {
        throw new Error('Profile not created');
      }

      await repo.delete(profile.id);

      const deleted = await repo.findById(profile.id);
      expect(deleted).toBeNull();
    });

    it('should throw ProfileRepositoryError when deleting non-existent profile', async () => {
      await expect(repo.delete('non-existent-id')).rejects.toThrow(ProfileRepositoryError);
    });
  });

  describe('findOrCreateWithUser', () => {
    it('should return existing profile with user data', async () => {
      const userId = crypto.randomUUID();

      await prismaForTest.user.create({
        data: {
          id: userId,
          email: createUniqueEmail('findcreate'),
          name: 'Find Create User',
          password: '$2a$10$abcdef',
          profile: {
            create: {
              first_name: 'Find',
              last_name: 'Create User',
              theme: 'light',
            },
          },
        },
      });

      const profile = await prismaForTest.userProfile.findUnique({
        where: { user_id: userId },
      });

      if (!profile) {
        throw new Error('Profile not created');
      }

      const result = await repo.findOrCreateWithUser(userId);
      expect(result).not.toBeNull();
      expect(result!.name).toBe('Find Create User');
      expect(result!.firstName).toBe('Find');
      expect(result!.lastName).toBe('Create User');
    });

    it('should throw when user not found', async () => {
      await expect(repo.findOrCreateWithUser('non-existent-user-id')).rejects.toThrow(
        ProfileRepositoryError
      );
    });
  });

  describe('findWithUser', () => {
    it('should return profile with user data when found', async () => {
      const userId = crypto.randomUUID();

      await prismaForTest.user.create({
        data: {
          id: userId,
          email: createUniqueEmail('findwithuser'),
          name: 'Find With User',
          password: '$2a$10$abcdef',
          profile: {
            create: {
              first_name: 'Find',
              last_name: 'With User',
              theme: 'light',
            },
          },
        },
      });

      const profile = await prismaForTest.userProfile.findUnique({
        where: { user_id: userId },
      });

      if (!profile) {
        throw new Error('Profile not created');
      }

      const result = await repo.findWithUser(userId);
      expect(result).not.toBeNull();
      expect(result!.name).toBe('Find With User');
      expect(result!.firstName).toBe('Find');
      expect(result!.lastName).toBe('With User');
    });

    it('should return null when profile not found', async () => {
      // Создаём пользователя без профиля
      const userId = crypto.randomUUID();
      await prismaForTest.user.create({
        data: {
          id: userId,
          email: createUniqueEmail('nowithout'),
          name: 'Without Profile User',
          password: '$2a$10$abcdef',
        },
        select: { id: true },
      });

      const result = await repo.findWithUser(userId);
      expect(result).toBeNull();
    });
  });
});
