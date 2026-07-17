/**
 * @domain users
 * @description Unit-тесты для UsersRepository (Prisma реализация)
 *
 * @spec
 * - findUserById: возвращает UserDetail или null
 * - findAllUsers: возвращает пагинированный ответ
 * - searchUsers: возвращает массив результатов поиска
 */
import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest';
import { UsersRepositoryPrisma } from '@/domains/users/users.repository.prisma';
import type { UserDetail, UserRoleDetail, UserFilters, UserListResponse, UserSearchResult } from '@/domains/users/users.types';

// ============================================================================
// Mocks — hoisted to top of file via vi.hoisted() to avoid hoisting issues
// ============================================================================

const prismaMocks = vi.hoisted(() => ({
  mockFindUnique: vi.fn(),
  mockFindMany: vi.fn(),
  mockCount: vi.fn(),
}));

vi.mock('@/infrastructure/prisma/client', () => ({
  prisma: {
    user: {
      findUnique: (...args: unknown[]) => prismaMocks.mockFindUnique(...args),
      findMany: (...args: unknown[]) => prismaMocks.mockFindMany(...args),
      count: (...args: unknown[]) => prismaMocks.mockCount(...args),
    },
  },
}));

// ============================================================================
// Helpers
// ============================================================================

function createMockUserDetail(overrides?: Partial<UserDetail>): UserDetail {
  return {
    id: 'usr_123',
    email: 'test@example.com',
    firstName: 'Иван',
    lastName: 'Петров',
    patronymic: 'Иванович',
    phone: '+79001234567',
    createdAt: new Date('2024-01-01'),
    roles: [],
    ...overrides,
  };
}

function createMockUserRoleDetail(overrides?: Partial<UserRoleDetail>): UserRoleDetail {
  return {
    roleId: 'role_123',
    roleName: 'ADMIN',
    roleDescription: 'Администратор',
    ...overrides,
  };
};

function createMockPrismaUser(overrides?: Partial<Record<string, unknown>>) {
  return {
    id: 'usr_123',
    email: 'test@example.com',
    name: null,
    password: '$2a$10$hash...',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-02'),
    profile: {
      first_name: 'Иван',
      last_name: 'Петров',
      middle_name: 'Иванович',
      phone: '+79001234567',
      avatar: null,
      bio: null,
      theme: 'light',
    },
    roles: [
      {
        role: {
          id: 'role_123',
          name: 'ADMIN',
          description: 'Администратор',
        },
      },
    ],
    ...overrides,
  };
}

function createMockFilters(overrides?: Partial<UserFilters>): UserFilters {
  return {
    page: 1,
    limit: 10,
    ...overrides,
  };
}

function createMockUserSearchResult(overrides?: Partial<UserSearchResult>): UserSearchResult {
  return {
    id: 'usr_456',
    email: 'user@example.com',
    name: 'Сидоров Алексей',
    avatar: null,
    ...overrides,
  };
}

// ============================================================================
// UsersRepository Tests
// ============================================================================

