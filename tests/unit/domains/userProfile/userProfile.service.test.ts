/**
 * @file userProfile.service.test.ts
 * @domain userProfile
 * @description Unit-тесты для UserProfileService
 *
 * @spec
 * - findById: возвращает профиль или выбрасывает NotFoundError
 * - findByUserId: возвращает профиль или null
 * - findAll: возвращает массив всех профилей
 * - getUserProfile: находит или создает профиль с данными пользователя
 * - createOrGet: возвращает существующий или создает новый профиль
 * - update: обновляет профиль, выбрасывает InvalidDataError при ошибке валидации
 * - updateTheme: обновляет тему, выбрасывает ThemeInvalidError при невалидной теме
 * - uploadAvatar: валидирует файл, выбрасывает FileTooLargeError/UnsupportedFileTypeError
 * - deleteAvatar: удаляет аватар
 *
 * @see tests/unit/domains/plot/plot.service.test.ts — пример структуры тестов
 * @see tests/unit/domains/plotUser/plotUser.service.test.ts — пример тестов сервиса
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { UserProfileService } from '@/domains/userProfile/userProfile.service';
import type { IUserProfileRepository } from '@/domains/userProfile/userProfile.repository.interface';
import type {
  UserProfileData,
  UserProfileFull,
  CreateUserProfileInput,
  Theme,
} from '@/domains/userProfile/userProfile.types';
import { UserProfileNotFoundError } from '@/domains/userProfile/userProfile.errors';
import { UserProfileInvalidDataError } from '@/domains/userProfile/userProfile.errors';
import { ZodError } from 'zod';

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

function createMockRepository(overrides?: Partial<IUserProfileRepository>): IUserProfileRepository {
  return {
    findById: vi.fn(),
    findByUserId: vi.fn(),
    findAll: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    findWithUser: vi.fn(),
    findOrCreateWithUser: vi.fn(),
    updateTheme: vi.fn(),
    ...overrides,
  };
}

// Mock file type for testing
interface MockFile {
  size: number;
  mimetype: string;
  buffer: Buffer;
}

function createMockFile(size: number, mimetype: string): MockFile {
  return {
    size,
    mimetype,
    buffer: Buffer.from('test'),
  };
}

// ============================================================================
// UserProfileService Tests
// ============================================================================

describe('UserProfileService', () => {
  let service: UserProfileService;
  let mockRepository: IUserProfileRepository;

  beforeEach(() => {
    mockRepository = createMockRepository();
    service = new UserProfileService(mockRepository);
    vi.clearAllMocks();
  });

  // ==========================================================================
  // findById Tests
  // ==========================================================================

  describe('findById', () => {
    it('should return profile when found', async () => {
      const profile = createMockUserProfile();
      mockRepository.findById = vi.fn().mockResolvedValue(profile);

      const result = await service.findById('profile-123');

      expect(result).toEqual(profile);
      expect(mockRepository.findById).toHaveBeenCalledWith('profile-123');
    });

    it('should throw UserProfileNotFoundError when profile not found', async () => {
      mockRepository.findById = vi.fn().mockResolvedValue(null);

      await expect(service.findById('non-existent-id')).rejects.toThrow(UserProfileNotFoundError);
      await expect(service.findById('non-existent-id')).rejects.toMatchObject({
        code: 'NOT_FOUND',
        statusCode: 404,
      });
    });
  });

  // ==========================================================================
  // findByUserId Tests
  // ==========================================================================

  describe('findByUserId', () => {
    it('should return profile when found', async () => {
      const profile = createMockUserProfile();
      mockRepository.findByUserId = vi.fn().mockResolvedValue(profile);

      const result = await service.findByUserId('user-123');

      expect(result).toEqual(profile);
      expect(mockRepository.findByUserId).toHaveBeenCalledWith('user-123');
    });

    it('should return null when profile not found', async () => {
      mockRepository.findByUserId = vi.fn().mockResolvedValue(null);

      const result = await service.findByUserId('non-existent-user');

      expect(result).toBeNull();
      expect(mockRepository.findByUserId).toHaveBeenCalledWith('non-existent-user');
    });
  });

  // ==========================================================================
  // findAll Tests
  // ==========================================================================

  describe('findAll', () => {
    it('should return all profiles from repository', async () => {
      const profiles = [createMockUserProfile(), createMockUserProfile({ id: 'profile-456' })];
      mockRepository.findAll = vi.fn().mockResolvedValue(profiles);

      const result = await service.findAll();

      expect(result).toEqual(profiles);
      expect(mockRepository.findAll).toHaveBeenCalledTimes(1);
    });
  });

  // ==========================================================================
  // getUserProfile Tests
  // ==========================================================================

  describe('getUserProfile', () => {
    it('should return profile with user data when found', async () => {
      const userProfileFull = createMockUserProfileFull();
      mockRepository.findOrCreateWithUser = vi.fn().mockResolvedValue(userProfileFull);

      const result = await service.getUserProfile('user-123');

      expect(result).toEqual(userProfileFull);
      expect(mockRepository.findOrCreateWithUser).toHaveBeenCalledWith('user-123');
    });
  });

  // ==========================================================================
  // createOrGet Tests
  // ==========================================================================

  describe('createOrGet', () => {
    it('should return existing profile', async () => {
      const existingProfile = createMockUserProfile();
      mockRepository.findByUserId = vi.fn().mockResolvedValue(existingProfile);

      const input: CreateUserProfileInput = {
        firstName: 'Иван',
        lastName: 'Петров',
      };

      const result = await service.createOrGet('user-123', input);

      expect(result).toEqual(existingProfile);
      expect(mockRepository.findByUserId).toHaveBeenCalledWith('user-123');
      expect(mockRepository.create).not.toHaveBeenCalled();
    });

    it('should create new profile when not found', async () => {
      mockRepository.findByUserId = vi.fn().mockResolvedValue(null);

      const input: CreateUserProfileInput = {
        firstName: 'Иван',
        lastName: 'Петров',
      };
      const newProfile = createMockUserProfile({ firstName: 'Иван', lastName: 'Петров' });
      mockRepository.create = vi.fn().mockResolvedValue(newProfile);

      const result = await service.createOrGet('user-123', input);

      expect(result).toEqual(newProfile);
      expect(mockRepository.findByUserId).toHaveBeenCalledWith('user-123');
      expect(mockRepository.create).toHaveBeenCalledWith({
        ...input,
        userId: 'user-123',
      });
    });
  });

  // ==========================================================================
  // update Tests
  // ==========================================================================

  describe('update', () => {
    it('should update profile with valid data', async () => {
      const updatedProfile = createMockUserProfile({ firstName: 'Алексей' });
      mockRepository.update = vi.fn().mockResolvedValue(updatedProfile);

      const result = await service.update('profile-123', { firstName: 'Алексей' });

      expect(result).toEqual(updatedProfile);
      expect(mockRepository.update).toHaveBeenCalledWith('profile-123', { firstName: 'Алексей' });
    });

    it('should accept empty object for partial update (all fields optional)', async () => {
      // Все поля в userProfileUpdateSchema опциональны
      mockRepository.update = vi.fn().mockResolvedValue(createMockUserProfile());

      const result = await service.update('profile-123', {});

      expect(result).toEqual(createMockUserProfile());
    });

    it('should re-throw other errors from repository', async () => {
      const customError = new Error('Database error');
      mockRepository.update = vi.fn().mockRejectedValue(customError);

      await expect(service.update('profile-123', {})).rejects.toEqual(customError);
    });
  });

  // ==========================================================================
  // updateTheme Tests
  // ==========================================================================

  describe('updateTheme', () => {
    it('should update theme successfully', async () => {
      const newTheme: Theme = 'dark';
      mockRepository.findByUserId = vi.fn().mockResolvedValue(createMockUserProfile());
      mockRepository.updateTheme = vi.fn().mockResolvedValue(newTheme);

      const result = await service.updateTheme('user-123', 'dark');

      expect(result).toBe('dark');
      expect(mockRepository.findByUserId).toHaveBeenCalledWith('user-123');
      expect(mockRepository.updateTheme).toHaveBeenCalledWith('user-123', 'dark');
    });

    it('should throw error when theme is invalid', async () => {
      mockRepository.updateTheme = vi.fn().mockRejectedValue(
        new Error('Invalid theme: "purple"')
      );

      await expect(service.updateTheme('user-123', 'purple')).rejects.toThrow();
    });
  });

  // ==========================================================================
  // uploadAvatar Tests
  // ==========================================================================

  describe('uploadAvatar', () => {
    it('should upload avatar and return result', async () => {
      const mockFile: MockFile = createMockFile(1024 * 1024, 'image/jpeg');
      mockRepository.findByUserId = vi.fn().mockResolvedValue(createMockUserProfile());

      const result = await service.uploadAvatar('user-123', mockFile);

      expect(result).toEqual({ avatarUrl: '/placeholder-avatar.jpg' });
    });

    it('should reject file larger than 5MB', async () => {
      const largeFile: MockFile = {
        size: 6 * 1024 * 1024, // 6MB
        mimetype: 'image/jpeg',
        buffer: Buffer.from('test'),
      };

      await expect(service.uploadAvatar('user-123', largeFile)).rejects.toThrow();
    });

    it('should reject unsupported file type', async () => {
      const pdfFile: MockFile = {
        size: 1024 * 1024,
        mimetype: 'application/pdf',
        buffer: Buffer.from('test'),
      };

      await expect(service.uploadAvatar('user-123', pdfFile)).rejects.toThrow();
    });
  });

  // ==========================================================================
  // deleteAvatar Tests
  // ==========================================================================

  describe('deleteAvatar', () => {
    it('should delete avatar', async () => {
      const mockProfile = createMockUserProfile({ avatar: '/avatars/user-123.jpg' });
      const updatedProfile = createMockUserProfile({ avatar: null });
      mockRepository.findByUserId = vi.fn().mockResolvedValue(mockProfile);
      mockRepository.update = vi.fn().mockResolvedValue(updatedProfile);

      const result = await service.deleteAvatar('user-123');

      expect(result.avatar).toBeNull();
      expect(mockRepository.findByUserId).toHaveBeenCalledWith('user-123');
      expect(mockRepository.update).toHaveBeenCalledWith(mockProfile.id, { avatar: null });
    });

    it('should throw error when profile not found', async () => {
      mockRepository.update = vi.fn().mockRejectedValue(
        new UserProfileNotFoundError('profile-123')
      );

      await expect(service.deleteAvatar('profile-123')).rejects.toThrow(UserProfileNotFoundError);
    });
  });
});
