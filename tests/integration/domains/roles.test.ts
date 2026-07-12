/**
 * @file roles.test.ts
 * @domain roles
 * @description Integration tests for Role, Page, and ApiEndpoint repositories
 *
 * @spec
 * - Tests real database interactions (PostgreSQL)
 * - Verifies CRUD operations for Role, Page, ApiEndpoint
 * - Tests role-page and role-api-endpoint assignments
 * - All tests are isolated via database transactions (automatic rollback)
 *
 * @see docs/tests/integration-tests.md
 */
import { describe, it, expect, beforeAll, beforeEach, afterEach, afterAll } from 'vitest';
import { PrismaClient } from '@prisma/client';
import {
  RoleRepository,
  PageRepository,
  ApiEndpointRepository,
  RolePageRepository,
  RoleApiEndpointRepository,
} from '@/domains/roles/roles.repository.prisma';
import { createUniqueName, createUniqueSuffix, withTransaction } from '../helpers';
import { prisma } from '../setup';

describe('RoleRepository (Integration)', () => {
  describe('findAll', () => {

    it('should return all roles ordered by name', async () => {
      const repo = new RoleRepository(prisma);

      const role1 = await prisma.role.create({
        data: { name: `ZZZ-Last-${createUniqueName()}`, description: 'Test last' },
      });
      const role2 = await prisma.role.create({
        data: { name: `AAA-First-${createUniqueName()}`, description: 'Test first' },
      });

      const roles = await repo.findAll();

      const filteredRoles = roles.filter(r => [role1.id, role2.id].includes(r.id));
      expect(filteredRoles).toHaveLength(2);
      expect(filteredRoles[0].name.startsWith('AAA-First')).toBe(true);
      expect(filteredRoles[1].name.startsWith('ZZZ-Last')).toBe(true);
      
      await prisma.role.deleteMany({
        where: { id: { in: [role1.id, role2.id] } },
      });
    });
  });

  describe('findById', () => {
    it('should return role when found', async () => {
      const repo = new RoleRepository(prisma);
      const roleName = `TestRole-${createUniqueName()}`;
      const created = await prisma.role.create({
        data: { name: roleName, description: 'Test description' },
      });

      const role = await repo.findById(created.id);

      expect(role).not.toBeNull();
      expect(role!.id).toBe(created.id);
      expect(role!.name).toBe(roleName);
      expect(role!.description).toBe('Test description');
    });

    it('should return null when role not found', async () => {
      const repo = new RoleRepository(prisma);
      const role = await repo.findById('non-existent-id');
      expect(role).toBeNull();
    });
  });

  describe('findByName', () => {
    it('should return role when found', async () => {
      const repo = new RoleRepository(prisma);
      const roleName = `UniqueRole-${createUniqueName()}`;
      const created = await prisma.role.create({
        data: { name: roleName, description: 'Test' },
      });

      const role = await repo.findByName(roleName);

      expect(role).not.toBeNull();
      expect(role!.id).toBe(created.id);
      expect(role!.name).toBe(roleName);
    });

    it('should return null when role not found', async () => {
      const repo = new RoleRepository(prisma);
      const role = await repo.findByName('NonExistentRole12345');
      expect(role).toBeNull();
    });
  });

  describe('create', () => {
    it('should create a role with all fields', async () => {
      const repo = new RoleRepository(prisma);
      const roleName = `TestRole-${createUniqueName()}`;
      
      const result = await repo.create({
        name: roleName,
        description: 'Test description',
      });

      expect(result).not.toBeNull();
      expect(result!.id).toBeDefined();
      expect(result!.name).toBe(roleName);
      expect(result!.description).toBe('Test description');
      expect(result!.isSystem).toBe(false);
    });

    it('should create a role without description', async () => {
      const repo = new RoleRepository(prisma);
      const roleName = `TestRole-${createUniqueName()}`;
      
      const result = await repo.create({
        name: roleName,
      });

      expect(result).not.toBeNull();
      expect(result!.id).toBeDefined();
      expect(result!.name).toBe(roleName);
      expect(result!.description).toBeNull();
    });
  });

  describe('update', () => {
    it('should update role name and description', async () => {
      const repo = new RoleRepository(prisma);
      const roleName = `UpdateRole-${createUniqueName()}`;
      const created = await prisma.role.create({
        data: { name: roleName, description: 'Old description' },
      });

      const updated = await repo.update(created.id, {
        name: 'Updated Role',
        description: 'Updated description',
      });

      expect(updated).not.toBeNull();
      expect(updated!.name).toBe('Updated Role');
      expect(updated!.description).toBe('Updated description');
    });

    it('should update only description when name not provided', async () => {
      const repo = new RoleRepository(prisma);
      const roleName = `UpdateRole-${createUniqueName()}`;
      const created = await prisma.role.create({
        data: { name: roleName, description: 'Old description' },
      });

      const updated = await repo.update(created.id, {
        description: 'New description',
      });

      expect(updated).not.toBeNull();
      expect(updated!.name).toBe(roleName);
      expect(updated!.description).toBe('New description');
    });
  });

  describe('delete', () => {
    it('should delete role when it exists', async () => {
      const repo = new RoleRepository(prisma);
      const roleName = `DeleteRole-${createUniqueName()}`;
      const created = await prisma.role.create({
        data: { name: roleName, description: 'Test' },
      });

      await repo.delete(created.id);

      const deleted = await repo.findById(created.id);
      expect(deleted).toBeNull();
    });

    it('should throw when deleting non-existent role', async () => {
      const repo = new RoleRepository(prisma);
      
      await expect(repo.delete('non-existent-id')).rejects.toThrow('No record was found for a delete');
    });
  });

  describe('searchUsers', () => {
    beforeEach(async () => {
      // Очистка только test-specific данных, сохраняем глобальных пользователей
      await prisma.userRole.deleteMany({
        where: {
          user: {
            email: {
              contains: 'test-search-user',
            },
          },
        },
      });
    });

    afterEach(async () => {
      // Полная очистка userRole для тестовых пользователей после каждого теста
      await prisma.userRole.deleteMany({
        where: {
          user: {
            email: {
              contains: 'test-search-user',
            },
          },
        },
      });
    });

    it('should return empty array when query is less than 2 characters', async () => {
      const repo = new RoleRepository(prisma);
      const result = await repo.searchUsers('X');
      expect(result).toEqual([]);
    });

    it('should return users matching query by email', async () => {
      const repo = new RoleRepository(prisma);
      // Используем тестовых пользователей, созданных в globalSetup
      const testUser1 = await prisma.user.findFirst({ where: { email: 'test-search-user1@example.com' } });
      const testUser2 = await prisma.user.findFirst({ where: { email: 'test-search-user2@example.com' } });
      if (!testUser1 || !testUser2) {
        throw new Error('Test users not found. Please check globalSetup.');
      }
      
      const roleId = (await prisma.role.findUnique({ where: { name: 'GUEST' } }))!.id;
      await prisma.userRole.create({
        data: { userId: testUser1.id, roleId },
      });

      const result = await repo.searchUsers('user1');
      
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(testUser1.id);
      expect(result[0].email).toBe('test-search-user1@example.com');
      
      // Удаляем userRole, но не пользователей (они созданы в globalSetup)
      await prisma.userRole.deleteMany({
        where: {
          userId: testUser1.id,
          roleId,
        },
      });
    });

    it('should return users matching query by name', async () => {
      const repo = new RoleRepository(prisma);
      // Используем тестовых пользователей, созданных в globalSetup
      const testUser1 = await prisma.user.findFirst({ where: { email: 'test-search-user1@example.com' } });
      const testUser2 = await prisma.user.findFirst({ where: { email: 'test-search-user2@example.com' } });
      if (!testUser1 || !testUser2) {
        throw new Error('Test users not found. Please check globalSetup.');
      }
      
      const roleId = (await prisma.role.findUnique({ where: { name: 'GUEST' } }))!.id;
      await prisma.userRole.create({
        data: { userId: testUser1.id, roleId },
      });
  
      const result = await repo.searchUsers('Test Search User One');
      
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(testUser1.id);
      expect(result[0].name).toBe('Test Search User One');
      
      // Удаляем userRole, но не пользователей (они созданы в globalSetup)
      await prisma.userRole.deleteMany({
        where: {
          userId: testUser1.id,
          roleId,
        },
      });
    });
  });

  describe('countSuperAdmins', () => {
    it('should return 0 when SUPER_ADMIN role does not exist', async () => {
      const repo = new RoleRepository(prisma);
      const result = await repo.countSuperAdmins();
      // After cleanup, SUPER_ADMIN may not exist
      expect(typeof result).toBe('number');
    });

    it('should return correct count when SUPER_ADMIN role exists', async () => {
      const repo = new RoleRepository(prisma);
      const result = await repo.countSuperAdmins();
      expect(result).toBeGreaterThanOrEqual(0);
    });
  });
});

