/**
 * @file plotUser.test.ts
 * @description Интеграционные тесты для PlotUserRoleRepository
 * Проверяют прямое взаимодействие с БД через Prisma
 *
 * @spec
 * - beforeEach очищает все тестовые данные через deleteMany()
 * - Администратор создаётся один раз и используется для всех операций
 * - Проверяют CRUD операции PlotUserRole
 * - Тестируют бизнес-правила (уникальность, existence checks)
 * - Проверяют историю изменений
 *
 * @see docs/tests/integration-tests.md
 */

import { describe, it, expect, beforeEach, afterEach, afterAll } from 'vitest';
import {
  PlotUserRoleRepositoryPrisma,
  PlotUserRoleHistoryRepositoryPrisma,
} from '@/domains/plotUser/plotUser.repository.prisma';
import {
  PlotUserRoleNotFoundError,
  PlotUserRoleDuplicateError,
} from '@/domains/plotUser/plotUser.errors';
import {
  createUniqueName,
  createUniqueEmail,
  createUniquePlotNumber,
} from '../helpers';
import { prisma } from '../setup';

/**
 * Создаёт тестового пользователя с профилем в БД
 */
async function createTestUser() {
  const user = await prisma.user.create({
    data: {
      email: createUniqueEmail(),
      name: createUniqueName(),
      password: '$2a$10$test',
      profile: { create: { theme: 'light' } },
    },
    include: { profile: true },
  });
  return user;
}

/**
 * Создаёт тестовый участок в БД
 */
async function createTestPlot() {
  const plot = await prisma.plot.create({
    data: {
      plot_number: createUniquePlotNumber(),
      area: 10.5,
    },
  });
  return plot;
}

