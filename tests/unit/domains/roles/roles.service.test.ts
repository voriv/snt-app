/**
 * @file roles.service.test.ts
 * @domain roles
 * @description Unit-тесты для сервисов Roles домена: RoleService, PageService, ApiEndpointService, RoleApiEndpointService
 *
 * @spec
 * - Мокирование репозиториев через vi.fn()
 * - Покрытие всех методов каждого сервиса
 * - Проверка валидации Zod-схемами
 * - Проверка обработки ошибок (NotFoundError, DuplicateError, SystemProtectedError, LastSuperAdminError)
 *
 * @see tests/unit/domains/plot/plot.service.test.ts — пример структуры тестов
 * @see tests/unit/domains/plotUser/plotUser.service.test.ts — пример моков репозиториев
 */
import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { RoleService, PageService, ApiEndpointService, RoleApiEndpointService } from '@/domains/roles/roles.service';
import type {
  IRoleRepository,
  IPageRepository,
  IRolePageRepository,
  IApiEndpointRepository,
  IRoleApiEndpointRepository,
} from '@/domains/roles/roles.repository.interface';
import type { Role, Page, ApiEndpoint } from '@/domains/roles/roles.types';
import type { UserData } from '@/domains/auth/auth.types';
import {
  RoleNotFoundError,
  RoleDuplicateError,
  RoleSystemProtectedError,
  LastSuperAdminError,
  PageNotFoundError,
  PageDuplicateError,
  ApiEndpointNotFoundError,
  ApiEndpointDuplicateError,
  RoleInvalidDataError,
  PageInvalidDataError,
  ApiEndpointInvalidDataError,
} from '@/domains/roles/roles.errors';

// ============================================================================
// Test Data Helpers
// ============================================================================

function createTestRole(overrides?: Partial<Role>): Role {
  return {
    id: 'role-1',
    name: 'MEMBER',
    description: 'Member role',
    isSystem: false,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    ...overrides,
  };
}

function createTestPage(overrides?: Partial<Page>): Page {
  return {
    id: 'page-1',
    path: '/dashboard/members',
    title: 'Members',
    groupName: 'Users',
    sortOrder: 1,
    accessType: 'role',
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    ...overrides,
  };
}

function createTestApiEndpoint(overrides?: Partial<ApiEndpoint>): ApiEndpoint {
  return {
    id: 'endpoint-1',
    method: 'GET',
    path: '/api/v1/members',
    description: 'Get members',
    accessType: 'role',
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    ...overrides,
  };
}

function createTestUserData(overrides?: Partial<UserData>): UserData {
  return {
    id: 'user-1',
    email: 'test@example.com',
    name: 'Test User',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    ...overrides,
  };
}

// ============================================================================
// Mock Repositories
// ============================================================================

function createMockRoleRepository(overrides?: Partial<IRoleRepository>): IRoleRepository {
  return {
    findAll: vi.fn().mockResolvedValue([]),
    findById: vi.fn().mockResolvedValue(null),
    findByName: vi.fn().mockResolvedValue(null),
    create: vi.fn().mockResolvedValue(createTestRole()),
    update: vi.fn().mockResolvedValue(createTestRole()),
    delete: vi.fn().mockResolvedValue(undefined),
    findUsersByRoleId: vi.fn().mockResolvedValue([]),
    searchUsers: vi.fn().mockResolvedValue([]),
    findRolesByUserId: vi.fn().mockResolvedValue([]),
    addUserToRole: vi.fn().mockResolvedValue(undefined),
    removeUserFromRole: vi.fn().mockResolvedValue(undefined),
    countSuperAdmins: vi.fn().mockResolvedValue(1),
    ...overrides,
  };
}