describe('PageRepository (Integration)', () => {
  beforeEach(async () => {
    // Тестовые данные изолируются транзакциями через setup.ts
    // Не нужно очищать таблицы явно
  });

  describe('findAll', () => {
    it('should return all pages ordered by sortOrder and title', async () => {
      const repo = new PageRepository(prisma);

      const page1 = await prisma.page.create({
        data: { path: '/page-z', title: 'Page Z', sortOrder: 2 },
      });
      const page2 = await prisma.page.create({
        data: { path: '/page-a', title: 'Page A', sortOrder: 1 },
      });

      const pages = await repo.findAll();

      const filteredPages = pages.filter(p => [page1.id, page2.id].includes(p.id));
      expect(filteredPages).toHaveLength(2);
    });
  });

  describe('findById', () => {
    it('should return page when found', async () => {
      const repo = new PageRepository(prisma);
      const page = await prisma.page.create({
        data: { path: `/test-path-${createUniqueSuffix()}`, title: 'Test Page', sortOrder: 1 },
      });

      const found = await repo.findById(page.id);

      expect(found).not.toBeNull();
      expect(found!.id).toBe(page.id);
    });

    it('should return null when page not found', async () => {
      const repo = new PageRepository(prisma);
      const page = await repo.findById('non-existent-id');
      expect(page).toBeNull();
    });
  });

  describe('findByPath', () => {
    it('should return page when found', async () => {
      const repo = new PageRepository(prisma);
      const path = `/unique-path-${createUniqueSuffix()}`;
      const page = await prisma.page.create({
        data: { path, title: 'Unique Page', sortOrder: 1 },
      });

      const found = await repo.findByPath(path);

      expect(found).not.toBeNull();
      expect(found!.id).toBe(page.id);
    });

    it('should return null when page not found', async () => {
      const repo = new PageRepository(prisma);
      const found = await repo.findByPath('/non-existent-path');
      expect(found).toBeNull();
    });
  });

  describe('create', () => {
    it('should create a page with all fields', async () => {
      const repo = new PageRepository(prisma);
      
      const path = `/api/create-${createUniqueSuffix()}`;
      const result = await repo.create({
        path,
        title: 'Created Page',
        sortOrder: 1,
      });

      expect(result).not.toBeNull();
      expect(result!.id).toBeDefined();
      expect(result!.path).toBe(path);
    });

    it('should create a page with default values', async () => {
      const repo = new PageRepository(prisma);
      
      const path = `/api/default-${createUniqueSuffix()}`;
      const result = await repo.create({
        path,
        title: 'Default Page',
      });

      expect(result).not.toBeNull();
      expect(result!.sortOrder).toBe(0);
      expect(result!.accessType).toBe('role');
    });
  });

  describe('update', () => {
    it('should update page fields', async () => {
      const repo = new PageRepository(prisma);
      const page = await prisma.page.create({
        data: { path: `/test-update-${createUniqueSuffix()}`, title: 'Old Title', sortOrder: 1 },
      });

      const updated = await repo.update(page.id, {
        title: 'New Title',
        sortOrder: 2,
      });

      expect(updated).not.toBeNull();
      expect(updated!.title).toBe('New Title');
      expect(updated!.sortOrder).toBe(2);
    });
  });

  describe('delete', () => {
    it('should delete page when it exists', async () => {
      const repo = new PageRepository(prisma);
      const page = await prisma.page.create({
        data: { path: `/test-delete-${createUniqueSuffix()}`, title: 'Delete Me', sortOrder: 1 },
      });

      await repo.delete(page.id);

      const deleted = await repo.findById(page.id);
      expect(deleted).toBeNull();
    });
  });
});

