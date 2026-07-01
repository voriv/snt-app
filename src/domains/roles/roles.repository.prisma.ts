/**
 * @file roles.repository.prisma.ts
 * @domain roles
 * @description Реализация репозиториев через Prisma Client
 *
 * @spec
 * - Использует singleton Prisma Client из infrastructure/prisma/client.ts
 * - Маппит Prisma-модели (snake_case через @map) → доменные типы (camelCase)
 * - Prisma P2002 → доменные ошибки Duplicate преобразуются на уровне сервиса
 * - Прямой импорт Prisma Client только в этом файле (MODEL.md §8)
 *
 * @see src/domains/roles/roles.repository.interface.ts — интерфейсы
 * @see prisma/schema.prisma — Prisma-модели
 */
import { prisma } from '@/infrastructure/prisma/client';
import type {
  IRoleRepository,
  IPageRepository,
  IRolePageRepository,
  IApiEndpointRepository,
  IRoleApiEndpointRepository,
} from './roles.repository.interface';
import type {
  Role,
  Page,
  ApiEndpoint,
  CreateRoleInput,
  UpdateRoleInput,
  CreatePageInput,
  UpdatePageInput,
  CreateApiEndpointInput,
  UpdateApiEndpointInput,
  HttpMethod,
  AccessType,
} from './roles.types';
import type { UserData } from '@/domains/auth/auth.types';

/**
 * @class RoleRepository
 * @domain roles
 * @description Реализация IRoleRepository через Prisma Client
 *
 * @spec
 * - Маппит Prisma Role → доменный Role (isSystem ← is_system, createdAt ← created_at и т.д.)
 * - countSuperAdmins: ищет роль с name='SUPER_ADMIN' и считает записи в user_roles
 */
export class RoleRepository implements IRoleRepository {
  async findAll(): Promise<Role[]> {
    const roles = await prisma.role.findMany({
      orderBy: { name: 'asc' },
    });
    return roles.map(this.mapRole);
  }

  async findById(id: string): Promise<Role | null> {
    const role = await prisma.role.findUnique({ where: { id } });
    return role ? this.mapRole(role) : null;
  }

  async findByName(name: string): Promise<Role | null> {
    const role = await prisma.role.findUnique({ where: { name } });
    return role ? this.mapRole(role) : null;
  }

  async create(data: CreateRoleInput): Promise<Role> {
    const role = await prisma.role.create({
      data: {
        name: data.name,
        description: data.description ?? null,
        isSystem: false,
      },
    });
    return this.mapRole(role);
  }

  async update(id: string, data: UpdateRoleInput): Promise<Role> {
    const role = await prisma.role.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.description !== undefined && { description: data.description }),
      },
    });
    return this.mapRole(role);
  }

  async delete(id: string): Promise<void> {
    await prisma.role.delete({ where: { id } });
  }

  async findUsersByRoleId(roleId: string): Promise<UserData[]> {
    const userRoles = await prisma.userRole.findMany({
      where: { roleId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
    });
    return userRoles.map(ur => ({
      id: ur.user.id,
      email: ur.user.email,
      name: ur.user.name,
      createdAt: ur.user.createdAt,
      updatedAt: ur.user.updatedAt,
    }));
  }

  async searchUsers(query: string): Promise<UserData[]> {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      return [];
    }
    const users = await prisma.user.findMany({
      where: {
        OR: [
          { email: { contains: trimmed, mode: 'insensitive' } },
          { name: { contains: trimmed, mode: 'insensitive' } },
        ],
      },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        updatedAt: true,
      },
      take: 20,
      orderBy: { email: 'asc' },
    });
    return users;
  }

  async findRolesByUserId(userId: string): Promise<Role[]> {
    const userRoles = await prisma.userRole.findMany({
      where: { userId },
      include: { role: true },
    });
    return userRoles.map(ur => this.mapRole(ur.role));
  }

  async addUserToRole(userId: string, roleId: string): Promise<void> {
    await prisma.userRole.upsert({
      where: { userId_roleId: { userId, roleId } },
      create: { userId, roleId },
      update: {},
    });
  }

  async removeUserFromRole(userId: string, roleId: string): Promise<void> {
    await prisma.userRole.deleteMany({
      where: { userId, roleId },
    });
  }

  async countSuperAdmins(): Promise<number> {
    const superAdminRole = await prisma.role.findUnique({
      where: { name: 'SUPER_ADMIN' },
      select: { id: true },
    });

    if (!superAdminRole) {
      return 0;
    }

    const count = await prisma.userRole.count({
      where: { roleId: superAdminRole.id },
    });
    return count;
  }

  /** Маппинг Prisma Role → доменный Role */
  private mapRole(r: {
    id: string;
    name: string;
    description: string | null;
    isSystem: boolean;
    createdAt: Date;
    updatedAt: Date;
  }): Role {
    return {
      id: r.id,
      name: r.name,
      description: r.description,
      isSystem: r.isSystem,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    };
  }
}

