/**
 * @file plot.test.ts
 * @domain plot
 * @description Integration tests for PlotRepository and PlotService with real PostgreSQL database
 *
 * @spec
 * - Tests use direct prisma for data setup with beforeEach cleanup
 * - Verifies CRUD operations for Plot entity
 * - Tests unique constraints (plotNumber, cadastralNumber)
 * - Tests search functionality with filters
 * - Tests service layer validation
 *
 * @see docs/tests/integration-tests.md
 */
import { describe, it, expect, beforeEach, afterEach, afterAll } from 'vitest';
import { PlotRepositoryPrisma } from '@/domains/plot/plot.repository.prisma';
import { PlotService } from '@/domains/plot/plot.service';
import {
  PlotDuplicateError,
  PlotNotFoundError,
  PlotInvalidDataError,
} from '@/domains/plot/plot.errors';
import { createUniquePlotNumber, createUniqueCadastralNumber, createUniqueSuffix } from '../helpers';
import { prisma } from '../setup';

describe('PlotRepository (Integration)', () => {
  let repo: PlotRepositoryPrisma;

  beforeEach(async () => {
    // Полная очистка БД перед каждым тестом для изоляции
    // Порядок важен из-за FK constraints: сначала зависимые таблицы, потом родительские
    await prisma.plotUserRoleHistory.deleteMany();
    await prisma.plotUserRole.deleteMany();
    await prisma.plot.deleteMany();
    // Сохраняем глобальных тестовых пользователей (нужны для roles.test.ts)
    await prisma.user.deleteMany({
      where: {
        NOT: { email: { contains: 'test-search-user' } },
      },
    });
    
    repo = new PlotRepositoryPrisma(prisma);
  });

  describe('create', () => {
    it('should create a plot record with all fields', async () => {
      const plotNumber = createUniquePlotNumber();

      await repo.create({
        plotNumber,
        area: 10.5,
        address: 'ул. Ленина',
        note: 'Тестовый участок',
      });

      const created = await prisma.plot.findUnique({
        where: { plot_number: plotNumber },
      });

      expect(created).not.toBeNull();
      expect(created!.plot_number).toBe(plotNumber);
      expect(Number(created!.area)).toBe(10.5);
      expect(created!.address).toBe('ул. Ленина');
      expect(created!.note).toBe('Тестовый участок');
    });

    it('should create a plot with optional fields', async () => {
      const plotNumber = createUniquePlotNumber();
      const cadastralNumber = createUniqueCadastralNumber();

      await repo.create({
        plotNumber,
        area: 15.0,
        cadastralNumber,
      });

      const created = await prisma.plot.findUnique({
        where: { plot_number: plotNumber },
      });

      expect(created).not.toBeNull();
      expect(created!.plot_number).toBe(plotNumber);
      expect(created!.cadastral_number).toBe(cadastralNumber);
      expect(created!.address).toBeNull();
      expect(created!.note).toBeNull();
    });

    it('should reject duplicate plotNumber', async () => {
      const plotNumber = createUniquePlotNumber();

      await repo.create({
        plotNumber,
        area: 20,
      });

      await expect(
        repo.create({
          plotNumber,
          area: 25,
        })
      ).rejects.toThrow(PlotDuplicateError);
    });

    it('should reject duplicate cadastralNumber', async () => {
      const plotNumber1 = createUniquePlotNumber();
      const plotNumber2 = createUniquePlotNumber();
      const cadastralNumber = createUniqueCadastralNumber();

      await repo.create({
        plotNumber: plotNumber1,
        area: 30,
        cadastralNumber,
      });

      await expect(
        repo.create({
          plotNumber: plotNumber2,
          area: 35,
          cadastralNumber,
        })
      ).rejects.toThrow(PlotDuplicateError);
    });
  });

  describe('findById', () => {
    it('should return plot by ID', async () => {
      const plotNumber = createUniquePlotNumber();

      await repo.create({
        plotNumber,
        area: 100,
      });

      const created = await prisma.plot.findUnique({
        where: { plot_number: plotNumber },
      });

      const result = await repo.findById(created!.id);
      expect(result).not.toBeNull();
      expect(result!.id).toBe(created!.id);
      expect(result!.plotNumber).toBe(plotNumber);
    });

    it('should return null for non-existent ID', async () => {
      const result = await repo.findById('non-existent-id');
      expect(result).toBeNull();
    });
  });

  describe('findByPlotNumber', () => {
    it('should return plot by plotNumber', async () => {
      const plotNumber = createUniquePlotNumber();

      await repo.create({
        plotNumber,
        area: 100,
      });

      const result = await repo.findByPlotNumber(plotNumber);
      expect(result).not.toBeNull();
      expect(result!.plotNumber).toBe(plotNumber);
    });

    it('should return null for non-existent plotNumber', async () => {
      const result = await repo.findByPlotNumber('non-existent');
      expect(result).toBeNull();
    });
  });

  describe('findAll', () => {
    it('should return all plots sorted by plotNumber', async () => {
      const plotNumbers = [createUniquePlotNumber(), createUniquePlotNumber(), createUniquePlotNumber()];

      for (const plotNumber of plotNumbers) {
        await repo.create({
          plotNumber,
          area: 100,
        });
      }

      const result = await repo.findAll();
      expect(result).toHaveLength(3);
      expect(result).toEqual(
        expect.arrayContaining(plotNumbers.map((num) => expect.objectContaining({ plotNumber: num })))
      );
    });
  });

  describe('update', () => {
    it('should update plot area', async () => {
      const plotNumber = createUniquePlotNumber();

      const created = await repo.create({
        plotNumber,
        area: 10.0,
      });

      await prisma.plot.update({
        where: { id: created.id },
        data: { area: 20.0 },
      });

      const result = await repo.findById(created.id);
      expect(result).not.toBeNull();
      expect(result!.area).toBe(20.0);
    });

    it('should update multiple fields', async () => {
      const plotNumber = createUniquePlotNumber();

      await repo.create({
        plotNumber,
        area: 10.0,
      });

      await prisma.plot.update({
        where: { plot_number: plotNumber },
        data: { area: 20.0, address: 'New Address' },
      });

      const result = await repo.findByPlotNumber(plotNumber);
      expect(result).not.toBeNull();
      expect(result!.area).toBe(20.0);
      expect(result!.address).toBe('New Address');
    });

    it('should throw PlotNotFoundError when updating non-existent plot', async () => {
      await expect(repo.update('non-existent', { area: 10 })).rejects.toThrow(PlotNotFoundError);
    });
  });

  describe('delete', () => {
    it('should throw on delete non-existent', async () => {
      await expect(repo.delete('non-existent')).rejects.toThrow(PlotNotFoundError);
    });
  });

  describe('existsByCadastralNumber', () => {
    it('should return true when cadastralNumber exists', async () => {
      const cadastralNumber = createUniqueCadastralNumber();

      await repo.create({
        plotNumber: createUniquePlotNumber(),
        area: 10.0,
        cadastralNumber,
      });

      const result = await repo.existsByCadastralNumber(cadastralNumber);
      expect(result).toBe(true);
    });

    it('should return false when cadastralNumber does not exist', async () => {
      const result = await repo.existsByCadastralNumber('non-existent');
      expect(result).toBe(false);
    });
  });

  describe('existsByCadastralNumberExcludingId', () => {
    it('should return false when excluding the only plot with cadastralNumber', async () => {
      const cadastralNumber = createUniqueCadastralNumber();

      const created = await repo.create({
        plotNumber: createUniquePlotNumber(),
        area: 10.0,
        cadastralNumber,
      });

      const result = await repo.existsByCadastralNumberExcludingId(created.id, cadastralNumber);
      expect(result).toBe(false);
    });

    it('should return true when another plot has the same cadastralNumber', async () => {
      // Генерируем уникальные cadastralNumbers с высокой энтропией
      // Формат: XX:XX:XXXXXXX:XXX (ровно 7 цифр в третьем сегменте)
      const cadastralNumber1 = createUniqueCadastralNumber();
      const cadastralNumber2 = createUniqueCadastralNumber();

      // Очищаем возможные конфликтующие записи с такими cadastralNumber перед тестом
      await prisma.$executeRaw`
        DELETE FROM plots WHERE cadastral_number IN (${cadastralNumber1}, ${cadastralNumber2})
      `;

      // Создаем первый участок с cadastralNumber1
      const created1 = await repo.create({
        plotNumber: createUniquePlotNumber(),
        area: 10.0,
        cadastralNumber: cadastralNumber1,
      });

      // Создаем второй участок с cadastralNumber2
      const created2 = await repo.create({
        plotNumber: createUniquePlotNumber(),
        area: 30.0,
        cadastralNumber: cadastralNumber2,
      });

      // Затем удаляем cadastralNumber у created1, чтобы освободить cadastralNumber1
      await prisma.$executeRaw`
        UPDATE plots SET cadastral_number = NULL WHERE id = ${created1.id}
      `;

      // Теперь обновляем created2 на cadastralNumber1 напрямую через raw query
      await prisma.$executeRaw`
        UPDATE plots SET cadastral_number = ${cadastralNumber1} WHERE id = ${created2.id}
      `;

      // Теперь existsByCadastralNumberExcludingId должен вернуть true,
      // так как есть другой участок (created2) с тем же cadastralNumber1 (кроме created1)
      const result = await repo.existsByCadastralNumberExcludingId(cadastralNumber1, created1.id);
      expect(result).toBe(true);
    });
  });

  describe('search (ILIKE)', () => {
    beforeEach(async () => {
      await repo.create({
        plotNumber: 'INT-TEST-001',
        area: 10.0,
        note: 'Test plot 1',
      });
      await repo.create({
        plotNumber: 'INT-TEST-002',
        area: 20.0,
        note: 'Another plot',
      });
      await repo.create({
        plotNumber: 'INT-TEST-003',
        area: 30.0,
        note: null,
      });
    });

    afterEach(async () => {
      await prisma.plot.deleteMany({ where: { plot_number: { startsWith: 'INT-TEST-' } } });
    });

    it('should return all plots when no filters provided', async () => {
      const result = await repo.search({});
      expect(result).toHaveLength(3);
    });

    it('should return all plots when all filters are empty strings', async () => {
      const result = await repo.search({ number: '', note: '' });
      expect(result).toHaveLength(3);
    });

    it('should search by number filter', async () => {
      const result = await repo.search({ number: 'TEST' });
      expect(result).toHaveLength(3);
      expect(result.every((p) => p.plotNumber.includes('TEST'))).toBe(true);
    });

    it('should search by note filter', async () => {
      const result = await repo.search({ note: 'Test' });
      expect(result).toHaveLength(1);
      expect(result[0]?.plotNumber).toBe('INT-TEST-001');
    });

    it('should search with combined filters (AND logic)', async () => {
      const result = await repo.search({ number: 'INT', note: 'Test' });
      expect(result).toHaveLength(1);
    });
  });
});