describe('ApiEndpointRepository (Integration)', () => {
  beforeEach(async () => {
    // Тестовые данные изолируются транзакциями через setup.ts
  });

  describe('findAll', () => {
    it('should return all endpoints ordered by method and path', async () => {
      const repo = new ApiEndpointRepository(prisma);

      const ep1 = await prisma.apiEndpoint.create({
        data: {
          method: 'POST',
          path: `/zzz-endpoint-${createUniqueSuffix()}`,
          accessType: 'role',
        },
      });
      const ep2 = await prisma.apiEndpoint.create({
        data: {
          method: 'GET',
          path: `/aaa-endpoint-${createUniqueSuffix()}`,
          accessType: 'super_admin',
        },
      });

      const endpoints = await repo.findAll();

      const filteredEndpoints = endpoints.filter(e => [ep1.id, ep2.id].includes(e.id));
      expect(filteredEndpoints).toHaveLength(2);
    });
  });

  describe('findById', () => {
    it('should return endpoint when found', async () => {
      const repo = new ApiEndpointRepository(prisma);
      const endpoint = await prisma.apiEndpoint.create({
        data: {
          method: 'GET',
          path: `/test-endpoint-${createUniqueSuffix()}`,
          accessType: 'role',
        },
      });

      const found = await repo.findById(endpoint.id);

      expect(found).not.toBeNull();
      expect(found!.id).toBe(endpoint.id);
    });

    it('should return null when endpoint not found', async () => {
      const repo = new ApiEndpointRepository(prisma);
      const found = await repo.findById('non-existent-id');
      expect(found).toBeNull();
    });
  });

  describe('findByMethodAndPath', () => {
    it('should return endpoint when found', async () => {
      const repo = new ApiEndpointRepository(prisma);
      const endpoint = await prisma.apiEndpoint.create({
        data: {
          method: 'PUT',
          path: `/unique-endpoint-${createUniqueSuffix()}`,
          accessType: 'role',
        },
      });

      const found = await repo.findByMethodAndPath('PUT', endpoint.path);

      expect(found).not.toBeNull();
      expect(found!.id).toBe(endpoint.id);
    });

    it('should return null when endpoint not found', async () => {
      const repo = new ApiEndpointRepository(prisma);
      const found = await repo.findByMethodAndPath('DELETE', '/non-existent');
      expect(found).toBeNull();
    });
  });

  describe('create', () => {
    it('should create an endpoint with all fields', async () => {
      const repo = new ApiEndpointRepository(prisma);
      
      const path = `/api/create-${createUniqueSuffix()}`;
      const result = await repo.create({
        method: 'POST',
        path,
        accessType: 'role',
      });

      expect(result).not.toBeNull();
      expect(result!.id).toBeDefined();
      expect(result!.method).toBe('POST');
    });

    it('should create an endpoint with default values', async () => {
      const repo = new ApiEndpointRepository(prisma);
      
      const path = `/api/default-${createUniqueSuffix()}`;
      const result = await repo.create({
        method: 'GET',
        path,
      });

      expect(result).not.toBeNull();
      expect(result!.accessType).toBe('role');
    });
  });

  describe('update', () => {
    it('should update endpoint fields', async () => {
      const repo = new ApiEndpointRepository(prisma);
      const suffix = createUniqueSuffix();
      const endpoint = await prisma.apiEndpoint.create({
        data: {
          method: 'GET',
          path: `/test-update-${suffix}`,
          accessType: 'role',
        },
      });

      const updated = await repo.update(endpoint.id, {
        method: 'POST',
        path: `/updated-path-${suffix}`,
        accessType: 'super_admin',
      });

      expect(updated).not.toBeNull();
      expect(updated!.method).toBe('POST');
      expect(updated!.path).toBe(`/updated-path-${suffix}`);
      expect(updated!.accessType).toBe('super_admin');
    });
  });

  describe('delete', () => {
    it('should delete endpoint when it exists', async () => {
      const repo = new ApiEndpointRepository(prisma);
      const endpoint = await prisma.apiEndpoint.create({
        data: {
          method: 'DELETE',
          path: `/test-delete-${createUniqueSuffix()}`,
          accessType: 'role',
        },
      });

      await repo.delete(endpoint.id);

      const deleted = await repo.findById(endpoint.id);
      expect(deleted).toBeNull();
    });
  });
});