describe('PlotUserRoleRepository (Integration)', () => {
  let admin: { id: string };

  beforeEach(async () => {
    // Полная очистка БД перед каждым тестом для изоляции
    // Порядок важен из-за FK constraints: сначала зависимые таблицы, потом родительские
    await prisma.plotUserRoleHistory.deleteMany();
    await prisma.plotUserRole.deleteMany();
    await prisma.userRole.deleteMany();
    await prisma.userProfile.deleteMany();
    await prisma.plot.deleteMany();
    await prisma.user.deleteMany({
      where: {
        NOT: { email: { contains: 'test-search-user' } } // Сохраняем глобальных пользователей
      }
    });
  
    // Создаём администратора для тестов (необходим для create/updates)
    // admin создаётся с профилем, который используется как changedBy в истории
    admin = await prisma.user.create({
      data: {
        email: createUniqueEmail(),
        name: createUniqueName(),
        password: '$2a$10$test',
        profile: { create: { theme: 'light' } },
      },
      select: { id: true },
    });
  });

  afterEach(async () => {
    // Дополнительная очистка после каждого теста для изоляции
    await prisma.plotUserRoleHistory.deleteMany();
    await prisma.plotUserRole.deleteMany();
    await prisma.userRole.deleteMany();
    await prisma.userProfile.deleteMany();
    await prisma.plot.deleteMany();
    await prisma.user.deleteMany();
  });

  describe('create', () => {
    it('should create a plot user role with valid data', async () => {
      const userRepo = new PlotUserRoleRepositoryPrisma(prisma);
      const user = await createTestUser();
      const plot = await createTestPlot();

      const result = await userRepo.create(
        { userId: user.id, plotId: plot.id, role: 1, status: 'active' },
        admin.id // changedBy должен быть ID существующего пользователя
      );

      expect(result.id).toBeDefined();
      expect(result.userId).toBe(user.id);
      expect(result.plotId).toBe(plot.id);
      expect(result.role).toBe(1);
      expect(result.status).toBe('active');

      const created = await prisma.plotUserRole.findUnique({
        where: { id: result.id },
      });
      expect(created).not.toBeNull();
    });

    it('should create with optional comment', async () => {
      const userRepo = new PlotUserRoleRepositoryPrisma(prisma);
      const user = await createTestUser();
      const plot = await createTestPlot();

      const result = await userRepo.create(
        { userId: user.id, plotId: plot.id, role: 1, status: 'active', comment: 'Test comment' },
        admin.id
      );

      const created = await prisma.plotUserRole.findUnique({
        where: { id: result.id },
        include: { history: true },
      });
      expect(created?.comment).toBe('Test comment');
    });

    it('should create with expiresAt', async () => {
      const userRepo = new PlotUserRoleRepositoryPrisma(prisma);
      const user = await createTestUser();
      const plot = await createTestPlot();
      const expiresAt = new Date('2025-12-31T23:59:59Z');

      const result = await userRepo.create(
        { userId: user.id, plotId: plot.id, role: 1, status: 'active', expiresAt: expiresAt.toISOString() },
        admin.id
      );

      const created = await prisma.plotUserRole.findUnique({
        where: { id: result.id },
      });
      expect(created?.expiresAt).toEqual(new Date(expiresAt));
    });

    it('should throw PlotUserRoleDuplicateError for duplicate active role', async () => {
      const userRepo = new PlotUserRoleRepositoryPrisma(prisma);
      const user = await createTestUser();
      const plot = await createTestPlot();

      await userRepo.create(
        { userId: user.id, plotId: plot.id, role: 1, status: 'active' },
        admin.id
      );

      await expect(
        userRepo.create(
          { userId: user.id, plotId: plot.id, role: 1, status: 'active' },
          admin.id
        )
      ).rejects.toThrow(PlotUserRoleDuplicateError);
    });

    it('should allow different roles for same user and plot', async () => {
      const userRepo = new PlotUserRoleRepositoryPrisma(prisma);
      const user = await createTestUser();
      const plot = await createTestPlot();

      const result1 = await userRepo.create(
        { userId: user.id, plotId: plot.id, role: 1, status: 'active' },
        admin.id
      );
      const result2 = await userRepo.create(
        { userId: user.id, plotId: plot.id, role: 2, status: 'active' },
        admin.id
      );

      expect(result1.id).not.toBe(result2.id);
      expect(result1.role).toBe(1);
      expect(result2.role).toBe(2);
    });
  });

  describe('findById', () => {
    it('should return plot user role by ID', async () => {
      const userRepo = new PlotUserRoleRepositoryPrisma(prisma);
      const user = await createTestUser();
      const plot = await createTestPlot();

      const created = await userRepo.create(
        { userId: user.id, plotId: plot.id, role: 1, status: 'active' },
        admin.id
      );

      const found = await userRepo.findById(created.id);
      expect(found).not.toBeNull();
      expect(found?.id).toBe(created.id);
      expect(found?.role).toBe(1);
    });

    it('should return null for non-existent ID', async () => {
      const userRepo = new PlotUserRoleRepositoryPrisma(prisma);
      const found = await userRepo.findById('non-existent-id');
      expect(found).toBeNull();
    });
  });

  describe('findByUserId', () => {
    it('should return all active roles for user', async () => {
      const userRepo = new PlotUserRoleRepositoryPrisma(prisma);
      const user = await createTestUser();
      const plot1 = await createTestPlot();
      const plot2 = await createTestPlot();

      await userRepo.create(
        { userId: user.id, plotId: plot1.id, role: 1, status: 'active' },
        admin.id
      );
      await userRepo.create(
        { userId: user.id, plotId: plot2.id, role: 2, status: 'active' },
        admin.id
      );

      const results = await userRepo.findByUserId(user.id);
      expect(results).toHaveLength(2);
      expect(results.map(r => r.userId)).toEqual([user.id, user.id]);
    });

    it('should exclude inactive roles by default', async () => {
      const userRepo = new PlotUserRoleRepositoryPrisma(prisma);
      const user = await createTestUser();
      const plot = await createTestPlot();

      await userRepo.create(
        { userId: user.id, plotId: plot.id, role: 1, status: 'active' },
        admin.id
      );
      await userRepo.create(
        { userId: user.id, plotId: plot.id, role: 2, status: 'pending' },
        admin.id
      );

      const results = await userRepo.findByUserId(user.id);
      expect(results).toHaveLength(1);
      expect(results[0].status).toBe('active');
    });

    it('should include inactive roles when includeInactive=true', async () => {
      const userRepo = new PlotUserRoleRepositoryPrisma(prisma);
      const user = await createTestUser();
      const plot = await createTestPlot();

      await userRepo.create(
        { userId: user.id, plotId: plot.id, role: 1, status: 'active' },
        admin.id
      );
      await userRepo.create(
        { userId: user.id, plotId: plot.id, role: 2, status: 'pending' },
        admin.id
      );

      const results = await userRepo.findByUserId(user.id, true);
      expect(results).toHaveLength(2);
    });
  });

  describe('findByPlotId', () => {
    it('should return all active roles for plot', async () => {
      const userRepo = new PlotUserRoleRepositoryPrisma(prisma);
      const user1 = await createTestUser();
      const user2 = await createTestUser();
      const plot = await createTestPlot();

      await userRepo.create(
        { userId: user1.id, plotId: plot.id, role: 1, status: 'active' },
        admin.id
      );
      await userRepo.create(
        { userId: user2.id, plotId: plot.id, role: 2, status: 'active' },
        admin.id
      );

      const results = await userRepo.findByPlotId(plot.id);
      expect(results).toHaveLength(2);
      expect(results.map(r => r.plotId)).toEqual([plot.id, plot.id]);
    });
  });

  describe('existsActive', () => {
    it('should return true when active relationship exists', async () => {
      const userRepo = new PlotUserRoleRepositoryPrisma(prisma);
      const user = await createTestUser();
      const plot = await createTestPlot();

      await userRepo.create(
        { userId: user.id, plotId: plot.id, role: 1, status: 'active' },
        admin.id
      );

      const exists = await userRepo.existsActive(user.id, plot.id);
      expect(exists).toBe(true);
    });

    it('should return false when no active relationship exists', async () => {
      const userRepo = new PlotUserRoleRepositoryPrisma(prisma);
      const user = await createTestUser();
      const plot = await createTestPlot();

      const exists = await userRepo.existsActive(user.id, plot.id);
      expect(exists).toBe(false);
    });
  });

  describe('existsActiveWithRole', () => {
    it('should return true when active role exists', async () => {
      const userRepo = new PlotUserRoleRepositoryPrisma(prisma);
      const user = await createTestUser();
      const plot = await createTestPlot();

      await userRepo.create(
        { userId: user.id, plotId: plot.id, role: 1, status: 'active' },
        admin.id
      );

      const exists = await userRepo.existsActiveWithRole(user.id, plot.id, 1);
      expect(exists).toBe(true);
    });

    it('should return false when different role exists', async () => {
      const userRepo = new PlotUserRoleRepositoryPrisma(prisma);
      const user = await createTestUser();
      const plot = await createTestPlot();

      await userRepo.create(
        { userId: user.id, plotId: plot.id, role: 1, status: 'active' },
        admin.id
      );

      const exists = await userRepo.existsActiveWithRole(user.id, plot.id, 2);
      expect(exists).toBe(false);
    });
  });

  describe('userExists and plotExists', () => {
    it('should return true for existing user', async () => {
      const userRepo = new PlotUserRoleRepositoryPrisma(prisma);
      const user = await createTestUser();

      const exists = await userRepo.userExists(user.id);
      expect(exists).toBe(true);
    });

    it('should return false for non-existing user', async () => {
      const userRepo = new PlotUserRoleRepositoryPrisma(prisma);

      const exists = await userRepo.userExists('non-existent-id');
      expect(exists).toBe(false);
    });

    it('should return true for existing plot', async () => {
      const userRepo = new PlotUserRoleRepositoryPrisma(prisma);
      const plot = await createTestPlot();

      const exists = await userRepo.plotExists(plot.id);
      expect(exists).toBe(true);
    });

    it('should return false for non-existing plot', async () => {
      const userRepo = new PlotUserRoleRepositoryPrisma(prisma);

      const exists = await userRepo.plotExists('non-existent-id');
      expect(exists).toBe(false);
    });
  });

  describe('update', () => {
    it('should update plot user role', async () => {
      const userRepo = new PlotUserRoleRepositoryPrisma(prisma);
      const user = await createTestUser();
      const plot = await createTestPlot();

      const created = await userRepo.create(
        { userId: user.id, plotId: plot.id, role: 1, status: 'active' },
        admin.id
      );

      const updated = await userRepo.update(
        created.id,
        { role: 2, comment: 'Updated comment' },
        admin.id,
        'Update test'
      );

      expect(updated.role).toBe(2);
      expect(updated.comment).toBe('Updated comment');
    });

    it('should throw PlotUserRoleNotFoundError when updating non-existent', async () => {
      const userRepo = new PlotUserRoleRepositoryPrisma(prisma);

      await expect(
        userRepo.update('non-existent-id', { role: 2 }, admin.id, 'Update test')
      ).rejects.toThrow(PlotUserRoleNotFoundError);
    });
  });

  describe('deactivate', () => {
    it('should deactivate plot user role', async () => {
      const userRepo = new PlotUserRoleRepositoryPrisma(prisma);
      const user = await createTestUser();
      const plot = await createTestPlot();

      const created = await userRepo.create(
        { userId: user.id, plotId: plot.id, role: 1, status: 'active' },
        admin.id
      );

      const deactivated = await userRepo.deactivate(created.id, admin.id, 'Deactivation test');
      expect(deactivated).toBe(true);

      const found = await userRepo.findById(created.id);
      expect(found?.status).toBe('expired');
    });

    it('should return false when deactivating non-existent', async () => {
      const userRepo = new PlotUserRoleRepositoryPrisma(prisma);
      const deactivated = await userRepo.deactivate('non-existent-id', admin.id, 'Test');
      expect(deactivated).toBe(false);
    });
  });

  afterEach(async () => {
    // Дополнительная очистка после каждого теста для изоляции
    // ВАЖНО: admin не удаляем, он создаётся в beforeEach для создания/обновления записей
    await prisma.plotUserRoleHistory.deleteMany();
    await prisma.plotUserRole.deleteMany();
    await prisma.userRole.deleteMany();
    await prisma.plot.deleteMany();
    await prisma.user.deleteMany({
      where: {
        NOT: { id: admin.id } // Сохраняем admin
      }
    });
  });

  describe('findWithPagination', () => {
    it('should return paginated results', async () => {
      const userRepo = new PlotUserRoleRepositoryPrisma(prisma);
      const user1 = await createTestUser();
      const user2 = await createTestUser();
      const user3 = await createTestUser();
      const plot1 = await createTestPlot();
      const plot2 = await createTestPlot();
      const plot3 = await createTestPlot();

      await userRepo.create({ userId: user1.id, plotId: plot1.id, role: 1, status: 'active' }, admin.id);
      await userRepo.create({ userId: user2.id, plotId: plot2.id, role: 2, status: 'active' }, admin.id);
      await userRepo.create({ userId: user3.id, plotId: plot3.id, role: 3, status: 'active' }, admin.id);

      const result = await userRepo.findWithPagination({
        offset: 0,
        limit: 2,
      });

      expect(result.data).toHaveLength(2);
      expect(result.total).toBe(3);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(2);
    });

    it('should filter by userId', async () => {
      const userRepo = new PlotUserRoleRepositoryPrisma(prisma);
      const user1 = await createTestUser();
      const user2 = await createTestUser();
      const plot1 = await createTestPlot();
      const plot2 = await createTestPlot();

      await userRepo.create({ userId: user1.id, plotId: plot1.id, role: 1, status: 'active' }, admin.id);
      await userRepo.create({ userId: user1.id, plotId: plot2.id, role: 2, status: 'active' }, admin.id);
      await userRepo.create({ userId: user2.id, plotId: plot1.id, role: 3, status: 'active' }, admin.id);

      const result = await userRepo.findWithPagination({
        offset: 0,
        limit: 10,
        userId: user1.id,
      });

      expect(result.data).toHaveLength(2);
      expect(result.data.every(r => r.userId === user1.id)).toBe(true);
    });

    it('should filter by plotId', async () => {
      const userRepo = new PlotUserRoleRepositoryPrisma(prisma);
      const user1 = await createTestUser();
      const user2 = await createTestUser();
      const plot1 = await createTestPlot();
      const plot2 = await createTestPlot();

      await userRepo.create({ userId: user1.id, plotId: plot1.id, role: 1, status: 'active' }, admin.id);
      await userRepo.create({ userId: user2.id, plotId: plot1.id, role: 2, status: 'active' }, admin.id);
      await userRepo.create({ userId: user1.id, plotId: plot2.id, role: 3, status: 'active' }, admin.id);

      const result = await userRepo.findWithPagination({
        offset: 0,
        limit: 10,
        plotId: plot1.id,
      });

      expect(result.data).toHaveLength(2);
      expect(result.data.every(r => r.plotId === plot1.id)).toBe(true);
    });

    it('should filter by status', async () => {
      const userRepo = new PlotUserRoleRepositoryPrisma(prisma);
      const user1 = await createTestUser();
      const user2 = await createTestUser();
      const plot1 = await createTestPlot();
      const plot2 = await createTestPlot();

      await userRepo.create({ userId: user1.id, plotId: plot1.id, role: 1, status: 'active' }, admin.id);
      await userRepo.create({ userId: user2.id, plotId: plot2.id, role: 2, status: 'pending' }, admin.id);

      const activeResult = await userRepo.findWithPagination({
        offset: 0,
        limit: 10,
        status: 'active',
      });
      expect(activeResult.data).toHaveLength(1);
      expect(activeResult.data[0].status).toBe('active');

      const pendingResult = await userRepo.findWithPagination({
        offset: 0,
        limit: 10,
        status: 'pending',
      });
      expect(pendingResult.data).toHaveLength(1);
      expect(pendingResult.data[0].status).toBe('pending');
    });
  });
});

