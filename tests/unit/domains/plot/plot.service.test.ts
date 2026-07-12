/**
 * @file plot.service.test.ts
 * @domain plot
 * @description Tests for PlotService business logic
 *
 * @spec
 * - findAll returns all plots sorted by plotNumber
 * - findById throws PlotNotFoundError if not found
 * - create validates data and checks uniqueness
 * - update excludes plotNumber and checks cadastral uniqueness
 * - delete checks existence before deleting
 * - search returns empty array if no filters provided
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PlotService } from '@/domains/plot/plot.service';
import type { IPlotRepository } from '@/domains/plot/plot.repository.interface';
import type { Plot, CreatePlotData, UpdatePlotData, PlotSearchFilters } from '@/domains/plot/plot.types';
import { PlotNotFoundError, PlotDuplicateError } from '@/domains/plot/plot.errors';

// Helper to create a mock repository
function createMockRepository(overrides: Partial<IPlotRepository> = {}): IPlotRepository {
  return {
    findAll: vi.fn(),
    findById: vi.fn(),
    findByPlotNumber: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    existsByCadastralNumber: vi.fn(),
    existsByCadastralNumberExcludingId: vi.fn(),
    search: vi.fn(),
    ...overrides,
  };
}

  // Helper to create a test plot
  function createTestPlot(overrides?: Partial<Plot>): Plot {
    const now = new Date();
    return {
      id: 'plot-123',
      plotNumber: 'A-1',
      cadastralNumber: '78:12:1234567:890',
      area: 10.5,
      address: 'ул. Ленина, д. 1',
      note: 'Примечание',
      createdAt: now,
      updatedAt: now,
      ...overrides,
    };
  }

describe('PlotService', () => {
  let service: PlotService;
  let mockRepo: IPlotRepository;

  beforeEach(() => {
    vi.clearAllMocks();
    mockRepo = createMockRepository({});
    service = new PlotService(mockRepo);
  });

  describe('findAll', () => {
    it('should return all plots from repository', async () => {
      const plots = [
        createTestPlot({ id: 'plot-1', plotNumber: 'A-1' }),
        createTestPlot({ id: 'plot-2', plotNumber: 'A-2' }),
        createTestPlot({ id: 'plot-3', plotNumber: 'B-1' }),
      ];

      vi.mocked(mockRepo.findAll).mockResolvedValue(plots);

      const result = await service.findAll();

      expect(result).toEqual(plots);
      expect(mockRepo.findAll).toHaveBeenCalledTimes(1);
    });
  });

  describe('findById', () => {
    it('should return plot when found', async () => {
      const plot = createTestPlot();
      vi.mocked(mockRepo.findById).mockResolvedValue(plot);

      const result = await service.findById('plot-123');

      expect(result).toEqual(plot);
      expect(mockRepo.findById).toHaveBeenCalledWith('plot-123');
    });

    it('should throw PlotNotFoundError when plot not found', async () => {
      vi.mocked(mockRepo.findById).mockResolvedValue(null);

      await expect(service.findById('non-existent')).rejects.toThrow(PlotNotFoundError);
  await expect(service.findById('non-existent')).rejects.toMatchObject({
    code: 'NOT_FOUND',
    statusCode: 404,
  });
    });
  });

  describe('create', () => {
    const validCreateData: CreatePlotData = {
      plotNumber: 'A-3',
      area: 15.5,
      address: 'ул. Садовая, д. 5',
      cadastralNumber: '78:12:9876543:210',
      note: 'Новый участок',
    };

  it('should create a plot with valid data', async () => {
    const createdPlot = createTestPlot({
      id: 'plot-new',
      plotNumber: 'A-3',
      cadastralNumber: '78:12:9876543:210',
      area: 15.5,
    });

      vi.mocked(mockRepo.findByPlotNumber).mockResolvedValue(null);
      vi.mocked(mockRepo.existsByCadastralNumber).mockResolvedValue(false);
      vi.mocked(mockRepo.create).mockResolvedValue(createdPlot);

      const result = await service.create(validCreateData);

      expect(result).toEqual(createdPlot);
  expect(mockRepo.create).toHaveBeenCalledWith({
    plotNumber: 'A-3',
    area: 15.5,
    address: 'ул. Садовая, д. 5',
    cadastralNumber: '78:12:9876543:210',
    note: 'Новый участок',
  });
    });

    it('should reject duplicate plotNumber', async () => {
      vi.mocked(mockRepo.findByPlotNumber).mockResolvedValue(createTestPlot());

      await expect(service.create(validCreateData)).rejects.toThrow(PlotDuplicateError);
    });

    it('should reject duplicate cadastralNumber', async () => {
      vi.mocked(mockRepo.findByPlotNumber).mockResolvedValue(null);
      vi.mocked(mockRepo.existsByCadastralNumber).mockResolvedValue(true);

      await expect(service.create(validCreateData)).rejects.toThrow(PlotDuplicateError);
    });

    it('should throw PlotDuplicateError with correct message for duplicate plotNumber', async () => {
      const existingPlot = createTestPlot({ plotNumber: 'A-3' });
      const duplicateData: CreatePlotData = {
        plotNumber: 'A-3',
        area: 10.5,
      };

      vi.mocked(mockRepo.findByPlotNumber).mockResolvedValue(existingPlot);
      vi.mocked(mockRepo.existsByCadastralNumber).mockResolvedValue(false);

      await expect(service.create(duplicateData)).rejects.toThrow(PlotDuplicateError);
      await expect(service.create(duplicateData)).rejects.toHaveProperty(
        'message',
        'Участок с номером A-3 уже существует',
      );
    });

    it('should throw PlotDuplicateError with correct message for duplicate cadastralNumber', async () => {
      const duplicateCadastralData: CreatePlotData = {
        plotNumber: 'A-6',
        area: 15.5,
        cadastralNumber: '78:12:9876543:210',
      };

      vi.mocked(mockRepo.findByPlotNumber).mockResolvedValue(null);
      vi.mocked(mockRepo.existsByCadastralNumber).mockResolvedValue(true);

      await expect(service.create(duplicateCadastralData)).rejects.toThrow(PlotDuplicateError);
    });

    it('should skip cadastralNumber validation when not provided', async () => {
      const dataWithoutCadastral: CreatePlotData = {
        plotNumber: 'A-4',
        area: 20,
      };

      vi.mocked(mockRepo.findByPlotNumber).mockResolvedValue(null);
      const createdPlot = createTestPlot({ id: 'plot-new-2', plotNumber: 'A-4', area: 20 });
      vi.mocked(mockRepo.create).mockResolvedValue(createdPlot);

      const result = await service.create(dataWithoutCadastral);

      expect(result).toEqual(createdPlot);
      expect(mockRepo.existsByCadastralNumber).not.toHaveBeenCalled();
    });

    it('should reject invalid data (negative area)', async () => {
      const invalidData: CreatePlotData = {
        plotNumber: 'A-5',
        area: -10,
      };

      await expect(service.create(invalidData)).rejects.toThrow();
    });

    it('should reject invalid data (missing plotNumber)', async () => {
      const invalidData = { area: 10.5 } as CreatePlotData;

      await expect(service.create(invalidData)).rejects.toThrow();
    });
  });

  describe('update', () => {
    const existingPlot = createTestPlot();

    it('should update plot with valid data', async () => {
      const updateData: UpdatePlotData = {
        area: 20.5,
        address: 'ул. Новая, д. 10',
      };

      const updatedPlot = createTestPlot({ area: 20.5, address: 'ул. Новая, д. 10' });

      vi.mocked(mockRepo.findById).mockResolvedValue(existingPlot);
      vi.mocked(mockRepo.update).mockResolvedValue(updatedPlot);

      const result = await service.update('plot-123', updateData);

      expect(result).toEqual(updatedPlot);
      expect(mockRepo.update).toHaveBeenCalledWith('plot-123', {
        area: 20.5,
        address: 'ул. Новая, д. 10',
      });
    });

    it('should throw PlotNotFoundError when plot to update not found', async () => {
      vi.mocked(mockRepo.findById).mockResolvedValue(null);

      await expect(service.update('non-existent', { area: 20 })).rejects.toThrow(PlotNotFoundError);
    });

    it('should reject duplicate cadastralNumber when updating', async () => {
      const updateData: UpdatePlotData = {
        area: 20.5,
        cadastralNumber: '78:12:9876543:210',
      };

      vi.mocked(mockRepo.findById).mockResolvedValue(existingPlot);
      vi.mocked(mockRepo.existsByCadastralNumberExcludingId).mockResolvedValue(true);

      await expect(service.update('plot-123', updateData)).rejects.toThrow(PlotDuplicateError);
    });

    it('should allow same cadastralNumber when not changing', async () => {
      const updateData: UpdatePlotData = {
        area: 25,
      };

      const updatedPlot = createTestPlot({ area: 25 });
      vi.mocked(mockRepo.findById).mockResolvedValue(existingPlot);
      vi.mocked(mockRepo.update).mockResolvedValue(updatedPlot);

      const result = await service.update('plot-123', updateData);

      expect(result).toEqual(updatedPlot);
      expect(mockRepo.existsByCadastralNumberExcludingId).not.toHaveBeenCalled();
    });

    it('should exclude plotNumber from update data (BR-1)', async () => {
      const updateData: UpdatePlotData = {
        plotNumber: 'CHANGED',
        area: 20.5,
      };

      const updatedPlot = createTestPlot({ area: 20.5 });

      vi.mocked(mockRepo.findById).mockResolvedValue(existingPlot);
      vi.mocked(mockRepo.update).mockResolvedValue(updatedPlot);

      await service.update('plot-123', updateData);

      // Verify plotNumber is not in the update call
      expect(mockRepo.update).toHaveBeenCalledWith('plot-123', {
        area: 20.5,
      });
    });

    it('should reject duplicate cadastralNumber with correct message', async () => {
      const duplicateCadastralUpdateData: UpdatePlotData = {
        cadastralNumber: '78:12:9876543:210',
      };

      vi.mocked(mockRepo.findById).mockResolvedValue(existingPlot);
      vi.mocked(mockRepo.existsByCadastralNumberExcludingId).mockResolvedValue(true);

      await expect(service.update('plot-123', duplicateCadastralUpdateData)).rejects.toThrow(
        PlotDuplicateError,
      );
      await expect(service.update('plot-123', duplicateCadastralUpdateData)).rejects.toHaveProperty(
        'message',
        'Участок с кадастровым номером 78:12:9876543:210 уже существует',
      );
    });

    it('should allow setting cadastralNumber to null', async () => {
      const updateData: UpdatePlotData = {
        cadastralNumber: null,
      };

      const updatedPlot = createTestPlot({ cadastralNumber: null });

      vi.mocked(mockRepo.findById).mockResolvedValue(existingPlot);
      vi.mocked(mockRepo.update).mockResolvedValue(updatedPlot);

      const result = await service.update('plot-123', updateData);

      expect(result).toEqual(updatedPlot);
      expect(mockRepo.existsByCadastralNumberExcludingId).not.toHaveBeenCalled();
    });

    it('should not check cadastral uniqueness when cadastralNumber is not in update data', async () => {
      const updateData: UpdatePlotData = {
        address: 'новый адрес',
        note: 'новое примечание',
      };

      const updatedPlot = createTestPlot({ address: 'новый адрес', note: 'новое примечание' });

      vi.mocked(mockRepo.findById).mockResolvedValue(existingPlot);
      vi.mocked(mockRepo.update).mockResolvedValue(updatedPlot);

      await service.update('plot-123', updateData);

      expect(mockRepo.existsByCadastralNumberExcludingId).not.toHaveBeenCalled();
    });
  });

  describe('delete', () => {
    it('should delete plot when it exists', async () => {
      vi.mocked(mockRepo.findById).mockResolvedValue(createTestPlot());
      vi.mocked(mockRepo.delete).mockResolvedValue(undefined);

      await service.delete('plot-123');

      expect(mockRepo.findById).toHaveBeenCalledWith('plot-123');
      expect(mockRepo.delete).toHaveBeenCalledWith('plot-123');
    });

    it('should throw PlotNotFoundError when plot to delete not found', async () => {
      vi.mocked(mockRepo.findById).mockResolvedValue(null);

      await expect(service.delete('non-existent')).rejects.toThrow(PlotNotFoundError);
      expect(mockRepo.delete).not.toHaveBeenCalled();
    });

    it('should throw PlotNotFoundError with correct error code', async () => {
      vi.mocked(mockRepo.findById).mockResolvedValue(null);

      await expect(service.delete('non-existent')).rejects.toThrow(PlotNotFoundError);
  await expect(service.delete('non-existent')).rejects.toHaveProperty('code', 'NOT_FOUND');
      await expect(service.delete('non-existent')).rejects.toHaveProperty('statusCode', 404);
    });
  });

  describe('search', () => {
    it('should return empty array when no filters provided', async () => {
      const result = await service.search({});

      expect(result).toEqual([]);
      expect(mockRepo.search).not.toHaveBeenCalled();
    });

    it('should return empty array when all filters are empty strings', async () => {
      const result = await service.search({
        number: '',
        cadastral: '',
        note: '',
      });

      expect(result).toEqual([]);
      expect(mockRepo.search).not.toHaveBeenCalled();
    });

    it('should return empty array when all filters are whitespace only', async () => {
      const result = await service.search({
        number: '   ',
        cadastral: '   ',
        note: '   ',
      });

      expect(result).toEqual([]);
      expect(mockRepo.search).not.toHaveBeenCalled();
    });

    it('should search by number filter', async () => {
      const filters: PlotSearchFilters = { number: 'A-1' };
      const results = [createTestPlot({ plotNumber: 'A-1' })];

      vi.mocked(mockRepo.search).mockResolvedValue(results);

      const result = await service.search(filters);

      expect(result).toEqual(results);
      expect(mockRepo.search).toHaveBeenCalledWith(filters);
    });

    it('should search by cadstral filter', async () => {
      const filters: PlotSearchFilters = { cadastral: '78:12' };
      const results = [createTestPlot({ cadastralNumber: '78:12:1234567:890' })];

      vi.mocked(mockRepo.search).mockResolvedValue(results);

      const result = await service.search(filters);

      expect(result).toEqual(results);
      expect(mockRepo.search).toHaveBeenCalledWith(filters);
    });

    it('should search by note filter', async () => {
      const filters: PlotSearchFilters = { note: 'тест' };
      const results = [createTestPlot({ note: 'Тестовый участок' })];

      vi.mocked(mockRepo.search).mockResolvedValue(results);

      const result = await service.search(filters);

      expect(result).toEqual(results);
      expect(mockRepo.search).toHaveBeenCalledWith(filters);
    });

    it('should search with combined filters (AND logic)', async () => {
      const filters: PlotSearchFilters = { number: 'A', cadastral: '78' };
      const results = [createTestPlot()];

      vi.mocked(mockRepo.search).mockResolvedValue(results);

      const result = await service.search(filters);

      expect(result).toEqual(results);
      expect(mockRepo.search).toHaveBeenCalledWith(filters);
    });
  });
});
