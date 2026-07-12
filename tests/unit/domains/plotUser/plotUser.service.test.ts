/**
 * @file plotUser.service.test.ts
 * @domain plotUser
 * @description Tests for PlotUserRoleService business logic
 *
 * @spec
 * - create validates data and checks existence of user/plot
 * - create checks for duplicate active relationship with same role
 * - create validates expiresAt is in the future
 * - findById returns null when not found and required=false
 * - findById throws PlotUserRoleNotFoundError when required=true
 * - findByUserId returns all relationships for a user
 * - findByPlotId returns all relationships for a plot
 * - update validates data and checks existence
 * - update validates expiresAt is in the future
 * - deactivate changes status to 'expired' and creates history
 * - deactivate throws error if already expired
 * - findWithPagination returns paginated results with computed totalPages
 * - existsActive returns boolean for active relationship check
 * - findByPlot validates plot exists and returns participants
 * - searchByName validates plot exists and searches by name/email
 * - findByUser validates user exists and returns connections
 * - searchByPlot validates user exists and searches by plot number/address
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  PlotUserRoleService,
  createPlotUserRoleService,
} from '@/domains/plotUser/plotUser.service';
import type {
  IPlotUserRoleRepository,
  IPlotUserRoleHistoryRepository,
} from '@/domains/plotUser/plotUser.repository.interface';
import type {
  PlotUserRole,
  CreatePlotUserRoleInput,
  UpdatePlotUserRoleInput,
  PaginatedResponse,
  PlotUserRoleParticipantFilter,
  PlotUserRoleParticipant,
  PlotUserRoleConnectionFilter,
  PlotUserRoleConnection,
} from '@/domains/plotUser/plotUser.types';
import { PlotUserRoleNotFoundError } from '@/domains/plotUser/plotUser.errors';
import { PlotUserRoleDuplicateError } from '@/domains/plotUser/plotUser.errors';
import { PlotUserRoleInvalidDataError } from '@/domains/plotUser/plotUser.errors';

// Helper function to create a test plot user role
function createTestPlotUserRole(overrides?: Partial<PlotUserRole>): PlotUserRole {
  const now = new Date('2024-01-01T00:00:00.000Z');
  return {
    id: 'clx1234567890',
    userId: 'clx1111111111',
    plotId: 'clx2222222222',
    role: 1,
    status: 'active',
    comment: 'Собственник',
    assignedAt: now,
    expiresAt: null,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

// Helper to create a mock repository
function createMockPlotUserRoleRepository(
  overrides: Partial<IPlotUserRoleRepository> = {}
): IPlotUserRoleRepository {
  return {
    create: vi.fn(overrides.create),
    findById: vi.fn(overrides.findById),
    findByUserId: vi.fn(overrides.findByUserId),
    findByPlotId: vi.fn(overrides.findByPlotId),
    existsActive: vi.fn(overrides.existsActive),
    existsActiveWithRole: vi.fn(overrides.existsActiveWithRole),
    userExists: vi.fn(overrides.userExists),
    plotExists: vi.fn(overrides.plotExists),
    update: vi.fn(overrides.update),
    deactivate: vi.fn(overrides.deactivate),
    findWithPagination: vi.fn(overrides.findWithPagination),
    findByPlot: vi.fn(overrides.findByPlot),
    searchByName: vi.fn(overrides.searchByName),
    findWithUser: vi.fn(overrides.findWithUser),
    findByUser: vi.fn(overrides.findByUser),
    searchByPlot: vi.fn(overrides.searchByPlot),
    findWithPlot: vi.fn(overrides.findWithPlot),
    delete: vi.fn(overrides.delete),
  };
}

// Helper to create a mock history repository
function createMockPlotUserRoleHistoryRepository(
  overrides: Partial<IPlotUserRoleHistoryRepository> = {}
): IPlotUserRoleHistoryRepository {
  return {
    create: vi.fn(),
    findAllByPlotUserId: vi.fn(),
    findByUserIdAndPlotId: vi.fn(),
    ...overrides,
  };
}

describe('PlotUserRoleService', () => {
  let service: PlotUserRoleService;
  let mockRepo: IPlotUserRoleRepository;
  let mockHistoryRepo: IPlotUserRoleHistoryRepository;

  beforeEach(() => {
    vi.clearAllMocks();
    mockRepo = createMockPlotUserRoleRepository();
    mockHistoryRepo = createMockPlotUserRoleHistoryRepository();
    service = createPlotUserRoleService(mockRepo, mockHistoryRepo);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('create', () => {
    const createData: CreatePlotUserRoleInput = {
      userId: 'clx1111111111',
      plotId: 'clx2222222222',
      role: 1,
    };

    it('should create a plot user role with valid data', async () => {
      // Подготавливаем моки для проверки существования пользователя и участка
      vi.mocked(mockRepo.userExists).mockResolvedValue(true);
      vi.mocked(mockRepo.plotExists).mockResolvedValue(true);
      vi.mocked(mockRepo.existsActiveWithRole).mockResolvedValue(false);
      
      const createdRole: PlotUserRole = createTestPlotUserRole();
      vi.mocked(mockRepo.create).mockResolvedValue(createdRole);

      const result = await service.create(createData, 'clx9999999999');

      expect(result).toBeDefined();
      expect(result.userId).toBe(createData.userId);
      expect(result.plotId).toBe(createData.plotId);
      expect(result.role).toBe(createData.role);
      expect(mockRepo.create).toHaveBeenCalled();
    });

    it('should reject if user does not exist', async () => {
      vi.mocked(mockRepo.userExists).mockResolvedValue(false);

      await expect(service.create(createData, 'clx9999999999')).rejects.toThrow(
        PlotUserRoleInvalidDataError
      );
      await expect(service.create(createData, 'clx9999999999')).rejects.toThrow(
        'Пользователь с ID'
      );
    });

    it('should reject if plot does not exist', async () => {
      vi.mocked(mockRepo.userExists).mockResolvedValue(true);
      vi.mocked(mockRepo.plotExists).mockResolvedValue(false);

      await expect(service.create(createData, 'clx9999999999')).rejects.toThrow(
        PlotUserRoleInvalidDataError
      );
      await expect(service.create(createData, 'clx9999999999')).rejects.toThrow(
        'Участок с ID'
      );
    });

    it('should reject if active role already exists for user and plot', async () => {
      vi.mocked(mockRepo.userExists).mockResolvedValue(true);
      vi.mocked(mockRepo.plotExists).mockResolvedValue(true);
      vi.mocked(mockRepo.existsActiveWithRole).mockResolvedValue(true);

      await expect(service.create(createData, 'clx9999999999')).rejects.toThrow(
        PlotUserRoleDuplicateError
      );
      await expect(service.create(createData, 'clx9999999999')).rejects.toThrow(
        'уже существует активная связь'
      );
    });

    it('should reject if expiresAt is in the past', async () => {
      vi.mocked(mockRepo.userExists).mockResolvedValue(true);
      vi.mocked(mockRepo.plotExists).mockResolvedValue(true);
      vi.mocked(mockRepo.existsActiveWithRole).mockResolvedValue(false);
      
      const pastDate = new Date('2020-01-01T00:00:00.000Z').toISOString();
      const dataWithPastExpires: CreatePlotUserRoleInput = {
        ...createData,
        expiresAt: pastDate,
      };

      await expect(
        service.create(dataWithPastExpires, 'clx9999999999')
      ).rejects.toThrow(PlotUserRoleInvalidDataError);
      await expect(
        service.create(dataWithPastExpires, 'clx9999999999')
      ).rejects.toThrow('Дата истечения должна быть больше текущего времени');
    });

    it('should accept valid expiresAt in the future', async () => {
      vi.mocked(mockRepo.userExists).mockResolvedValue(true);
      vi.mocked(mockRepo.plotExists).mockResolvedValue(true);
      vi.mocked(mockRepo.existsActiveWithRole).mockResolvedValue(false);
      
      const futureDate = new Date('2030-01-01T00:00:00.000Z').toISOString();
      const dataWithFutureExpires: CreatePlotUserRoleInput = {
        ...createData,
        expiresAt: futureDate,
      };

      vi.mocked(mockRepo.create).mockResolvedValue(createTestPlotUserRole());

      const result = await service.create(dataWithFutureExpires, 'clx9999999999');
      expect(result).toBeDefined();
    });
  });

  describe('findById', () => {
    it('should return plot user role when found', async () => {
      const createdRole = createTestPlotUserRole();
      vi.mocked(mockRepo.findById).mockResolvedValue(createdRole);

      const result = await service.findById('clx1234567890');

      expect(result).toBeDefined();
      expect(result?.id).toBe('clx1234567890');
    });

    it('should return null when not found and required=false', async () => {
      vi.mocked(mockRepo.findById).mockResolvedValue(null);

      const result = await service.findById('nonexistent-id', false);
      expect(result).toBeNull();
    });

    it('should throw PlotUserRoleNotFoundError when not found and required=true', async () => {
      vi.mocked(mockRepo.findById).mockResolvedValue(null);

      await expect(service.findById('nonexistent-id', true)).rejects.toThrow(
        PlotUserRoleNotFoundError
      );
      await expect(service.findById('nonexistent-id', true)).rejects.toThrow(
        'Связь с ID \'nonexistent-id\' не найдена'
      );
    });
  });

  describe('findByUserId', () => {
    it('should return plot user roles for user', async () => {
      const mockRoles = [
        createTestPlotUserRole({ id: 'clx1111111111', userId: 'clx1111111111' }),
        createTestPlotUserRole({ id: 'clx1111111112', userId: 'clx1111111111' }),
      ];
      vi.mocked(mockRepo.findByUserId).mockResolvedValue(mockRoles);

      const result = await service.findByUserId('clx1111111111');

      expect(result).toHaveLength(2);
      expect(mockRepo.findByUserId).toHaveBeenCalledWith('clx1111111111');
    });
  });

  describe('findByPlotId', () => {
    it('should return plot user roles for plot', async () => {
      const mockRoles = [
        createTestPlotUserRole({ id: 'clx2222222221', plotId: 'clx2222222222' }),
        createTestPlotUserRole({ id: 'clx2222222222', plotId: 'clx2222222222' }),
      ];
      vi.mocked(mockRepo.findByPlotId).mockResolvedValue(mockRoles);

      const result = await service.findByPlotId('clx2222222222');

      expect(result).toHaveLength(2);
      expect(mockRepo.findByPlotId).toHaveBeenCalledWith('clx2222222222');
    });
  });

  describe('update', () => {
    const updateData: UpdatePlotUserRoleInput = {
      role: 2,
    };

    it('should update plot user role with valid data', async () => {
      const existingRole = createTestPlotUserRole();
      const updatedRole = createTestPlotUserRole({ role: 2 });
      vi.mocked(mockRepo.findById).mockResolvedValue(existingRole);
      vi.mocked(mockRepo.update).mockResolvedValue(updatedRole);

      const result = await service.update('clx1234567890', updateData, 'clx9999999999');

      expect(result).toBeDefined();
      expect(result.role).toBe(2);
      expect(mockRepo.update).toHaveBeenCalled();
    });

    it('should throw PlotUserRoleNotFoundError when plot user role not found', async () => {
      vi.mocked(mockRepo.findById).mockResolvedValue(null);

      await expect(
        service.update('nonexistent-id', updateData, 'clx9999999999')
      ).rejects.toThrow(PlotUserRoleNotFoundError);
      await expect(
        service.update('nonexistent-id', updateData, 'clx9999999999')
      ).rejects.toThrow('Связь с ID \'nonexistent-id\' не найдена');
    });

    it('should reject if expiresAt is in the past', async () => {
      const existingRole = createTestPlotUserRole();
      const pastDate = new Date('2020-01-01T00:00:00.000Z').toISOString();
      const dataWithPastExpires: UpdatePlotUserRoleInput = {
        expiresAt: pastDate,
      };

      vi.mocked(mockRepo.findById).mockResolvedValue(existingRole);

      await expect(
        service.update('clx1234567890', dataWithPastExpires, 'clx9999999999')
      ).rejects.toThrow(PlotUserRoleInvalidDataError);
      await expect(
        service.update('clx1234567890', dataWithPastExpires, 'clx9999999999')
      ).rejects.toThrow('Дата истечения должна быть больше текущего времени');
    });

    it('should accept valid expiresAt in the future', async () => {
      const existingRole = createTestPlotUserRole();
      const futureDate = new Date('2030-01-01T00:00:00.000Z').toISOString();
      const dataWithFutureExpires: UpdatePlotUserRoleInput = {
        expiresAt: futureDate,
      };
      const updatedRole = createTestPlotUserRole();

      vi.mocked(mockRepo.findById).mockResolvedValue(existingRole);
      vi.mocked(mockRepo.update).mockResolvedValue(updatedRole);

      const result = await service.update(
        'clx1234567890',
        dataWithFutureExpires,
        'clx9999999999'
      );
      expect(result).toBeDefined();
    });
  });

  describe('deactivate', () => {
    it('should deactivate plot user role', async () => {
      vi.mocked(mockRepo.deactivate).mockResolvedValue(true);
      vi.mocked(mockRepo.findById).mockResolvedValue(createTestPlotUserRole());

      const result = await service.deactivate('clx1234567890', 'clx9999999999');

      expect(result).toBeDefined();
      expect(mockRepo.deactivate).toHaveBeenCalledWith(
        'clx1234567890',
        'clx9999999999',
        'Deactivation'
      );
    });

    it('should throw PlotUserRoleNotFoundError when not found', async () => {
      vi.mocked(mockRepo.findById).mockResolvedValue(null);

      await expect(
        service.deactivate('nonexistent-id', 'clx9999999999')
      ).rejects.toThrow(PlotUserRoleNotFoundError);
    });

    it('should throw PlotUserRoleInvalidDataError when already deactivated', async () => {
      const expiredRole = createTestPlotUserRole({ status: 'expired' });
      vi.mocked(mockRepo.findById).mockResolvedValue(expiredRole);

      await expect(
        service.deactivate('clx1234567890', 'clx9999999999')
      ).rejects.toThrow(PlotUserRoleInvalidDataError);
      await expect(
        service.deactivate('clx1234567890', 'clx9999999999')
      ).rejects.toThrow('Связь уже деактивирована');
    });
  });

  describe('findWithPagination', () => {
    it('should return paginated plot user roles with default values', async () => {
      vi.mocked(mockRepo.findWithPagination).mockResolvedValue({
        data: [createTestPlotUserRole()],
        total: 1,
        page: 1,
        limit: 20,
      });

      const result = await service.findWithPagination({});

      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
      expect(result.totalPages).toBe(1);
      expect(mockRepo.findWithPagination).toHaveBeenCalledWith({
        limit: 20,
        offset: 0,
      });
    });

    it('should return paginated plot user roles with custom page and limit', async () => {
      vi.mocked(mockRepo.findWithPagination).mockResolvedValue({
        data: [],
        total: 50,
        page: 1,
        limit: 20,
      });

      const result = await service.findWithPagination({ page: 2, limit: 25 });

      expect(result.page).toBe(2);
      expect(result.limit).toBe(25);
      expect(result.totalPages).toBe(2);
      expect(mockRepo.findWithPagination).toHaveBeenCalledWith({
        limit: 25,
        offset: 25,
        page: 2,
      });
    });
  });

  describe('existsActive', () => {
    it('should return true if active relationship exists', async () => {
      vi.mocked(mockRepo.existsActive).mockResolvedValue(true);

      const result = await service.existsActive('clx1111111111', 'clx2222222222');

      expect(result).toBe(true);
      expect(mockRepo.existsActive).toHaveBeenCalledWith(
        'clx1111111111',
        'clx2222222222'
      );
    });

    it('should return false if active relationship does not exist', async () => {
      vi.mocked(mockRepo.existsActive).mockResolvedValue(false);

      const result = await service.existsActive('clx1111111111', 'clx2222222222');

      expect(result).toBe(false);
    });
  });

  describe('findByPlot', () => {
    it('should throw PlotUserRoleNotFoundError when plot does not exist', async () => {
      vi.mocked(mockRepo.plotExists).mockResolvedValue(false);

      await expect(
        service.findByPlot('nonexistent-plot-id')
      ).rejects.toThrow(PlotUserRoleNotFoundError);
      await expect(
        service.findByPlot('nonexistent-plot-id')
      ).rejects.toThrow('Участок с ID \'nonexistent-plot-id\' не найден');
    });

    it('should return plot user participants when plot exists', async () => {
      vi.mocked(mockRepo.plotExists).mockResolvedValue(true);
      const mockParticipants: PlotUserRoleParticipant[] = [
        {
          ...createTestPlotUserRole(),
          user: {
            id: 'clx1111111111',
            email: 'test@example.com',
            firstName: 'Иван',
            lastName: 'Иванов',
            phone: '+79001234567',
          },
        },
      ];
      vi.mocked(mockRepo.findByPlot).mockResolvedValue(mockParticipants);

      const result = await service.findByPlot('clx2222222222');

      expect(result).toHaveLength(1);
      expect(mockRepo.findByPlot).toHaveBeenCalledWith('clx2222222222', undefined);
    });

    it('should apply filters when provided', async () => {
      vi.mocked(mockRepo.plotExists).mockResolvedValue(true);
      vi.mocked(mockRepo.findByPlot).mockResolvedValue([]);

      const filter: PlotUserRoleParticipantFilter = {
        role: 1,
        status: 'active',
        search: 'ivan',
        page: 1,
        limit: 10,
      };

      await service.findByPlot('clx2222222222', filter);

      expect(mockRepo.findByPlot).toHaveBeenCalledWith('clx2222222222', filter);
    });
  });

  describe('searchByName', () => {
    it('should throw PlotUserRoleNotFoundError when plot does not exist', async () => {
      vi.mocked(mockRepo.plotExists).mockResolvedValue(false);

      await expect(
        service.searchByName('nonexistent-plot-id', 'ivan')
      ).rejects.toThrow(PlotUserRoleNotFoundError);
    });

    it('should search participants by name when plot exists', async () => {
      vi.mocked(mockRepo.plotExists).mockResolvedValue(true);
      vi.mocked(mockRepo.searchByName).mockResolvedValue([]);

      const result = await service.searchByName('clx2222222222', 'ivan');

      expect(result).toHaveLength(0);
      expect(mockRepo.searchByName).toHaveBeenCalledWith(
        'clx2222222222',
        'ivan'
      );
    });
  });

  describe('findByUser', () => {
    it('should throw PlotUserRoleNotFoundError when user does not exist', async () => {
      vi.mocked(mockRepo.userExists).mockResolvedValue(false);

      await expect(
        service.findByUser('nonexistent-user-id')
      ).rejects.toThrow(PlotUserRoleNotFoundError);
      await expect(
        service.findByUser('nonexistent-user-id')
      ).rejects.toThrow('Пользователь с ID \'nonexistent-user-id\' не найден');
    });

    it('should return plot user connections when user exists', async () => {
      vi.mocked(mockRepo.userExists).mockResolvedValue(true);
      const mockConnections: PlotUserRoleConnection[] = [
        {
          ...createTestPlotUserRole(),
          plot: {
            id: 'clx2222222222',
            plotNumber: 'A-1',
            cadastralNumber: '78:12:3456789:123',
            area: 1000,
            address: 'ул. Ленина, д. 1',
          },
        },
      ];
      vi.mocked(mockRepo.findByUser).mockResolvedValue(mockConnections);

      const result = await service.findByUser('clx1111111111');

      expect(result).toHaveLength(1);
      expect(mockRepo.findByUser).toHaveBeenCalledWith(
        'clx1111111111',
        undefined
      );
    });

    it('should apply filters when provided', async () => {
      vi.mocked(mockRepo.userExists).mockResolvedValue(true);
      vi.mocked(mockRepo.findByUser).mockResolvedValue([]);

      const filter: PlotUserRoleConnectionFilter = {
        role: 1,
        status: 'active',
        search: 'участок',
        page: 1,
        limit: 10,
      };

      await service.findByUser('clx1111111111', filter);

      expect(mockRepo.findByUser).toHaveBeenCalledWith(
        'clx1111111111',
        filter
      );
    });
  });

  describe('searchByPlot', () => {
    it('should throw PlotUserRoleNotFoundError when user does not exist', async () => {
      vi.mocked(mockRepo.userExists).mockResolvedValue(false);

      await expect(
        service.searchByPlot('nonexistent-user-id', 'участок')
      ).rejects.toThrow(PlotUserRoleNotFoundError);
    });

    it('should search connections by plot when user exists', async () => {
      vi.mocked(mockRepo.userExists).mockResolvedValue(true);
      vi.mocked(mockRepo.searchByPlot).mockResolvedValue([]);

      const result = await service.searchByPlot('clx1111111111', 'участок');

      expect(result).toHaveLength(0);
      expect(mockRepo.searchByPlot).toHaveBeenCalledWith(
        'clx1111111111',
        'участок'
      );
    });
  });
});