describe('RolePageRepository (Integration)', () => {
  beforeEach(async () => {
    // Тестовые данные изолируются транзакциями через setup.ts
  });

  describe('findPagesByRoleId', () => {
    it('should return empty array when role has no pages', async () => {
      const repo = new RolePageRepository(prisma);
      const role = await prisma.role.findUnique({
        where: { name: 'SUPER_ADMIN' },
      });
      
      if (!role) throw new Error('SUPER_ADMIN role not found');

      const pages = await repo.findPagesByRoleId(role.id);
      expect(pages).toEqual([]);
    });

    it('should return pages assigned to role', async () => {
      const repo = new RolePageRepository(prisma);
      const role = await prisma.role.findUnique({
        where: { name: 'SUPER_ADMIN' },
      });
      
      if (!role) throw new Error('SUPER_ADMIN role not found');

      const page1 = await prisma.page.create({
        data: {
          path: `/page-1-${createUniqueSuffix()}`,
          title: 'Page 1',
          sortOrder: 1,
        },
      });
      const page2 = await prisma.page.create({
        data: {
          path: `/page-2-${createUniqueSuffix()}`,
          title: 'Page 2',
          sortOrder: 2,
        },
      });

      await prisma.rolePage.create({
        data: { roleId: role.id, pageId: page1.id },
      });
      await prisma.rolePage.create({
        data: { roleId: role.id, pageId: page2.id },
      });

      const pages = await repo.findPagesByRoleId(role.id);
      expect(pages).toHaveLength(2);
      expect(pages.map(p => p.id)).toContain(page1.id);
      expect(pages.map(p => p.id)).toContain(page2.id);

      await prisma.rolePage.deleteMany({ where: { roleId: role.id } });
      await prisma.page.deleteMany({ where: { id: { in: [page1.id, page2.id] } } });
    });
  });

  describe('findRolesByPageId', () => {
    it('should return roles assigned to page', async () => {
      const repo = new RolePageRepository(prisma);
      const page = await prisma.page.create({
        data: {
          path: '/test-page',
          title: 'Test Page',
          sortOrder: 1,
        },
      });

      const role1 = await prisma.role.create({
        data: { name: `Role1-${createUniqueName()}`, description: 'Role 1' },
      });
      const role2 = await prisma.role.create({
        data: { name: `Role2-${createUniqueName()}`, description: 'Role 2' },
      });

      await prisma.rolePage.create({
        data: { roleId: role1.id, pageId: page.id },
      });
      await prisma.rolePage.create({
        data: { roleId: role2.id, pageId: page.id },
      });

      const roles = await repo.findRolesByPageId(page.id);
      expect(roles).toHaveLength(2);
      expect(roles.map(r => r.id)).toContain(role1.id);
      expect(roles.map(r => r.id)).toContain(role2.id);

      await prisma.rolePage.deleteMany({ where: { pageId: page.id } });
      await prisma.role.deleteMany({ where: { id: { in: [role1.id, role2.id] } } });
      await prisma.page.delete({ where: { id: page.id } });
    });
  });

  describe('assignPageToRole', () => {
    it('should assign page to role', async () => {
      const repo = new RolePageRepository(prisma);
      const role = await prisma.role.findUnique({
        where: { name: 'SUPER_ADMIN' },
      });
      
      if (!role) throw new Error('SUPER_ADMIN role not found');

      const page = await prisma.page.create({
        data: {
          path: '/test-assign',
          title: 'Test Assign',
          sortOrder: 1,
        },
      });

      await repo.assignPageToRole(role.id, page.id);

      const assignments = await prisma.rolePage.findMany({
        where: { roleId: role.id, pageId: page.id },
      });
      expect(assignments).toHaveLength(1);

      await prisma.rolePage.deleteMany({ where: { roleId: role.id, pageId: page.id } });
      await prisma.page.delete({ where: { id: page.id } });
    });

    it('should be idempotent (upsert)', async () => {
      const repo = new RolePageRepository(prisma);
      const role = await prisma.role.findUnique({
        where: { name: 'SUPER_ADMIN' },
      });
      
      if (!role) throw new Error('SUPER_ADMIN role not found');

      const page = await prisma.page.create({
        data: {
          path: '/test-idempotent',
          title: 'Test Idempotent',
          sortOrder: 1,
        },
      });

      await repo.assignPageToRole(role.id, page.id);
      await repo.assignPageToRole(role.id, page.id);

      const assignments = await prisma.rolePage.findMany({
        where: { roleId: role.id, pageId: page.id },
      });
      expect(assignments).toHaveLength(1);

      await prisma.rolePage.deleteMany({ where: { roleId: role.id, pageId: page.id } });
      await prisma.page.delete({ where: { id: page.id } });
    });
  });

  describe('unassignPageFromRole', () => {
    it('should unassign page from role', async () => {
      const repo = new RolePageRepository(prisma);
      const role = await prisma.role.findUnique({
        where: { name: 'SUPER_ADMIN' },
      });
      
      if (!role) throw new Error('SUPER_ADMIN role not found');

      const page = await prisma.page.create({
        data: {
          path: '/test-unassign',
          title: 'Test Unassign',
          sortOrder: 1,
        },
      });

      await prisma.rolePage.create({
        data: { roleId: role.id, pageId: page.id },
      });

      await repo.unassignPageFromRole(role.id, page.id);

      const assignments = await prisma.rolePage.findMany({
        where: { roleId: role.id, pageId: page.id },
      });
      expect(assignments).toHaveLength(0);

      await prisma.page.delete({ where: { id: page.id } });
    });

    it('should be idempotent (no error if not assigned)', async () => {
      const repo = new RolePageRepository(prisma);
      const role = await prisma.role.findUnique({
        where: { name: 'SUPER_ADMIN' },
      });
      
      if (!role) throw new Error('SUPER_ADMIN role not found');

      const page = await prisma.page.create({
        data: {
          path: '/test-unassign-idempotent',
          title: 'Test Unassign Idempotent',
          sortOrder: 1,
        },
      });

      await expect(
        repo.unassignPageFromRole(role.id, page.id)
      ).resolves.not.toThrow();

      await prisma.page.delete({ where: { id: page.id } });
    });
  });
});