describe('UsersRepositoryPrisma', () => {
  let repository: UsersRepositoryPrisma;

  beforeEach(() => {
    vi.clearAllMocks();
    repository = new UsersRepositoryPrisma();
  });

  // ==========================================================================
  // findUserById Tests
  // ==========================================================================

  describe('findUserById', () => {
    it('should return UserDetail when user is found', async () => {
      const mockPrismaUser = createMockPrismaUser();
      prismaMocks.mockFindUnique.mockResolvedValueOnce(mockPrismaUser);

      const result = await repository.findUserById('usr_123');

      expect(result).toEqual({
        id: 'usr_123',
        email: 'test@example.com',
        firstName: 'Иван',
        lastName: 'Петров',
        patronymic: 'Иванович',
        phone: '+79001234567',
        createdAt: new Date('2024-01-01'),
        roles: [
          {
            roleId: 'role_123',
            roleName: 'ADMIN',
            roleDescription: 'Администратор',
          },
        ],
      });
      expect(prismaMocks.mockFindUnique).toHaveBeenCalledWith({
        where: { id: 'usr_123' },
        include: {
          profile: true,
          roles: {
            include: {
              role: true,
            },
          },
        },
      });
    });

    it('should return null when user is not found', async () => {
      prismaMocks.mockFindUnique.mockResolvedValueOnce(null);

      const result = await repository.findUserById('not_found');

      expect(result).toBeNull();
      expect(prismaMocks.mockFindUnique).toHaveBeenCalledWith({
        where: { id: 'not_found' },
        include: {
          profile: true,
          roles: {
            include: {
              role: true,
            },
          },
        },
      });
    });

    it('should handle user without profile', async () => {
      const mockPrismaUser = createMockPrismaUser({ profile: null });
      prismaMocks.mockFindUnique.mockResolvedValueOnce(mockPrismaUser);

      const result = await repository.findUserById('usr_123');

      expect(result).toMatchObject({
        firstName: null,
        lastName: null,
        patronymic: null,
        phone: null,
      });
    });

    it('should handle user without roles', async () => {
      const mockPrismaUser = createMockPrismaUser({ roles: [] });
      prismaMocks.mockFindUnique.mockResolvedValueOnce(mockPrismaUser);

      const result = await repository.findUserById('usr_123');

      expect(result?.roles).toEqual([]);
    });
  });

  // ==========================================================================
  // findAllUsers Tests
  // ==========================================================================

  describe('findAllUsers', () => {
    it('should return paginated response', async () => {
      const mockFilters = createMockFilters();
      const mockPrismaUsers = [createMockPrismaUser({ id: 'usr_1' })];
      const mockTotal = 1;

      prismaMocks.mockCount.mockResolvedValueOnce(mockTotal);
      prismaMocks.mockFindMany.mockResolvedValueOnce(mockPrismaUsers);

      const result = await repository.findAllUsers(mockFilters);

      expect(result).toMatchObject({
        items: [
          {
            id: 'usr_1',
            email: 'test@example.com',
            firstName: 'Иван',
            lastName: 'Петров',
          },
        ],
        total: 1,
        page: 1,
        limit: 10,
      });
      expect(prismaMocks.mockCount).toHaveBeenCalled();
      expect(prismaMocks.mockFindMany).toHaveBeenCalled();
    });

    it('should return empty array when no users exist', async () => {
      const mockFilters = createMockFilters();
      const mockTotal = 0;

      prismaMocks.mockCount.mockResolvedValueOnce(mockTotal);
      prismaMocks.mockFindMany.mockResolvedValueOnce([]);

      const result = await repository.findAllUsers(mockFilters);

      expect(result).toMatchObject({
        items: [],
        total: 0,
      });
    });
  });

  // ==========================================================================
  // searchUsers Tests
  // ==========================================================================

  describe('searchUsers', () => {
    it('should return search results', async () => {
      const mockResults: UserSearchResult[] = [
        createMockUserSearchResult({ id: 'usr_1', email: 'user1@example.com', name: 'Иван Петров' }),
        createMockUserSearchResult({ id: 'usr_2', email: 'user2@example.com', name: 'Мария Иванова' }),
      ];
      const mockPrismaUsers = [
        createMockPrismaUser({ id: 'usr_1', email: 'user1@example.com', profile: { first_name: 'Иван', last_name: 'Петров' } }),
        createMockPrismaUser({ id: 'usr_2', email: 'user2@example.com', profile: { first_name: 'Мария', last_name: 'Иванова' } }),
      ];

      prismaMocks.mockFindMany.mockResolvedValueOnce(mockPrismaUsers);

      const result = await repository.searchUsers('иван', 'current_user', 5);

      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({
        id: 'usr_1',
        email: 'user1@example.com',
        name: 'Петров Иван',
      });
      expect(prismaMocks.mockFindMany).toHaveBeenCalled();
    });
  });
});