/**
 * @class PageRepository
 * @domain roles
 * @description Реализация IPageRepository через Prisma Client
 */
export class PageRepository implements IPageRepository {
  async findAll(): Promise<Page[]> {
    const pages = await prisma.page.findMany({
      orderBy: [{ sortOrder: 'asc' }, { title: 'asc' }],
    });
    return pages.map(this.mapPage);
  }

  async findById(id: string): Promise<Page | null> {
    const page = await prisma.page.findUnique({ where: { id } });
    return page ? this.mapPage(page) : null;
  }

  async findByPath(path: string): Promise<Page | null> {
    const page = await prisma.page.findUnique({ where: { path } });
    return page ? this.mapPage(page) : null;
  }

  async create(data: CreatePageInput): Promise<Page> {
    const page = await prisma.page.create({
      data: {
        path: data.path,
        title: data.title,
        groupName: data.groupName ?? null,
        sortOrder: data.sortOrder ?? 0,
        isActive: data.isActive ?? true,
      },
    });
    return this.mapPage(page);
  }

  async update(id: string, data: UpdatePageInput): Promise<Page> {
    const page = await prisma.page.update({
      where: { id },
      data: {
        ...(data.path !== undefined && { path: data.path }),
        ...(data.title !== undefined && { title: data.title }),
        ...(data.groupName !== undefined && { groupName: data.groupName }),
        ...(data.sortOrder !== undefined && { sortOrder: data.sortOrder }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
      },
    });
    return this.mapPage(page);
  }

  async delete(id: string): Promise<void> {
    await prisma.page.delete({ where: { id } });
  }

  /** Маппинг Prisma Page → доменный Page */
  private mapPage(p: {
    id: string;
    path: string;
    title: string;
    groupName: string | null;
    sortOrder: number;
    accessType: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
  }): Page {
    return {
      id: p.id,
      path: p.path,
      title: p.title,
      groupName: p.groupName,
      sortOrder: p.sortOrder,
      accessType: p.accessType as AccessType,
      isActive: p.isActive,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    };
  }
}

/**
 * @class RolePageRepository
 * @domain roles
 * @description Реализация IRolePageRepository через Prisma Client
 *
 * @spec
 * - assignPageToRole: upsert для идемпотентности (составной PK)
 * - unassignPageFromRole: deleteMany (идемпотентно, не бросает ошибку если записи нет)
 */
export class RolePageRepository implements IRolePageRepository {
  async findPagesByRoleId(roleId: string): Promise<Page[]> {
    const rolePages = await prisma.rolePage.findMany({
      where: { roleId },
      include: {
        page: true,
      },
      orderBy: { page: { sortOrder: 'asc' } },
    });
    return rolePages.map(rp => ({
      id: rp.page.id,
      path: rp.page.path,
      title: rp.page.title,
      groupName: rp.page.groupName,
      sortOrder: rp.page.sortOrder,
      accessType: rp.page.accessType as AccessType,
      isActive: rp.page.isActive,
      createdAt: rp.page.createdAt,
      updatedAt: rp.page.updatedAt,
    }));
  }

  async findRolesByPageId(pageId: string): Promise<Role[]> {
    const rolePages = await prisma.rolePage.findMany({
      where: { pageId },
      include: { role: true },
    });
    return rolePages.map(rp => ({
      id: rp.role.id,
      name: rp.role.name,
      description: rp.role.description,
      isSystem: rp.role.isSystem,
      createdAt: rp.role.createdAt,
      updatedAt: rp.role.updatedAt,
    }));
  }

  async assignPageToRole(roleId: string, pageId: string): Promise<void> {
    await prisma.rolePage.upsert({
      where: { roleId_pageId: { roleId, pageId } },
      create: { roleId, pageId },
      update: {},
    });
  }

  async unassignPageFromRole(roleId: string, pageId: string): Promise<void> {
    await prisma.rolePage.deleteMany({
      where: { roleId, pageId },
    });
  }