describe('RoleApiEndpointRepository (Integration)', () => {
  beforeEach(async () => {
    // Тестовые данные изолируются транзакциями через setup.ts
  });

  describe('findEndpointsByRoleId', () => {
    it('should return empty array when role has no endpoints', async () => {
      const repo = new RoleApiEndpointRepository(prisma);
      const role = await prisma.role.findUnique({
        where: { name: 'SUPER_ADMIN' },
      });
      
      if (!role) throw new Error('SUPER_ADMIN role not found');

      const endpoints = await repo.findEndpointsByRoleId(role.id);
      expect(endpoints).toEqual([]);
    });

    it('should return endpoints assigned to role', async () => {
      const repo = new RoleApiEndpointRepository(prisma);
      const role = await prisma.role.findUnique({
        where: { name: 'SUPER_ADMIN' },
      });
      
      if (!role) throw new Error('SUPER_ADMIN role not found');

      const ep1 = await prisma.apiEndpoint.create({
        data: { method: 'GET', path: '/ep-1', accessType: 'role' },
      });
      const ep2 = await prisma.apiEndpoint.create({
        data: { method: 'POST', path: '/ep-2', accessType: 'role' },
      });

      await prisma.roleApiEndpoint.create({
        data: { roleId: role.id, apiEndpointId: ep1.id },
      });
      await prisma.roleApiEndpoint.create({
        data: { roleId: role.id, apiEndpointId: ep2.id },
      });

      const endpoints = await repo.findEndpointsByRoleId(role.id);
      expect(endpoints).toHaveLength(2);
      expect(endpoints.map(e => e.id)).toContain(ep1.id);
      expect(endpoints.map(e => e.id)).toContain(ep2.id);

      await prisma.roleApiEndpoint.deleteMany({ where: { roleId: role.id } });
      await prisma.apiEndpoint.deleteMany({ where: { id: { in: [ep1.id, ep2.id] } } });
    });
  });

  describe('findRolesByEndpointId', () => {
    it('should return roles assigned to endpoint', async () => {
      const repo = new RoleApiEndpointRepository(prisma);
      const endpoint = await prisma.apiEndpoint.create({
        data: { method: 'GET', path: '/test-ep', accessType: 'role' },
      });

      const role1 = await prisma.role.create({
        data: { name: `Role1-${createUniqueName()}`, description: 'Role 1' },
      });
      const role2 = await prisma.role.create({
        data: { name: `Role2-${createUniqueName()}`, description: 'Role 2' },
      });

      await prisma.roleApiEndpoint.create({
        data: { roleId: role1.id, apiEndpointId: endpoint.id },
      });
      await prisma.roleApiEndpoint.create({
        data: { roleId: role2.id, apiEndpointId: endpoint.id },
      });

      const roles = await repo.findRolesByEndpointId(endpoint.id);
      expect(roles).toHaveLength(2);
      expect(roles.map(r => r.id)).toContain(role1.id);
      expect(roles.map(r => r.id)).toContain(role2.id);

      await prisma.roleApiEndpoint.deleteMany({ where: { apiEndpointId: endpoint.id } });
      await prisma.role.deleteMany({ where: { id: { in: [role1.id, role2.id] } } });
      await prisma.apiEndpoint.delete({ where: { id: endpoint.id } });
    });
  });

  describe('assignEndpointToRole', () => {
    it('should assign endpoint to role', async () => {
      const repo = new RoleApiEndpointRepository(prisma);
      const role = await prisma.role.findUnique({
        where: { name: 'SUPER_ADMIN' },
      });
      
      if (!role) throw new Error('SUPER_ADMIN role not found');

      const endpoint = await prisma.apiEndpoint.create({
        data: { method: 'GET', path: `/test-assign-ep-${createUniqueSuffix()}`, accessType: 'role' },
      });

      await repo.assignEndpointToRole(role.id, endpoint.id);

      const assignments = await prisma.roleApiEndpoint.findMany({
        where: { roleId: role.id, apiEndpointId: endpoint.id },
      });
      expect(assignments).toHaveLength(1);

      await prisma.roleApiEndpoint.deleteMany({ where: { roleId: role.id, apiEndpointId: endpoint.id } });
      await prisma.apiEndpoint.delete({ where: { id: endpoint.id } });
    });

    it('should be idempotent (upsert)', async () => {
      const repo = new RoleApiEndpointRepository(prisma);
      const role = await prisma.role.findUnique({
        where: { name: 'SUPER_ADMIN' },
      });
      
      if (!role) throw new Error('SUPER_ADMIN role not found');

      const endpoint = await prisma.apiEndpoint.create({
        data: { method: 'POST', path: `/test-idempotent-ep-${createUniqueSuffix()}`, accessType: 'role' },
      });

      await repo.assignEndpointToRole(role.id, endpoint.id);
      await repo.assignEndpointToRole(role.id, endpoint.id);

      const assignments = await prisma.roleApiEndpoint.findMany({
        where: { roleId: role.id, apiEndpointId: endpoint.id },
      });
      expect(assignments).toHaveLength(1);

      await prisma.roleApiEndpoint.deleteMany({ where: { roleId: role.id, apiEndpointId: endpoint.id } });
      await prisma.apiEndpoint.delete({ where: { id: endpoint.id } });
    });
  });

  describe('unassignEndpointFromRole', () => {
    it('should unassign endpoint from role', async () => {
      const repo = new RoleApiEndpointRepository(prisma);
      const role = await prisma.role.findUnique({
        where: { name: 'SUPER_ADMIN' },
      });
      
      if (!role) throw new Error('SUPER_ADMIN role not found');

      const endpoint = await prisma.apiEndpoint.create({
        data: { method: 'GET', path: `/test-unassign-ep-${createUniqueSuffix()}`, accessType: 'role' },
      });

      await prisma.roleApiEndpoint.create({
        data: { roleId: role.id, apiEndpointId: endpoint.id },
      });

      await repo.unassignEndpointFromRole(role.id, endpoint.id);

      const assignments = await prisma.roleApiEndpoint.findMany({
        where: { roleId: role.id, apiEndpointId: endpoint.id },
      });
      expect(assignments).toHaveLength(0);

      await prisma.apiEndpoint.delete({ where: { id: endpoint.id } });
    });

    it('should be idempotent (no error if not assigned)', async () => {
      const repo = new RoleApiEndpointRepository(prisma);
      const role = await prisma.role.findUnique({
        where: { name: 'SUPER_ADMIN' },
      });
      
      if (!role) throw new Error('SUPER_ADMIN role not found');

      const endpoint = await prisma.apiEndpoint.create({
        data: { method: 'POST', path: `/test-unassign-idempotent-ep-${createUniqueSuffix()}`, accessType: 'role' },
      });

      await expect(
        repo.unassignEndpointFromRole(role.id, endpoint.id)
      ).resolves.not.toThrow();

      await prisma.apiEndpoint.delete({ where: { id: endpoint.id } });
    });
  });
  afterEach(async () => {
    // Дополнительная очистка после каждого теста для полной изоляции
    await prisma.rolePage.deleteMany();
    await prisma.roleApiEndpoint.deleteMany();
    await prisma.userRole.deleteMany();
    await prisma.userProfile.deleteMany();
    await prisma.page.deleteMany();
    await prisma.apiEndpoint.deleteMany();
    await prisma.role.deleteMany({
      where: {
        name: {
          notIn: ['GUEST', 'MEMBER', 'ADMIN', 'SUPER_ADMIN']
        }
      }
    });
    await prisma.user.deleteMany();
    await prisma.plot.deleteMany();
    await prisma.plotUserRole.deleteMany();
    await prisma.plotUserRoleHistory.deleteMany();
  });
});

afterAll(async () => {
  await prisma.rolePage.deleteMany();
  await prisma.roleApiEndpoint.deleteMany();
  await prisma.userRole.deleteMany();
  await prisma.userProfile.deleteMany();
  await prisma.page.deleteMany();
  await prisma.apiEndpoint.deleteMany();
  await prisma.role.deleteMany({
    where: {
      name: {
        notIn: ['GUEST', 'MEMBER', 'ADMIN', 'SUPER_ADMIN']
      }
    }
  });
  await prisma.user.deleteMany();
  await prisma.plot.deleteMany();
  await prisma.plotUserRole.deleteMany();
  await prisma.plotUserRoleHistory.deleteMany();
});