describe('PlotUserRoleHistoryRepository (Integration)', () => {
  let admin: { id: string };

  beforeEach(async () => {
    // Полная очистка БД перед каждым тестом для изоляции
    await prisma.plotUserRoleHistory.deleteMany();
    await prisma.plotUserRole.deleteMany();
    await prisma.userRole.deleteMany();
    await prisma.userProfile.deleteMany();
    await prisma.plot.deleteMany();
    await prisma.user.deleteMany();

    // Создаём администратора один раз для beforeEach
    admin = await prisma.user.create({
      data: {
        email: createUniqueEmail(),
        name: createUniqueName(),
        password: '$2a$10$test',
        profile: { create: { theme: 'light' } },
      },
      select: { id: true },
    });
  });

  afterEach(async () => {
    // Дополнительная очистка после каждого теста для изоляции
    // ВАЖНО: сохраняем admin, чтобы он мог использоваться в subsequent тестах как changedBy
    await prisma.plotUserRoleHistory.deleteMany();
    await prisma.plotUserRole.deleteMany();
    await prisma.userRole.deleteMany();
    await prisma.userProfile.deleteMany();
    await prisma.plot.deleteMany();
    // Удаляем всех пользователей кроме admin
    if (admin?.id) {
      await prisma.user.deleteMany({
        where: {
          NOT: { id: admin.id }
        }
      });
    }
  });

  it('should create history record when creating plot user role', async () => {
    const userRepo = new PlotUserRoleRepositoryPrisma(prisma);
    const historyRepo = new PlotUserRoleHistoryRepositoryPrisma(prisma);
    const user = await createTestUser();
    const plot = await createTestPlot();

    await userRepo.create(
      { userId: user.id, plotId: plot.id, role: 1, status: 'active' },
      admin.id
    );

    const history = await historyRepo.findAllByPlotUserId(
      (await prisma.plotUserRole.findFirst({ where: { userId: user.id, plotId: plot.id } }))!.id
    );

    expect(history).toHaveLength(1);
    expect(history[0].changedBy).toBe(admin.id);
    expect(history[0].changedAt).toBeDefined();
    expect(history[0].changedReason).toBe('Initial assignment');
  });

  it('should create history record when updating plot user role', async () => {
    const userRepo = new PlotUserRoleRepositoryPrisma(prisma);
    const historyRepo = new PlotUserRoleHistoryRepositoryPrisma(prisma);
    const user = await createTestUser();
    const plot = await createTestPlot();

    const created = await userRepo.create(
      { userId: user.id, plotId: plot.id, role: 1, status: 'active' },
      admin.id
    );

    await userRepo.update(created.id, { role: 2 }, admin.id, 'Update test');

    const history = await historyRepo.findAllByPlotUserId(created.id);
    // Сортировка по changedAt: 'desc' (новые первые)
    expect(history).toHaveLength(2);
    expect(history[0].changedReason).toBe('Update test');
    expect(history[1].changedReason).toBe('Initial assignment');
  });

  it('should return empty array when no history exists', async () => {
    const historyRepo = new PlotUserRoleHistoryRepositoryPrisma(prisma);

    // Создаём fake plotUserId для теста
    const fakeId = '00000000-0000-0000-0000-000000000000';
    const history = await historyRepo.findAllByPlotUserId(fakeId);
    expect(history).toHaveLength(0);
  });

  it('should find history by userId and plotId', async () => {
    const userRepo = new PlotUserRoleRepositoryPrisma(prisma);
    const historyRepo = new PlotUserRoleHistoryRepositoryPrisma(prisma);
    const user = await createTestUser();
    const plot = await createTestPlot();

    const created = await userRepo.create(
      { userId: user.id, plotId: plot.id, role: 1, status: 'active' },
      admin.id
    );

    const history = await historyRepo.findByUserIdAndPlotId(user.id, plot.id);
    expect(history).toHaveLength(1);
    expect(history[0].plotUserId).toBe(created.id);
  });
});

/**
 * После завершения всех тестов в файле очищаем данные
 * Это обеспечивает изоляцию между тестовыми файлями при последовательном выполнении
 */
afterAll(async () => {
  await prisma.plotUserRoleHistory.deleteMany();
  await prisma.plotUserRole.deleteMany();
  await prisma.userRole.deleteMany();
  await prisma.userProfile.deleteMany();
  await prisma.plot.deleteMany();
  await prisma.user.deleteMany();
});
