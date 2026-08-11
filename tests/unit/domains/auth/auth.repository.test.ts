/**
 * @domain auth
 * @description Unit-тесты для AuthRepository (Prisma реализация)
 *
 * @spec
 * - findByEmail: возвращает UserData или null
 * - findByEmailWithPassword: возвращает UserWithPassword или null
 * - create: создаёт пользователя с назначением роли GUEST, обрабатывает P2002
 */
import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest';
import { AuthRepository } from '@/domains/auth/auth.repository.prisma';
import type { UserData, UserWithPassword, CreateUserInput } from '@/domains/auth/auth.types';
import { UserDuplicateError, UserInvalidDataError } from '@/domains/auth/auth.errors';

// ============================================================================
// Mocks — hoisted to top of file via vi.hoisted() to avoid hoisting issues
// ============================================================================

const prismaMocks = vi.hoisted(() => ({
  mockUserFindUnique: vi.fn(),
  mockUserCreate: vi.fn(),
  mockRoleFindUnique: vi.fn(),
  mockUserRoleCreate: vi.fn(),
  mockTransaction: vi.fn(),
}));

vi.mock('@/infrastructure/prisma/client', () => ({
  prisma: {
    user: {
      findUnique: (...args: unknown[]) => prismaMocks.mockUserFindUnique(...args),
      create: (...args: unknown[]) => prismaMocks.mockUserCreate(...args),
    },
    role: {
      findUnique: (...args: unknown[]) => prismaMocks.mockRoleFindUnique(...args),
    },
    userRole: {
      create: (...args: unknown[]) => prismaMocks.mockUserRoleCreate(...args),
    },
    $transaction: (cb: (tx: Record<string, unknown>) => Promise<unknown>) =>
      prismaMocks.mockTransaction(cb),
  },
}));

// ============================================================================
// Helpers
// ============================================================================

function createMockUserData(overrides?: Partial<UserData>): UserData {
  return {
    id: 'usr_123',
    email: 'test@example.com',
    name: 'Test User',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-02'),
    ...overrides,
  };
}

function createMockUserWithPassword(overrides?: Partial<UserWithPassword>): UserWithPassword {
  return {
    id: 'usr_123',
    email: 'test@example.com',
    name: 'Test User',
    passwordHash: '$2a$10$abcd...',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-02'),
    ...overrides,
  };
}

function createMockCreateInput(overrides?: Partial<CreateUserInput>): CreateUserInput {
  return {
    email: 'new@example.com',
    passwordHash: '$2a$10$hash...',
    name: null,
    ...overrides,
  };
}

// Helper: create transaction mock that delegates to individual mocks
function createTransactionMock(
  txUserCreate: Mock,
  txUserFindUnique: Mock,
  txRoleFindUnique: Mock,
  txUserRoleCreate: Mock
): (cb: (tx: Record<string, unknown>) => Promise<unknown>) => Promise<unknown> {
  return async (cb) => {
    const tx = {
      user: {
        create: txUserCreate,
        findUnique: txUserFindUnique,
      },
      role: {
        findUnique: txRoleFindUnique,
      },
      userRole: {
        create: txUserRoleCreate,
      },
    };
    return await cb(tx);
  };
}

// ============================================================================
// AuthRepository Tests
// ============================================================================