function createMockPageRepository(overrides?: Partial<IPageRepository>): IPageRepository {
  return {
    findAll: vi.fn().mockResolvedValue([]),
    findById: vi.fn().mockResolvedValue(null),
    findByPath: vi.fn().mockResolvedValue(null),
    create: vi.fn().mockResolvedValue(createTestPage()),
    update: vi.fn().mockResolvedValue(createTestPage()),
    delete: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

function createMockRolePageRepository(overrides?: Partial<IRolePageRepository>): IRolePageRepository {
  return {
    findPagesByRoleId: vi.fn().mockResolvedValue([]),
    findRolesByPageId: vi.fn().mockResolvedValue([]),
    assignPageToRole: vi.fn().mockResolvedValue(undefined),
    unassignPageFromRole: vi.fn().mockResolvedValue(undefined),
    unassignAllPagesFromRole: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

function createMockApiEndpointRepository(overrides?: Partial<IApiEndpointRepository>): IApiEndpointRepository {
  return {
    findAll: vi.fn().mockResolvedValue([]),
    findById: vi.fn().mockResolvedValue(null),
    findByMethodAndPath: vi.fn().mockResolvedValue(null),
    create: vi.fn().mockResolvedValue(createTestApiEndpoint()),
    update: vi.fn().mockResolvedValue(createTestApiEndpoint()),
    delete: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

function createMockRoleApiEndpointRepository(overrides?: Partial<IRoleApiEndpointRepository>): IRoleApiEndpointRepository {
  return {
    findEndpointsByRoleId: vi.fn().mockResolvedValue([]),
    findRolesByEndpointId: vi.fn().mockResolvedValue([]),
    assignEndpointToRole: vi.fn().mockResolvedValue(undefined),
    unassignEndpointFromRole: vi.fn().mockResolvedValue(undefined),
    unassignAllEndpointsFromRole: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

// ============================================================================
// RoleService Tests
// ============================================================================

describe('RoleService', () => {
  let roleRepo: IRoleRepository;
  let rolePageRepo: IRolePageRepository;
  let service: RoleService;

  beforeEach(() => {
    roleRepo = createMockRoleRepository();
    rolePageRepo = createMockRolePageRepository();
    service = new RoleService(roleRepo, rolePageRepo);
  });

  describe('findAll', () => {
    it('should return all roles from repository', async () => {
      const mockRoles = [createTestRole({ id: 'role-1', name: 'MEMBER' }), createTestRole({ id: 'role-2', name: 'ADMIN' })];
      (roleRepo.findAll as Mock).mockResolvedValue(mockRoles);

      const result = await service.findAll();

      expect(result).toEqual(mockRoles);
      expect(roleRepo.findAll).toHaveBeenCalledTimes(1);
    });
  });

  describe('findById', () => {
    it('should return role when found', async () => {
      const mockRole = createTestRole({ id: 'role-1' });
      (roleRepo.findById as Mock).mockResolvedValue(mockRole);

      const result = await service.findById('role-1');

      expect(result).toEqual(mockRole);
      expect(roleRepo.findById).toHaveBeenCalledWith('role-1');
    });

    it('should throw RoleNotFoundError when role not found', async () => {
      (roleRepo.findById as Mock).mockResolvedValue(null);

      await expect(service.findById('role-1')).rejects.toThrow(RoleNotFoundError);
      await expect(service.findById('role-1')).rejects.toMatchObject({
        code: 'ROLE_NOT_FOUND',
        statusCode: 404,
      });
    });
  });

  describe('create', () => {
    it('should create a role with valid data', async () => {
      const mockData = { name: 'TEST_ROLE', description: 'Test role' };
      const mockRole = createTestRole({ id: 'role-1', name: 'TEST_ROLE' });
      (roleRepo.findByName as Mock).mockResolvedValue(null);
      (roleRepo.create as Mock).mockResolvedValue(mockRole);

      const result = await service.create(mockData);

      expect(result).toEqual(mockRole);
      expect(roleRepo.create).toHaveBeenCalledWith({
        name: 'TEST_ROLE',
        description: 'Test role',
      });
    });

    it('should reject duplicate name', async () => {
      const mockData = { name: 'MEMBER', description: 'Test role' };
      const mockExistingRole = createTestRole({ name: 'MEMBER' });
      (roleRepo.findByName as Mock).mockResolvedValue(mockExistingRole);

      await expect(service.create(mockData)).rejects.toThrow(RoleDuplicateError);
      await expect(service.create(mockData)).rejects.toMatchObject({
        statusCode: 409,
      });
    });

    it('should reject duplicate name on P2002 error', async () => {
      const mockData = { name: 'MEMBER', description: 'Test role' };
      (roleRepo.findByName as Mock).mockResolvedValue(null);
      const prismaError = { code: 'P2002' };
      (roleRepo.create as Mock).mockRejectedValue(prismaError);

      await expect(service.create(mockData)).rejects.toThrow(RoleDuplicateError);
    });

    it('should throw ZodError on validation error', async () => {
      const invalidData = { name: '' }; // name is required and min 2 chars

      await expect(service.create(invalidData)).rejects.toThrow();
    });
  });

  describe('update', () => {
    it('should update role with valid data', async () => {
      const mockRole = createTestRole({ id: 'role-1' });
      const mockData = { name: 'UPDATED_ROLE', description: 'Updated description' };
      const mockUpdatedRole = createTestRole({ id: 'role-1', name: 'UPDATED_ROLE', description: 'Updated description' });

      (roleRepo.findById as Mock).mockResolvedValue(mockRole);
      (roleRepo.findByName as Mock).mockResolvedValue(null);
      (roleRepo.update as Mock).mockResolvedValue(mockUpdatedRole);

      const result = await service.update('role-1', mockData);

      expect(result).toEqual(mockUpdatedRole);
      expect(roleRepo.update).toHaveBeenCalledWith('role-1', {
        name: 'UPDATED_ROLE',
        description: 'Updated description',
      });
    });

    it('should throw RoleNotFoundError when role not found', async () => {
      (roleRepo.findById as Mock).mockResolvedValue(null);

      await expect(service.update('role-1', { name: 'NEW' })).rejects.toThrow(RoleNotFoundError);
    });

    it('should throw RoleSystemProtectedError when trying to rename system role', async () => {
      const mockSystemRole = createTestRole({ id: 'role-1', name: 'SUPER_ADMIN', isSystem: true });
      const mockData = { name: 'SUPER_ADM' }; // Attempt to rename

      (roleRepo.findById as Mock).mockResolvedValue(mockSystemRole);

      await expect(service.update('role-1', mockData)).rejects.toThrow(RoleSystemProtectedError);
      await expect(service.update('role-1', mockData)).rejects.toMatchObject({
        statusCode: 403,
      });
    });

    it('should update system role description only (without name)', async () => {
      const mockSystemRole = createTestRole({ id: 'role-1', name: 'SUPER_ADMIN', isSystem: true });
      const mockData = { description: 'Updated description' };
      const mockUpdatedRole = createTestRole({ id: 'role-1', name: 'SUPER_ADMIN', description: 'Updated description' });

      (roleRepo.findById as Mock).mockResolvedValue(mockSystemRole);
      (roleRepo.update as Mock).mockResolvedValue(mockUpdatedRole);

      const result = await service.update('role-1', mockData);

      expect(result).toEqual(mockUpdatedRole);
      expect(roleRepo.update).toHaveBeenCalledWith('role-1', {
        description: 'Updated description',
      });
    });

    it('should reject duplicate name on update', async () => {
      const mockRole = createTestRole({ id: 'role-1', name: 'ROLE1' });
      const mockExistingRole = createTestRole({ id: 'role-2', name: 'ROLE2' });
      const mockData = { name: 'ROLE2' };

      (roleRepo.findById as Mock).mockResolvedValue(mockRole);
      (roleRepo.findByName as Mock).mockResolvedValue(mockExistingRole);

      await expect(service.update('role-1', mockData)).rejects.toThrow(RoleDuplicateError);
    });
  });

  describe('delete', () => {
    it('should delete role when it exists', async () => {
      const mockRole = createTestRole({ id: 'role-1', isSystem: false });

      (roleRepo.findById as Mock).mockResolvedValue(mockRole);

      await expect(service.delete('role-1')).resolves.toBeUndefined();
      expect(roleRepo.delete).toHaveBeenCalledWith('role-1');
    });

    it('should throw RoleNotFoundError when role not found', async () => {
      (roleRepo.findById as Mock).mockResolvedValue(null);

      await expect(service.delete('role-1')).rejects.toThrow(RoleNotFoundError);
    });

    it('should throw RoleSystemProtectedError when trying to delete system role', async () => {
      const mockSystemRole = createTestRole({ id: 'role-1', name: 'SUPER_ADMIN', isSystem: true });

      (roleRepo.findById as Mock).mockResolvedValue(mockSystemRole);

      await expect(service.delete('role-1')).rejects.toThrow(RoleSystemProtectedError);
    });
  });

  describe('getRoleUsers', () => {
    it('should return users for role', async () => {
      const mockRole = createTestRole({ id: 'role-1' });
      const mockUsers = [createTestUserData({ id: 'user-1', email: 'user1@test.com' })];

      (roleRepo.findById as Mock).mockResolvedValue(mockRole);
      (roleRepo.findUsersByRoleId as Mock).mockResolvedValue(mockUsers);

      const result = await service.getRoleUsers('role-1');

      expect(result).toEqual(mockUsers);
      expect(roleRepo.findUsersByRoleId).toHaveBeenCalledWith('role-1');
    });

    it('should throw RoleNotFoundError when role not found', async () => {
      (roleRepo.findById as Mock).mockResolvedValue(null);

      await expect(service.getRoleUsers('role-1')).rejects.toThrow(RoleNotFoundError);
    });
  });

  describe('addUserToRole', () => {
    it('should add user to role', async () => {
      const mockRole = createTestRole({ id: 'role-1' });

      (roleRepo.findById as Mock).mockResolvedValue(mockRole);
      (roleRepo.addUserToRole as Mock).mockResolvedValue(undefined);

      await expect(service.addUserToRole('role-1', 'user-1')).resolves.toBeUndefined();
      expect(roleRepo.addUserToRole).toHaveBeenCalledWith('user-1', 'role-1');
    });

    it('should throw RoleNotFoundError when role not found', async () => {
      (roleRepo.findById as Mock).mockResolvedValue(null);

      await expect(service.addUserToRole('role-1', 'user-1')).rejects.toThrow(RoleNotFoundError);
    });
  });

  describe('removeUserFromRole', () => {
    it('should remove user from role', async () => {
      const mockRole = createTestRole({ id: 'role-1', name: 'MEMBER' });

      (roleRepo.findById as Mock).mockResolvedValue(mockRole);
      (roleRepo.removeUserFromRole as Mock).mockResolvedValue(undefined);

      await expect(service.removeUserFromRole('role-1', 'user-1')).resolves.toBeUndefined();
      expect(roleRepo.removeUserFromRole).toHaveBeenCalledWith('user-1', 'role-1');
    });

    it('should throw LastSuperAdminError when removing last SUPER_ADMIN', async () => {
      const mockSuperAdminRole = createTestRole({ id: 'role-1', name: 'SUPER_ADMIN' });
      (roleRepo.findById as Mock).mockResolvedValue(mockSuperAdminRole);
      (roleRepo.countSuperAdmins as Mock).mockResolvedValue(1);

      await expect(service.removeUserFromRole('role-1', 'user-1')).rejects.toThrow(LastSuperAdminError);
      await expect(service.removeUserFromRole('role-1', 'user-1')).rejects.toMatchObject({
        statusCode: 409,
      });
    });

    it('should allow removing SUPER_ADMIN when other SUPER_ADMIN exists', async () => {
      const mockSuperAdminRole = createTestRole({ id: 'role-1', name: 'SUPER_ADMIN' });
      (roleRepo.findById as Mock).mockResolvedValue(mockSuperAdminRole);
      (roleRepo.countSuperAdmins as Mock).mockResolvedValue(2);
      (roleRepo.removeUserFromRole as Mock).mockResolvedValue(undefined);

      await expect(service.removeUserFromRole('role-1', 'user-1')).resolves.toBeUndefined();
    });

    it('should throw RoleNotFoundError when role not found', async () => {
      (roleRepo.findById as Mock).mockResolvedValue(null);

      await expect(service.removeUserFromRole('role-1', 'user-1')).rejects.toThrow(RoleNotFoundError);
    });
  });

  describe('getRolePages', () => {
    it('should return pages for role', async () => {
      const mockRole = createTestRole({ id: 'role-1' });
      const mockPages = [createTestPage({ id: 'page-1' })];

      (roleRepo.findById as Mock).mockResolvedValue(mockRole);
      (rolePageRepo.findPagesByRoleId as Mock).mockResolvedValue(mockPages);

      const result = await service.getRolePages('role-1');

      expect(result).toEqual(mockPages);
      expect(rolePageRepo.findPagesByRoleId).toHaveBeenCalledWith('role-1');
    });

    it('should throw RoleNotFoundError when role not found', async () => {
      (roleRepo.findById as Mock).mockResolvedValue(null);

      await expect(service.getRolePages('role-1')).rejects.toThrow(RoleNotFoundError);
    });
  });

  describe('assignPageToRole', () => {
    it('should assign page to role', async () => {
      const mockRole = createTestRole({ id: 'role-1' });

      (roleRepo.findById as Mock).mockResolvedValue(mockRole);
      (rolePageRepo.assignPageToRole as Mock).mockResolvedValue(undefined);

      await expect(service.assignPageToRole('role-1', 'page-1')).resolves.toBeUndefined();
      expect(rolePageRepo.assignPageToRole).toHaveBeenCalledWith('role-1', 'page-1');
    });

    it('should throw PageNotFoundError on foreign key violation', async () => {
      const mockRole = createTestRole({ id: 'role-1' });
      const prismaError = { code: 'P2003' };

      (roleRepo.findById as Mock).mockResolvedValue(mockRole);
      (rolePageRepo.assignPageToRole as Mock).mockRejectedValue(prismaError);

      await expect(service.assignPageToRole('role-1', 'page-1')).rejects.toThrow(PageNotFoundError);
    });

    it('should throw RoleNotFoundError when role not found', async () => {
      (roleRepo.findById as Mock).mockResolvedValue(null);

      await expect(service.assignPageToRole('role-1', 'page-1')).rejects.toThrow(RoleNotFoundError);
    });
  });

  describe('unassignPageFromRole', () => {
    it('should unassign page from role', async () => {
      const mockRole = createTestRole({ id: 'role-1' });

      (roleRepo.findById as Mock).mockResolvedValue(mockRole);
      (rolePageRepo.unassignPageFromRole as Mock).mockResolvedValue(undefined);

      await expect(service.unassignPageFromRole('role-1', 'page-1')).resolves.toBeUndefined();
      expect(rolePageRepo.unassignPageFromRole).toHaveBeenCalledWith('role-1', 'page-1');
    });

    it('should throw RoleNotFoundError when role not found', async () => {
      (roleRepo.findById as Mock).mockResolvedValue(null);

      await expect(service.unassignPageFromRole('role-1', 'page-1')).rejects.toThrow(RoleNotFoundError);
    });
  });

  describe('getRoleNamesByUserId', () => {
    it('should return role names for user', async () => {
      const mockRoles = [createTestRole({ id: 'role-1', name: 'MEMBER' }), createTestRole({ id: 'role-2', name: 'ADMIN' })];
      (roleRepo.findRolesByUserId as Mock).mockResolvedValue(mockRoles);

      const result = await service.getRoleNamesByUserId('user-1');

      expect(result).toEqual(['MEMBER', 'ADMIN']);
      expect(roleRepo.findRolesByUserId).toHaveBeenCalledWith('user-1');
    });

    it('should return empty array when user has no roles', async () => {
      (roleRepo.findRolesByUserId as Mock).mockResolvedValue([]);

      const result = await service.getRoleNamesByUserId('user-1');

      expect(result).toEqual([]);
    });
  });

  describe('searchUsers', () => {
    it('should return users matching query', async () => {
      const mockUsers = [createTestUserData({ id: 'user-1', email: 'john@example.com' })];
      (roleRepo.searchUsers as Mock).mockResolvedValue(mockUsers);

      const result = await service.searchUsers('john');

      expect(result).toEqual(mockUsers);
      expect(roleRepo.searchUsers).toHaveBeenCalledWith('john');
    });
  });
});

// ============================================================================
// PageService Tests
// ============================================================================

describe('PageService', () => {
  let pageRepo: IPageRepository;
  let service: PageService;

  beforeEach(() => {
    pageRepo = createMockPageRepository();
    service = new PageService(pageRepo);
  });

  describe('findAll', () => {
    it('should return all pages from repository', async () => {
      const mockPages = [createTestPage({ id: 'page-1' }), createTestPage({ id: 'page-2' })];
      (pageRepo.findAll as Mock).mockResolvedValue(mockPages);

      const result = await service.findAll();

      expect(result).toEqual(mockPages);
      expect(pageRepo.findAll).toHaveBeenCalledTimes(1);
    });
  });

  describe('findById', () => {
    it('should return page when found', async () => {
      const mockPage = createTestPage({ id: 'page-1' });
      (pageRepo.findById as Mock).mockResolvedValue(mockPage);

      const result = await service.findById('page-1');

      expect(result).toEqual(mockPage);
      expect(pageRepo.findById).toHaveBeenCalledWith('page-1');
    });

    it('should throw PageNotFoundError when page not found', async () => {
      (pageRepo.findById as Mock).mockResolvedValue(null);

      await expect(service.findById('page-1')).rejects.toThrow(PageNotFoundError);
      await expect(service.findById('page-1')).rejects.toMatchObject({
        code: 'PAGE_NOT_FOUND',
        statusCode: 404,
      });
    });
  });

  describe('create', () => {
    it('should create page with valid data', async () => {
      const mockData = { path: '/dashboard/test', title: 'Test Page' };
      const mockPage = createTestPage({ id: 'page-1', path: '/dashboard/test' });

      (pageRepo.findByPath as Mock).mockResolvedValue(null);
      (pageRepo.create as Mock).mockResolvedValue(mockPage);

      const result = await service.create(mockData);

      expect(result).toEqual(mockPage);
      expect(pageRepo.create).toHaveBeenCalledWith({
        path: '/dashboard/test',
        title: 'Test Page',
        groupName: undefined,
        sortOrder: 0,
        isActive: true,
      });
    });

    it('should reject duplicate path', async () => {
      const mockData = { path: '/dashboard/members', title: 'Test Page' };
      const mockExistingPage = createTestPage({ path: '/dashboard/members' });

      (pageRepo.findByPath as Mock).mockResolvedValue(mockExistingPage);

      await expect(service.create(mockData)).rejects.toThrow(PageDuplicateError);
      await expect(service.create(mockData)).rejects.toMatchObject({
        statusCode: 409,
      });
    });

    it('should reject duplicate path on P2002 error', async () => {
      const mockData = { path: '/dashboard/members', title: 'Test Page' };
      (pageRepo.findByPath as Mock).mockResolvedValue(null);
      const prismaError = { code: 'P2002' };
      (pageRepo.create as Mock).mockRejectedValue(prismaError);

      await expect(service.create(mockData)).rejects.toThrow(PageDuplicateError);
    });

    it('should throw ZodError on validation error', async () => {
      const invalidData = { path: 'invalid-path', title: 'Test' };

      await expect(service.create(invalidData)).rejects.toThrow();
    });
  });

  describe('update', () => {
    it('should update page with valid data', async () => {
      const mockPage = createTestPage({ id: 'page-1' });
      const mockData = { title: 'Updated Title' };
      const mockUpdatedPage = createTestPage({ id: 'page-1', title: 'Updated Title' });

      (pageRepo.findById as Mock).mockResolvedValue(mockPage);
      (pageRepo.findByPath as Mock).mockResolvedValue(null);
      (pageRepo.update as Mock).mockResolvedValue(mockUpdatedPage);

      const result = await service.update('page-1', mockData);

      expect(result).toEqual(mockUpdatedPage);
      expect(pageRepo.update).toHaveBeenCalledWith('page-1', {
        title: 'Updated Title',
      });
    });

    it('should throw PageNotFoundError when page not found', async () => {
      (pageRepo.findById as Mock).mockResolvedValue(null);

      await expect(service.update('page-1', { title: 'New' })).rejects.toThrow(PageNotFoundError);
    });

    it('should reject duplicate path on update', async () => {
      const mockPage = createTestPage({ id: 'page-1', path: '/dashboard/old' });
      const mockExistingPage = createTestPage({ id: 'page-2', path: '/dashboard/new' });
      const mockData = { path: '/dashboard/new' };

      (pageRepo.findById as Mock).mockResolvedValue(mockPage);
      (pageRepo.findByPath as Mock).mockResolvedValue(mockExistingPage);

      await expect(service.update('page-1', mockData)).rejects.toThrow(PageDuplicateError);
    });

    it('should not reject path when not changing path', async () => {
      const mockPage = createTestPage({ id: 'page-1' });
      const mockData = { title: 'Updated' };
      const mockUpdatedPage = createTestPage({ id: 'page-1', title: 'Updated' });

      (pageRepo.findById as Mock).mockResolvedValue(mockPage);
      (pageRepo.findByPath as Mock).mockResolvedValue(mockPage);
      (pageRepo.update as Mock).mockResolvedValue(mockUpdatedPage);

      const result = await service.update('page-1', mockData);

      expect(result).toEqual(mockUpdatedPage);
    });
  });

  describe('delete', () => {
    it('should delete page when it exists', async () => {
      const mockPage = createTestPage({ id: 'page-1' });

      (pageRepo.findById as Mock).mockResolvedValue(mockPage);

      await expect(service.delete('page-1')).resolves.toBeUndefined();
      expect(pageRepo.delete).toHaveBeenCalledWith('page-1');
    });

    it('should throw PageNotFoundError when page not found', async () => {
      (pageRepo.findById as Mock).mockResolvedValue(null);

      await expect(service.delete('page-1')).rejects.toThrow(PageNotFoundError);
    });
  });
});

// ============================================================================
// ApiEndpointService Tests
// ============================================================================

describe('ApiEndpointService', () => {
  let endpointRepo: IApiEndpointRepository;
  let service: ApiEndpointService;

  beforeEach(() => {
    endpointRepo = createMockApiEndpointRepository();
    service = new ApiEndpointService(endpointRepo);
  });

  describe('findAll', () => {
    it('should return all endpoints from repository', async () => {
      const mockEndpoints = [createTestApiEndpoint({ id: 'ep-1' }), createTestApiEndpoint({ id: 'ep-2' })];
      (endpointRepo.findAll as Mock).mockResolvedValue(mockEndpoints);

      const result = await service.findAll();

      expect(result).toEqual(mockEndpoints);
      expect(endpointRepo.findAll).toHaveBeenCalledTimes(1);
    });
  });

  describe('findById', () => {
    it('should return endpoint when found', async () => {
      const mockEndpoint = createTestApiEndpoint({ id: 'ep-1' });
      (endpointRepo.findById as Mock).mockResolvedValue(mockEndpoint);

      const result = await service.findById('ep-1');

      expect(result).toEqual(mockEndpoint);
      expect(endpointRepo.findById).toHaveBeenCalledWith('ep-1');
    });

    it('should throw ApiEndpointNotFoundError when endpoint not found', async () => {
      (endpointRepo.findById as Mock).mockResolvedValue(null);

      await expect(service.findById('ep-1')).rejects.toThrow(ApiEndpointNotFoundError);
      await expect(service.findById('ep-1')).rejects.toMatchObject({
        code: 'API_ENDPOINT_NOT_FOUND',
        statusCode: 404,
      });
    });
  });

  describe('findByMethodAndPath', () => {
    it('should return endpoint when found', async () => {
      const mockEndpoint = createTestApiEndpoint({ id: 'ep-1', method: 'GET', path: '/api/members' });
      (endpointRepo.findByMethodAndPath as Mock).mockResolvedValue(mockEndpoint);

      const result = await service.findByMethodAndPath('GET', '/api/members');

      expect(result).toEqual(mockEndpoint);
      expect(endpointRepo.findByMethodAndPath).toHaveBeenCalledWith('GET', '/api/members');
    });

    it('should return null when endpoint not found', async () => {
      (endpointRepo.findByMethodAndPath as Mock).mockResolvedValue(null);

      const result = await service.findByMethodAndPath('GET', '/api/members');

      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('should create endpoint with valid data', async () => {
      const mockData = { method: 'GET', path: '/api/v1/test' };
      const mockEndpoint = createTestApiEndpoint({ id: 'ep-1', method: 'GET', path: '/api/v1/test' });

      (endpointRepo.findByMethodAndPath as Mock).mockResolvedValue(null);
      (endpointRepo.create as Mock).mockResolvedValue(mockEndpoint);

      const result = await service.create(mockData);

      expect(result).toEqual(mockEndpoint);
      expect(endpointRepo.create).toHaveBeenCalledWith({
        method: 'GET',
        path: '/api/v1/test',
        description: undefined,
        accessType: 'role',
        isActive: true,
      });
    });

    it('should reject duplicate method+path', async () => {
      const mockData = { method: 'GET', path: '/api/v1/members' };
      const mockExistingEndpoint = createTestApiEndpoint({ method: 'GET', path: '/api/v1/members' });

      (endpointRepo.findByMethodAndPath as Mock).mockResolvedValue(mockExistingEndpoint);

      await expect(service.create(mockData)).rejects.toThrow(ApiEndpointDuplicateError);
      await expect(service.create(mockData)).rejects.toMatchObject({
        statusCode: 409,
      });
    });

    it('should reject duplicate method+path on P2002 error', async () => {
      const mockData = { method: 'POST', path: '/api/v1/test' };
      (endpointRepo.findByMethodAndPath as Mock).mockResolvedValue(null);
      const prismaError = { code: 'P2002' };
      (endpointRepo.create as Mock).mockRejectedValue(prismaError);

      await expect(service.create(mockData)).rejects.toThrow(ApiEndpointDuplicateError);
    });

    it('should throw ZodError on validation error', async () => {
      const invalidData = { method: 'INVALID', path: '/api/test' };

      await expect(service.create(invalidData)).rejects.toThrow();
    });
  });

  describe('update', () => {
    it('should update endpoint with valid data', async () => {
      const mockEndpoint = createTestApiEndpoint({ id: 'ep-1' });
      const mockData = { description: 'Updated description' };
      const mockUpdatedEndpoint = createTestApiEndpoint({ id: 'ep-1', description: 'Updated description' });

      (endpointRepo.findById as Mock).mockResolvedValue(mockEndpoint);
      (endpointRepo.findByMethodAndPath as Mock).mockResolvedValue(null);
      (endpointRepo.update as Mock).mockResolvedValue(mockUpdatedEndpoint);

      const result = await service.update('ep-1', mockData);

      expect(result).toEqual(mockUpdatedEndpoint);
      expect(endpointRepo.update).toHaveBeenCalledWith('ep-1', {
        description: 'Updated description',
      });
    });

    it('should throw ApiEndpointNotFoundError when endpoint not found', async () => {
      (endpointRepo.findById as Mock).mockResolvedValue(null);

      await expect(service.update('ep-1', { description: 'Test' })).rejects.toThrow(ApiEndpointNotFoundError);
    });

    it('should reject duplicate method+path on update', async () => {
      const mockEndpoint = createTestApiEndpoint({ id: 'ep-1', method: 'GET', path: '/api/old' });
      const mockExistingEndpoint = createTestApiEndpoint({ id: 'ep-2', method: 'GET', path: '/api/new' });
      const mockData = { path: '/api/new' };

      (endpointRepo.findById as Mock).mockResolvedValue(mockEndpoint);
      (endpointRepo.findByMethodAndPath as Mock).mockResolvedValue(mockExistingEndpoint);

      await expect(service.update('ep-1', mockData)).rejects.toThrow(ApiEndpointDuplicateError);
    });

    it('should allow update when path not changing', async () => {
      const mockEndpoint = createTestApiEndpoint({ id: 'ep-1' });
      const mockData = { description: 'Updated' };
      const mockUpdatedEndpoint = createTestApiEndpoint({ id: 'ep-1', description: 'Updated' });

      (endpointRepo.findById as Mock).mockResolvedValue(mockEndpoint);
      (endpointRepo.findByMethodAndPath as Mock).mockResolvedValue(mockEndpoint);
      (endpointRepo.update as Mock).mockResolvedValue(mockUpdatedEndpoint);

      const result = await service.update('ep-1', mockData);

      expect(result).toEqual(mockUpdatedEndpoint);
    });
  });

  describe('delete', () => {
    it('should delete endpoint when it exists', async () => {
      const mockEndpoint = createTestApiEndpoint({ id: 'ep-1' });

      (endpointRepo.findById as Mock).mockResolvedValue(mockEndpoint);

      await expect(service.delete('ep-1')).resolves.toBeUndefined();
      expect(endpointRepo.delete).toHaveBeenCalledWith('ep-1');
    });

    it('should throw ApiEndpointNotFoundError when endpoint not found', async () => {
      (endpointRepo.findById as Mock).mockResolvedValue(null);

      await expect(service.delete('ep-1')).rejects.toThrow(ApiEndpointNotFoundError);
    });
  });
});

// ============================================================================
// RoleApiEndpointService Tests
// ============================================================================

describe('RoleApiEndpointService', () => {
  let roleEndpointRepo: IRoleApiEndpointRepository;
  let service: RoleApiEndpointService;

  beforeEach(() => {
    roleEndpointRepo = createMockRoleApiEndpointRepository();
    service = new RoleApiEndpointService(roleEndpointRepo);
  });

  describe('getRoleEndpoints', () => {
    it('should return endpoints for role', async () => {
      const mockEndpoints = [createTestApiEndpoint({ id: 'ep-1' })];
      (roleEndpointRepo.findEndpointsByRoleId as Mock).mockResolvedValue(mockEndpoints);

      const result = await service.getRoleEndpoints('role-1');

      expect(result).toEqual(mockEndpoints);
      expect(roleEndpointRepo.findEndpointsByRoleId).toHaveBeenCalledWith('role-1');
    });

    it('should return empty array when role has no endpoints', async () => {
      (roleEndpointRepo.findEndpointsByRoleId as Mock).mockResolvedValue([]);

      const result = await service.getRoleEndpoints('role-1');

      expect(result).toEqual([]);
    });
  });

  describe('assignEndpointToRole', () => {
    it('should assign endpoint to role', async () => {
      (roleEndpointRepo.assignEndpointToRole as Mock).mockResolvedValue(undefined);

      await expect(service.assignEndpointToRole('role-1', 'ep-1')).resolves.toBeUndefined();
      expect(roleEndpointRepo.assignEndpointToRole).toHaveBeenCalledWith('role-1', 'ep-1');
    });

    it('should throw ApiEndpointNotFoundError on foreign key violation', async () => {
      const prismaError = { code: 'P2003' };
      (roleEndpointRepo.assignEndpointToRole as Mock).mockRejectedValue(prismaError);

      await expect(service.assignEndpointToRole('role-1', 'ep-1')).rejects.toThrow(ApiEndpointNotFoundError);
    });
  });

  describe('unassignEndpointFromRole', () => {
    it('should unassign endpoint from role', async () => {
      (roleEndpointRepo.unassignEndpointFromRole as Mock).mockResolvedValue(undefined);

      await expect(service.unassignEndpointFromRole('role-1', 'ep-1')).resolves.toBeUndefined();
      expect(roleEndpointRepo.unassignEndpointFromRole).toHaveBeenCalledWith('role-1', 'ep-1');
    });
  });
});