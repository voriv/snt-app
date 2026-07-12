/**
 * @file plot.errors.test.ts
 * @domain plot
 * @description Tests for plot domain error classes
 *
 * @spec
 * - All errors extend appropriate base classes
 * - Error codes are correct
 * - HTTP status codes are correct
 * - Messages are correct
 */

import { describe, it, expect } from 'vitest';
import {
  PlotNotFoundError,
  PlotDuplicateError,
  PlotInvalidDataError,
} from '@/domains/plot/plot.errors';
import { NotFoundError, ConflictError, ValidationError } from '@/shared/errors';

describe('Plot Domain Errors', () => {
  describe('PlotNotFoundError', () => {
    it('should extend NotFoundError', () => {
      const error = new PlotNotFoundError('plot-123');
      expect(error).toBeInstanceOf(NotFoundError);
    });

    it('should have correct error code', () => {
      const error = new PlotNotFoundError('plot-123');
      expect(error.code).toBe('NOT_FOUND');
    });

    it('should have correct HTTP status code', () => {
      const error = new PlotNotFoundError('plot-123');
      expect(error.statusCode).toBe(404);
    });

    it('should have correct message', () => {
      const plotId = 'plot-123';
      const error = new PlotNotFoundError(plotId);
      expect(error.message).toBe(`Plot with id ${plotId} not found`);
    });
  });

  describe('PlotDuplicateError', () => {
    it('should extend ConflictError', () => {
      const error = new PlotDuplicateError('plotNumber', 'A-1');
      expect(error).toBeInstanceOf(ConflictError);
    });

    it('should have correct error code', () => {
      const error = new PlotDuplicateError('plotNumber', 'A-1');
      expect(error.code).toBe('CONFLICT_ERROR');
    });

    it('should have correct HTTP status code', () => {
      const error = new PlotDuplicateError('plotNumber', 'A-1');
      expect(error.statusCode).toBe(409);
    });

    it('should have correct message with plot number', () => {
      const plotNumber = 'A-1';
      const error = new PlotDuplicateError('plotNumber', plotNumber);
      expect(error.message).toBe(`Участок с номером ${plotNumber} уже существует`);
    });

    it('should have correct message with cadastral number', () => {
      const cadastralNumber = '78:12:1234567:890';
      const error = new PlotDuplicateError('cadastralNumber', cadastralNumber);
      expect(error.message).toBe(`Участок с кадастровым номером ${cadastralNumber} уже существует`);
    });
  });

  describe('PlotInvalidDataError', () => {
    it('should extend ValidationError', () => {
      const error = new PlotInvalidDataError('Invalid field');
      expect(error).toBeInstanceOf(ValidationError);
    });

    it('should have correct error code', () => {
      const error = new PlotInvalidDataError('Invalid field');
      expect(error.code).toBe('VALIDATION_ERROR');
    });

    it('should have correct HTTP status code', () => {
      const error = new PlotInvalidDataError('Invalid field');
      expect(error.statusCode).toBe(400);
    });

    it('should have correct message', () => {
      const field = 'plot_number';
      const error = new PlotInvalidDataError(field);
      expect(error.message).toBe(`Plot data invalid: ${field}`);
    });
  });
});