describe('AuthRepository', () => {
  let repository: AuthRepository;

  beforeEach(() => {
    vi.clearAllMocks();
    repository = new AuthRepository();
  });

  // ==========================================================================
  // findByEmail Tests
  // ==========================================================================

  describe('findByEmail', () => {
    it('should return user data when found', async () => {
      const mockUser = createMockUserData({ email: 'found@example.com' });
      prismaMocks.mockUserFindUnique.mockResolvedValueOnce(mockUser);

      const result = await repository.findByEmail('found@example.com');

      expect(result).toEqual(mockUser);
      expect(prismaMocks.mockUserFindUnique).toHaveBeenCalledWith({
        where: { email: 'found@example.com' },
        select: {
          id: true,
          email: true,
          name: true,
          createdAt: true,
          updatedAt: true,
        },
      });
    });

    it('should return null when user not found', async () => {
      prismaMocks.mockUserFindUnique.mockResolvedValueOnce(null);

      const result = await repository.findByEmail('notfound@example.com');

      expect(result).toBeNull();
      expect(prismaMocks.mockUserFindUnique).toHaveBeenCalledWith({
        where: { email: 'notfound@example.com' },
        select: {
          id: true,
          email: true,
          name: true,
          createdAt: true,
          updatedAt: true,
        },
      });
    });
  });

  // ==========================================================================
  // findByEmailWithPassword Tests
  // ==========================================================================

  describe('findByEmailWithPassword', () => {
    it('should return user with password hash when found', async () => {
      const dbUser = {
        id: 'usr_123',
        email: 'test@example.com',
        name: 'Test User',
        password: '$2a$10$abcd...',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-02'),
      };
      prismaMocks.mockUserFindUnique.mockResolvedValueOnce(dbUser);

      const result = await repository.findByEmailWithPassword('test@example.com');

      expect(result).toEqual({
        id: 'usr_123',
        email: 'test@example.com',
        name: 'Test User',
        passwordHash: '$2a$10$abcd...',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-02'),
      });
      expect(prismaMocks.mockUserFindUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
        select: {
          id: true,
          email: true,
          name: true,
          password: true,
          createdAt: true,
          updatedAt: true,
        },
      });
    });

    it('should return null when user not found', async () => {
      prismaMocks.mockUserFindUnique.mockResolvedValueOnce(null);

      const result = await repository.findByEmailWithPassword('notfound@example.com');

      expect(result).toBeNull();
    });
  });

  // ==========================================================================
  // create Tests
  // ==========================================================================

  describe('create', () => {
    // Helper для создания tx объекта с моками, которые мы контролируем в тесте
    function buildTransaction(txUserCreate: Mock, txUserFindUnique: Mock, txRoleFindUnique: Mock, txUserRoleCreate: Mock) {
      return async (cb: (tx: Record<string, unknown>) => Promise<unknown>) => {
        const tx = {
          user: {
            create: txUserCreate,
            findUnique: txUserFindUnique,
          },
          role: {
            findUnique: txRoleFindUnique,
          },
          userRole: {
            create: txUserRoleCreate,
          },
        };
        return await cb(tx);
      };
    }

    it('should create user and assign GUEST role', async () => {
      const createInput = createMockCreateInput();
      const createdUser = {
        id: 'usr_new',
        email: createInput.email,
        name: createInput.name,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Создаём локальные мок-функции для транзакции
      const txUserCreate = vi.fn().mockResolvedValueOnce(createdUser);
      const txRoleFindUnique = vi.fn().mockResolvedValueOnce({ id: 'role_guest' });
      const txUserRoleCreate = vi.fn().mockResolvedValueOnce({ userId: 'usr_new', roleId: 'role_guest' });

      prismaMocks.mockTransaction.mockImplementation(
        buildTransaction(txUserCreate, prismaMocks.mockUserFindUnique, txRoleFindUnique, txUserRoleCreate)
      );

      const result = await repository.create(createInput);

      expect(result).toEqual({
        id: createdUser.id,
        email: createdUser.email,
        name: createdUser.name,
        createdAt: createdUser.createdAt,
        updatedAt: createdUser.updatedAt,
      });
    });

    it('should throw GuestRoleMissingError if GUEST role not found', async () => {
      const createInput = createMockCreateInput();

      // GUEST роль не найдена
      const txUserCreate = vi.fn();
      const txRoleFindUnique = vi.fn().mockResolvedValueOnce(null);

      prismaMocks.mockTransaction.mockImplementation(
        buildTransaction(txUserCreate, prismaMocks.mockUserFindUnique, txRoleFindUnique, vi.fn())
      );

      await expect(repository.create(createInput)).rejects.toThrow('Системная роль GUEST не найдена');
    });

    it('should throw UserDuplicateError on P2002 for email', async () => {
      const createInput = createMockCreateInput();
      // Prisma бросает ошибку с .code и .meta (без $ префикса в accessors)
      const prismaError = {
        name: 'PrismaClientKnownRequestError',
        code: 'P2002',
        meta: { target: ['email'] },
        message: 'Unique constraint failed on the fields: (`email`)',
      };

      // Transaction mock, который бросает P2002 напрямую (так как Prisma бросает на уровне $transaction)
      prismaMocks.mockTransaction.mockImplementationOnce(async () => {
        throw prismaError;
      });

      await expect(repository.create(createInput)).rejects.toThrow(UserDuplicateError);
    });

    it('should throw UserInvalidDataError on other Prisma errors', async () => {
      const createInput = createMockCreateInput();
      const prismaError = {
        name: 'PrismaClientKnownRequestError',
        code: 'P2003',
        meta: { field_name: 'user_id' },
        message: 'Foreign key constraint failed',
      };

      prismaMocks.mockTransaction.mockImplementationOnce(async () => {
        throw prismaError;
      });

      await expect(repository.create(createInput)).rejects.toThrow(UserInvalidDataError);
    });

    it('should throw UserInvalidDataError on non-Prisma errors', async () => {
      const createInput = createMockCreateInput();
      const error = new Error('Network error');

      prismaMocks.mockTransaction.mockImplementationOnce(async () => {
        throw error;
      });

      await expect(repository.create(createInput)).rejects.toThrow(UserInvalidDataError);
    });
  });
});