  async unassignAllPagesFromRole(roleId: string): Promise<void> {
    await prisma.rolePage.deleteMany({
      where: { roleId },
    });
  }
}

/**
 * @class ApiEndpointRepository
 * @domain roles
 * @description Реализация IApiEndpointRepository через Prisma Client
 */
export class ApiEndpointRepository implements IApiEndpointRepository {
  async findAll(): Promise<ApiEndpoint[]> {
    const endpoints = await prisma.apiEndpoint.findMany({
      orderBy: [{ method: 'asc' }, { path: 'asc' }],
    });
    return endpoints.map(this.mapEndpoint);
  }

  async findById(id: string): Promise<ApiEndpoint | null> {
    const endpoint = await prisma.apiEndpoint.findUnique({ where: { id } });
    return endpoint ? this.mapEndpoint(endpoint) : null;
  }

  async findByMethodAndPath(method: string, path: string): Promise<ApiEndpoint | null> {
    const endpoint = await prisma.apiEndpoint.findUnique({
      where: { method_path: { method, path } },
    });
    return endpoint ? this.mapEndpoint(endpoint) : null;
  }

  async create(data: CreateApiEndpointInput): Promise<ApiEndpoint> {
    const endpoint = await prisma.apiEndpoint.create({
      data: {
        method: data.method,
        path: data.path,
        description: data.description ?? null,
        accessType: data.accessType ?? 'role',
        isActive: data.isActive ?? true,
      },
    });
    return this.mapEndpoint(endpoint);
  }

  async update(id: string, data: UpdateApiEndpointInput): Promise<ApiEndpoint> {
    const endpoint = await prisma.apiEndpoint.update({
      where: { id },
      data: {
        ...(data.method !== undefined && { method: data.method }),
        ...(data.path !== undefined && { path: data.path }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.accessType !== undefined && { accessType: data.accessType }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
      },
    });
    return this.mapEndpoint(endpoint);
  }

  async delete(id: string): Promise<void> {
    await prisma.apiEndpoint.delete({ where: { id } });
  }

  /** Маппинг Prisma ApiEndpoint → доменный ApiEndpoint */
  private mapEndpoint(e: {
    id: string;
    method: string;
    path: string;
    description: string | null;
    accessType: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
  }): ApiEndpoint {
    return {
      id: e.id,
      method: e.method as HttpMethod,
      path: e.path,
      description: e.description,
      accessType: e.accessType as AccessType,
      isActive: e.isActive,
      createdAt: e.createdAt,
      updatedAt: e.updatedAt,
    };
  }
}

/**
 * @class RoleApiEndpointRepository
 * @domain roles
 * @description Реализация IRoleApiEndpointRepository через Prisma Client
 *
 * @spec
 * - assignEndpointToRole: upsert для идемпотентности
 * - unassignEndpointFromRole: deleteMany (идемпотентно)
 */
export class RoleApiEndpointRepository implements IRoleApiEndpointRepository {
  async findEndpointsByRoleId(roleId: string): Promise<ApiEndpoint[]> {
    const roleEndpoints = await prisma.roleApiEndpoint.findMany({
      where: { roleId },
      include: { apiEndpoint: true },
      orderBy: { apiEndpoint: { method: 'asc' } },
    });
    return roleEndpoints.map(re => ({
      id: re.apiEndpoint.id,
      method: re.apiEndpoint.method as HttpMethod,
      path: re.apiEndpoint.path,
      description: re.apiEndpoint.description,
      accessType: re.apiEndpoint.accessType as AccessType,
      isActive: re.apiEndpoint.isActive,
      createdAt: re.apiEndpoint.createdAt,
      updatedAt: re.apiEndpoint.updatedAt,
    }));
  }

  async findRolesByEndpointId(endpointId: string): Promise<Role[]> {
    const roleEndpoints = await prisma.roleApiEndpoint.findMany({
      where: { apiEndpointId: endpointId },
      include: { role: true },
    });
    return roleEndpoints.map(re => ({
      id: re.role.id,
      name: re.role.name,
      description: re.role.description,
      isSystem: re.role.isSystem,
      createdAt: re.role.createdAt,
      updatedAt: re.role.updatedAt,
    }));
  }

  async assignEndpointToRole(roleId: string, endpointId: string): Promise<void> {
    await prisma.roleApiEndpoint.upsert({
      where: { roleId_apiEndpointId: { roleId, apiEndpointId: endpointId } },
      create: { roleId, apiEndpointId: endpointId },
      update: {},
    });
  }

  async unassignEndpointFromRole(roleId: string, endpointId: string): Promise<void> {
    await prisma.roleApiEndpoint.deleteMany({
      where: { roleId, apiEndpointId: endpointId },
    });
  }

  async unassignAllEndpointsFromRole(roleId: string): Promise<void> {
    await prisma.roleApiEndpoint.deleteMany({
      where: { roleId },
    });
  }
}
