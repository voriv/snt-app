/**
 * @file userProfile.repository.test.ts
 * @domain userProfile
 * @description Unit-тесты для UserProfileRepository
 *
 * @spec
 * - findById: находит профиль по ID или возвращает null
 * - findByUserId: находит профиль по userId или возвращает null
 * - findAll: возвращает все профили
 * - create: создаёт новый профиль
 * - update: обновляет профиль
 * - delete: удаляет профиль
 * - findWithUser: находит профиль с данными пользователя
 * - findOrCreateWithUser: находит или создаёт профиль с данными пользователя
 * - updateTheme: обновляет тему профиля
 *
 * @note Примечание: Эти тесты требуют подключения к реальной базе данных.
 * Для изолированных unit-тестов используйте моки репозитория в тестах сервиса.
 *
 * @see tests/unit/domains/plot/plot.service.test.ts — пример тестов с моками
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { UserProfileRepository } from '@/domains/userProfile/userProfile.repository.prisma';
import type {
  UserProfileData,
  CreateUserProfileInput,
  UpdateUserProfileInput,
  UserProfileFull,
  Theme,
} from '@/domains/userProfile/userProfile.types';
import { ProfileRepositoryError } from '@/domains/userProfile/userProfile.errors';
import { prisma } from '@/infrastructure/prisma/client';

// ============================================================================
// Mocks
// ============================================================================

vi.mock('@/infrastructure/prisma/client', () => ({
  prisma: {
    userProfile: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      findFirst: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
    },
  },
}));

// ============================================================================
// Helpers
// ============================================================================

function createMockUserProfile(overrides?: Partial<UserProfileData>): UserProfileData {
  return {
    id: 'profile-123',
    userId: 'user-123',
    firstName: 'Иван',
    middleName: 'Петрович',
    lastName: 'Петров',
    phone: '+79991234567',
    avatar: '/avatars/user-123.jpg',
    bio: 'Тестовая биография',
    theme: 'light',
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z'),
    ...overrides,
  };
}

function createMockUserProfileFull(overrides?: Partial<UserProfileFull>): UserProfileFull {
  return {
    id: 'profile-123',
    userId: 'user-123',
    email: 'ivan@example.com',
    name: 'Иван Петров',
    roles: ['member'],
    firstName: 'Иван',
    middleName: 'Петрович',
    lastName: 'Петров',
    phone: '+79991234567',
    avatar: '/avatars/user-123.jpg',
    bio: 'Тестовая биография',
    theme: 'light',
    userCreatedAt: new Date('2024-01-01T00:00:00Z'),
    userUpdatedAt: new Date('2024-01-01T00:00:00Z'),
    profileCreatedAt: new Date('2024-01-01T00:00:00Z'),
    profileUpdatedAt: new Date('2024-01-01T00:00:00Z'),
    ...overrides,
  };
}

// ============================================================================
// UserProfileRepository Tests
// ============================================================================

describe('UserProfileRepository', () => {
  let repository: UserProfileRepository;

  beforeEach(() => {
    vi.clearAllMocks();
    repository = new UserProfileRepository();
  });

  // ==========================================================================
  // findById Tests
  // ==========================================================================

  describe('findById', () => {
    it('should return profile when found', async () => {
      const mockPrismaProfile = {
        id: 'profile-123',
        user_id: 'user-123',
        first_name: 'Иван',
        middle_name: 'Петрович',
        last_name: 'Петров',
        phone: '+79991234567',
        avatar: '/avatars/user-123.jpg',
        bio: 'Тестовая биография',
        theme: 'light',
        created_at: new Date('2024-01-01T00:00:00Z'),
        updated_at: new Date('2024-01-01T00:00:00Z'),
      };
      (prisma.userProfile.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(mockPrismaProfile);

      const result = await repository.findById('profile-123');
      const expectedProfile = createMockUserProfile();

      expect(result).toEqual(expectedProfile);
      expect(prisma.userProfile.findUnique).toHaveBeenCalledWith({
        where: { id: 'profile-123' },
      });
    });

    it('should return null when profile not found', async () => {
      (prisma.userProfile.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(null);

      const result = await repository.findById('non-existent-id');

      expect(result).toBeNull();
      expect(prisma.userProfile.findUnique).toHaveBeenCalledWith({
        where: { id: 'non-existent-id' },
      });
    });
  });

  // ==========================================================================
  // findByUserId Tests
  // ==========================================================================

  describe('findByUserId', () => {
    it('should return profile when found', async () => {
      const mockPrismaProfile = {
        id: 'profile-123',
        user_id: 'user-123',
        first_name: 'Иван',
        middle_name: 'Петрович',
        last_name: 'Петров',
        phone: '+79991234567',
        avatar: '/avatars/user-123.jpg',
        bio: 'Тестовая биография',
        theme: 'light',
        created_at: new Date('2024-01-01T00:00:00Z'),
        updated_at: new Date('2024-01-01T00:00:00Z'),
      };
      (prisma.userProfile.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(mockPrismaProfile);

      const result = await repository.findByUserId('user-123');
      const expectedProfile = createMockUserProfile();

      expect(result).toEqual(expectedProfile);
      expect(prisma.userProfile.findUnique).toHaveBeenCalledWith({
        where: { user_id: 'user-123' },
      });
    });

    it('should return null when profile not found', async () => {
      (prisma.userProfile.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(null);

      const result = await repository.findByUserId('non-existent-user');

      expect(result).toBeNull();
      expect(prisma.userProfile.findUnique).toHaveBeenCalledWith({
        where: { user_id: 'non-existent-user' },
      });
    });
  });

  // ==========================================================================
  // findAll Tests
  // ==========================================================================

  describe('findAll', () => {
    it('should return all profiles', async () => {
      const mockPrismaProfiles = [
        {
          id: 'profile-123',
          user_id: 'user-123',
          first_name: 'Иван',
          middle_name: 'Петрович',
          last_name: 'Петров',
          phone: '+79991234567',
          avatar: '/avatars/user-123.jpg',
          bio: 'Тестовая биография',
          theme: 'light',
          created_at: new Date('2024-01-01T00:00:00Z'),
          updated_at: new Date('2024-01-01T00:00:00Z'),
        },
        {
          id: 'profile-456',
          user_id: 'user-456',
          first_name: 'Анна',
          middle_name: 'Ивановна',
          last_name: 'Сидорова',
          phone: '+79997654321',
          avatar: '/avatars/user-456.jpg',
          bio: 'Второй пользователь',
          theme: 'dark',
          created_at: new Date('2024-02-02T00:00:00Z'),
          updated_at: new Date('2024-02-02T00:00:00Z'),
        },
      ];
      (prisma.userProfile.findMany as ReturnType<typeof vi.fn>).mockResolvedValue(mockPrismaProfiles);

      const result = await repository.findAll();

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        id: 'profile-123',
        userId: 'user-123',
        firstName: 'Иван',
        middleName: 'Петрович',
        lastName: 'Петров',
        phone: '+79991234567',
        avatar: '/avatars/user-123.jpg',
        bio: 'Тестовая биография',
        theme: 'light',
        createdAt: new Date('2024-01-01T00:00:00Z'),
        updatedAt: new Date('2024-01-01T00:00:00Z'),
      });
      expect(result[1]).toEqual({
        id: 'profile-456',
        userId: 'user-456',
        firstName: 'Анна',
        middleName: 'Ивановна',
        lastName: 'Сидорова',
        phone: '+79997654321',
        avatar: '/avatars/user-456.jpg',
        bio: 'Второй пользователь',
        theme: 'dark',
        createdAt: new Date('2024-02-02T00:00:00Z'),
        updatedAt: new Date('2024-02-02T00:00:00Z'),
      });
      expect(prisma.userProfile.findMany).toHaveBeenCalledTimes(1);
    });
  });

  // ==========================================================================
  // create Tests
  // ==========================================================================

  describe('create', () => {
    it('should create new profile', async () => {
      const input: CreateUserProfileInput & { userId: string; theme?: string } = {
        userId: 'user-123',
        firstName: 'Иван',
        lastName: 'Петров',
        theme: 'light',
      };
      const mockPrismaProfile = {
        id: 'profile-123',
        user_id: 'user-123',
        first_name: 'Иван',
        middle_name: null,
        last_name: 'Петров',
        phone: null,
        avatar: null,
        bio: null,
        theme: 'light',
        created_at: new Date('2024-01-01T00:00:00Z'),
        updated_at: new Date('2024-01-01T00:00:00Z'),
      };
      (prisma.userProfile.create as ReturnType<typeof vi.fn>).mockResolvedValue(mockPrismaProfile);

      const result = await repository.create(input);

      expect(result).toEqual({
        id: 'profile-123',
        userId: 'user-123',
        firstName: 'Иван',
        middleName: null,
        lastName: 'Петров',
        phone: null,
        avatar: null,
        bio: null,
        theme: 'light',
        createdAt: new Date('2024-01-01T00:00:00Z'),
        updatedAt: new Date('2024-01-01T00:00:00Z'),
      });
      expect(prisma.userProfile.create).toHaveBeenCalledWith({
        data: {
          user_id: input.userId,
          first_name: input.firstName,
          middle_name: input.middleName,
          last_name: input.lastName,
          phone: input.phone,
          bio: input.bio,
          theme: input.theme || 'light',
        },
      });
    });

    it('should throw ProfileRepositoryError on database error', async () => {
      const input: CreateUserProfileInput & { userId: string; theme?: string } = {
        userId: 'user-123',
        firstName: 'Иван',
        lastName: 'Петров',
        theme: 'light',
      };
      (prisma.userProfile.create as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error('Database error')
      );

      await expect(repository.create(input)).rejects.toThrow(ProfileRepositoryError);
    });
  });

  // ==========================================================================
  // update Tests
  // ==========================================================================

  describe('update', () => {
    it('should update profile', async () => {
      const mockPrismaProfile = {
        id: 'profile-123',
        user_id: 'user-123',
        first_name: 'Алексей',
        middle_name: null,
        last_name: null,
        phone: null,
        avatar: null,
        bio: null,
        theme: 'light',
        created_at: new Date('2024-01-01T00:00:00Z'),
        updated_at: new Date('2024-01-01T00:00:00Z'),
      };
      (prisma.userProfile.update as ReturnType<typeof vi.fn>).mockResolvedValue(mockPrismaProfile);

      const result = await repository.update('profile-123', { firstName: 'Алексей' });

      expect(result).toEqual({
        id: 'profile-123',
        userId: 'user-123',
        firstName: 'Алексей',
        middleName: null,
        lastName: null,
        phone: null,
        avatar: null,
        bio: null,
        theme: 'light',
        createdAt: new Date('2024-01-01T00:00:00Z'),
        updatedAt: new Date('2024-01-01T00:00:00Z'),
      });
      expect(prisma.userProfile.update).toHaveBeenCalledWith({
        where: { id: 'profile-123' },
        data: {
          first_name: 'Алексей',
        },
      });
    });

    it('should throw ProfileRepositoryError when profile not found', async () => {
      (prisma.userProfile.update as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error('Record to update not found')
      );

      await expect(repository.update('non-existent', {})).rejects.toThrow();
    });

    it('should throw ProfileRepositoryError on other errors', async () => {
      (prisma.userProfile.update as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error('Database error')
      );

      await expect(repository.update('profile-123', {})).rejects.toThrow();
    });
  });

  // ==========================================================================
  // delete Tests
  // ==========================================================================

  describe('delete', () => {
    it('should delete profile', async () => {
      (prisma.userProfile.delete as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'profile-123' });

      await expect(repository.delete('profile-123')).resolves.toBeUndefined();

      expect(prisma.userProfile.delete).toHaveBeenCalledWith({
        where: { id: 'profile-123' },
      });
    });

    it('should throw ProfileRepositoryError when profile not found', async () => {
      (prisma.userProfile.delete as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error('Record to delete not found')
      );

      await expect(repository.delete('non-existent')).rejects.toThrow();
    });
  });

  // ==========================================================================
  // findWithUser Tests
  // ==========================================================================

  describe('findWithUser', () => {
    it('should return profile with user data when found', async () => {
      const userProfileFull = createMockUserProfileFull();
      (prisma.userProfile.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: userProfileFull.id,
        user_id: userProfileFull.userId,
        first_name: userProfileFull.firstName,
        middle_name: userProfileFull.middleName,
        last_name: userProfileFull.lastName,
        phone: userProfileFull.phone,
        avatar: userProfileFull.avatar,
        bio: userProfileFull.bio,
        theme: userProfileFull.theme,
        created_at: userProfileFull.profileCreatedAt,
        updated_at: userProfileFull.profileUpdatedAt,
        user: {
          id: userProfileFull.userId,
          email: userProfileFull.email,
          name: userProfileFull.name,
          createdAt: userProfileFull.userCreatedAt,
          updatedAt: userProfileFull.userUpdatedAt,
          roles: [
            {
              role: {
                name: 'member',
              },
            },
          ],
        },
      });

      const result = await repository.findWithUser('user-123');

      expect(result).toEqual(userProfileFull);
      expect(prisma.userProfile.findUnique).toHaveBeenCalledWith({
        where: { user_id: 'user-123' },
        include: {
          user: {
            include: {
              roles: { include: { role: { select: { name: true } } } },
            },
          },
        },
      });
    });

    it('should return null when profile not found', async () => {
      (prisma.userProfile.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(null);

      const result = await repository.findWithUser('non-existent-user');

      expect(result).toBeNull();
    });
  });

  // ==========================================================================
  // findOrCreateWithUser Tests
  // ==========================================================================

  describe('findOrCreateWithUser', () => {
    it('should return existing profile with user data', async () => {
      const existingProfile = createMockUserProfileFull();
      (prisma.userProfile.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: existingProfile.id,
        user_id: existingProfile.userId,
        first_name: existingProfile.firstName,
        middle_name: existingProfile.middleName,
        last_name: existingProfile.lastName,
        phone: existingProfile.phone,
        avatar: existingProfile.avatar,
        bio: existingProfile.bio,
        theme: existingProfile.theme,
        created_at: existingProfile.profileCreatedAt,
        updated_at: existingProfile.profileUpdatedAt,
        user: {
          id: existingProfile.userId,
          email: existingProfile.email,
          name: existingProfile.name,
          createdAt: existingProfile.userCreatedAt,
          updatedAt: existingProfile.userUpdatedAt,
          roles: [
            {
              role: {
                name: 'member',
              },
            },
          ],
        },
      });

      const result = await repository.findOrCreateWithUser('user-123');

      expect(result).toEqual(existingProfile);
    });

    it('should create new profile when not found', async () => {
      const mockCreatedProfile = {
        id: 'profile-123',
        user_id: 'user-123',
        first_name: null,
        middle_name: null,
        last_name: null,
        phone: null,
        avatar: null,
        bio: null,
        theme: 'light',
        created_at: new Date('2024-01-01T00:00:00Z'),
        updated_at: new Date('2024-01-01T00:00:00Z'),
      };

      const mockUser = {
        id: 'user-123',
        email: 'ivan@example.com',
        name: 'Иван Петров',
        createdAt: new Date('2024-01-01T00:00:00Z'),
        updatedAt: new Date('2024-01-01T00:00:00Z'),
        roles: [
          {
            role: {
              name: 'member',
            },
          },
        ],
      };

      // First call: findUnique returns null (profile not found)
      // Second call: user.findUnique returns user data
      (prisma.userProfile.findUnique as ReturnType<typeof vi.fn>).mockResolvedValueOnce(null);
      (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(mockUser);
      (prisma.userProfile.create as ReturnType<typeof vi.fn>).mockResolvedValue(mockCreatedProfile);

      const result = await repository.findOrCreateWithUser('user-123');

      expect(result).toBeDefined();
      expect(result.userId).toBe('user-123');
      expect(result.email).toBe('ivan@example.com');
      expect(result.firstName).toBeNull();
      expect(result.lastName).toBeNull();
      expect(result.roles).toEqual(['member']);

      // Verify create is called WITHOUT include (to avoid FK constraint issues)
      expect(prisma.userProfile.create).toHaveBeenCalledWith({
        data: {
          user_id: 'user-123',
          first_name: null,
          last_name: null,
          theme: 'light',
        },
      });

      // Verify user.findUnique is called with include to load roles
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        include: {
          roles: { include: { role: { select: { name: true } } } },
        },
      });
    });

    it('should create profile with default values when not found', async () => {
      (prisma.userProfile.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(null);

      const mockCreatedProfile = {
        id: 'profile-123',
        user_id: 'user-123',
        first_name: null,
        middle_name: null,
        last_name: null,
        phone: null,
        avatar: null,
        bio: null,
        theme: 'light' as Theme,
        created_at: new Date('2024-01-01T00:00:00Z'),
        updated_at: new Date('2024-01-01T00:00:00Z'),
      };

      const mockUser = {
        id: 'user-123',
        email: 'ivan@example.com',
        name: null,
        createdAt: new Date('2024-01-01T00:00:00Z'),
        updatedAt: new Date('2024-01-01T00:00:00Z'),
        roles: [
          {
            role: {
              name: 'member',
            },
          },
        ],
      };

      (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(mockUser);
      (prisma.userProfile.create as ReturnType<typeof vi.fn>).mockResolvedValue(mockCreatedProfile);

      const result = await repository.findOrCreateWithUser('user-123');

      expect(result).toBeDefined();
      expect(result.userId).toBe('user-123');
      expect(result.email).toBe('ivan@example.com');

      // Verify create is called WITHOUT include
      expect(prisma.userProfile.create).toHaveBeenCalledWith({
        data: {
          user_id: 'user-123',
          first_name: null,
          last_name: null,
          theme: 'light',
        },
      });
    });

    it('should throw UserProfileNotFoundError when user does not exist', async () => {
      (prisma.userProfile.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(null);
      (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(null);

      await expect(repository.findOrCreateWithUser('non-existent-user')).rejects.toThrow(
        'User with id non-existent-user not found'
      );
    });
  });

  // ==========================================================================
  // updateTheme Tests
  // ==========================================================================

  describe('updateTheme', () => {
    it('should update theme successfully', async () => {
      (prisma.userProfile.update as ReturnType<typeof vi.fn>).mockResolvedValue({
        theme: 'dark',
      } as unknown as UserProfileData);

      const result = await repository.updateTheme('user-123', 'dark');

      expect(result).toBe('dark');
      expect(prisma.userProfile.update).toHaveBeenCalledWith({
        where: { user_id: 'user-123' },
        data: { theme: 'dark' },
      });
    });

    it('should throw ProfileRepositoryError when profile not found', async () => {
      (prisma.userProfile.update as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error('Record to update not found')
      );

      await expect(repository.updateTheme('non-existent', 'dark')).rejects.toThrow(
        ProfileRepositoryError
      );
    });
  });
});