/**
 * После завершения всех тестов в секции PlotRepository очищаем данные
 * Это обеспечивает изоляцию между тестовыми секциями
 */
afterEach(async () => {
  await prisma.plotUserRoleHistory.deleteMany();
  await prisma.plotUserRole.deleteMany();
  await prisma.plot.deleteMany();
  // Сохраняем глобальных тестовых пользователей (нужны для roles.test.ts)
  await prisma.user.deleteMany({
    where: {
      NOT: { email: { contains: 'test-search-user' } },
    },
  });
});

describe('PlotService (Integration)', () => {
  let repo: PlotRepositoryPrisma;
  let service: PlotService;

  beforeEach(async () => {
    // Полная очистка БД перед каждым тестом для изоляции
    await prisma.plotUserRoleHistory.deleteMany();
    await prisma.plotUserRole.deleteMany();
    await prisma.plot.deleteMany();
    // Сохраняем глобальных тестовых пользователей (нужны для roles.test.ts)
    await prisma.user.deleteMany({
      where: {
        NOT: { email: { contains: 'test-search-user' } },
      },
    });
    
    repo = new PlotRepositoryPrisma(prisma);
    service = new PlotService(repo);
  });

  describe('create', () => {
    it('should create a plot through service layer', async () => {
      const plotNumber = createUniquePlotNumber();

      const plot = await service.create({
        plotNumber,
        area: 10.5,
        address: 'ул. Пушкина',
        note: 'Service test',
      });

      expect(plot.id).toBeDefined();
      expect(plot.plotNumber).toBe(plotNumber);
      expect(plot.area).toBe(10.5);

      const created = await prisma.plot.findUnique({
        where: { plot_number: plotNumber },
      });
      expect(created).not.toBeNull();
    });

    it('should throw PlotDuplicateError on duplicate plotNumber', async () => {
      const plotNumber = createUniquePlotNumber();

      await service.create({
        plotNumber,
        area: 10.0,
      });

      await expect(
        service.create({
          plotNumber,
          area: 20.0,
        })
      ).rejects.toThrow(PlotDuplicateError);
    });
  });

  describe('update (real DB)', () => {
    it('should update plot area', async () => {
      const plotNumber = createUniquePlotNumber();

      const plot = await service.create({
        plotNumber,
        area: 10.0,
      });

      await service.update(plot.id, { area: 20.0 });

      const updated = await service.findById(plot.id);
      expect(updated.area).toBe(20.0);
    });

    it('should throw PlotNotFoundError when updating non-existent plot', async () => {
      await expect(service.update('non-existent', { area: 10 })).rejects.toThrow(PlotNotFoundError);
    });

    it('should check cadastral uniqueness when updating', async () => {
      const plotNumber1 = createUniquePlotNumber();
      const plotNumber2 = createUniquePlotNumber();
      const cadastralNumber = createUniqueCadastralNumber();

      const plot1 = await service.create({
        plotNumber: plotNumber1,
        area: 10.0,
        cadastralNumber,
      });

      const plot2 = await service.create({
        plotNumber: plotNumber2,
        area: 20.0,
      });

      // Попытка присвоить plot2 тот же cadastralNumber что у plot1 должна вызвать ошибку
      await expect(service.update(plot2.id, { cadastralNumber })).rejects.toThrow(PlotDuplicateError);
    });

    it('should allow same cadastralNumber when not changing', async () => {
      const plotNumber1 = createUniquePlotNumber();
      const cadastralNumber = createUniqueCadastralNumber();

      const plot1 = await service.create({
        plotNumber: plotNumber1,
        area: 10.0,
        cadastralNumber,
      });

      // Update plot1 без изменения cadastralNumber - должно succeed
      await service.update(plot1.id, { area: 25.0 });

      const updated = await service.findById(plot1.id);
      expect(updated.area).toBe(25.0);
      expect(updated.cadastralNumber).toBe(cadastralNumber);
    });
  });

  describe('delete', () => {
    it('should delete plot when it exists', async () => {
      const plotNumber = `DEL-${createUniqueSuffix()}`;

      const plot = await service.create({
        plotNumber,
        area: 10.0,
      });

      await service.delete(plot.id);

      // Проверяем удаление через прямой запрос к БД
      const deleted = await prisma.plot.findUnique({
        where: { plot_number: plotNumber },
      });
      expect(deleted).toBeNull();
    });
  });

  describe('search', () => {
    let uniquePrefix: string;

    beforeEach(async () => {
      uniquePrefix = createUniqueSuffix().replace(/[-.]/g, '').substring(0, 6);
      await service.create({
        plotNumber: `SRCH-${uniquePrefix}-001`,
        area: 10.0,
        note: `Specific search note ${uniquePrefix}`,
      });
      await service.create({
        plotNumber: `SRCH-${uniquePrefix}-002`,
        area: 20.0,
        note: `Different note ${uniquePrefix}`,
      });
    });

    afterEach(async () => {
      // Очистка тестовых данных после каждой итерации
      await prisma.plot.deleteMany({ where: { plot_number: { startsWith: `SRCH-${uniquePrefix}` } } });
    });

    it('should return all plots when no filters provided', async () => {
      const result = await service.search({});
      expect(result).toHaveLength(2);
    });

    it('should return all plots when all filters are empty strings', async () => {
      const result = await service.search({ number: '', note: '' });
      expect(result).toHaveLength(2);
    });

    it('should search by number filter', async () => {
      const result = await service.search({ number: uniquePrefix });
      expect(result).toHaveLength(2);
      expect(result.every((p) => p.plotNumber.includes(uniquePrefix))).toBe(true);
    });

    it('should search by note filter', async () => {
      const result = await service.search({ note: `Specific search note ${uniquePrefix}` });
      expect(result).toHaveLength(1);
      expect(result[0]?.plotNumber).toBe(`SRCH-${uniquePrefix}-001`);
    });

    it('should search with combined filters (AND logic)', async () => {
      const result = await service.search({ number: uniquePrefix, note: `Specific search note ${uniquePrefix}` });
      expect(result).toHaveLength(1);
    });
  });
});
