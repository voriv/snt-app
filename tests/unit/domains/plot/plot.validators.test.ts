/**
 * @file plot.validators.test.ts
 * @domain plot
 * @description Tests for plot domain validators (Zod schemas)
 *
 * @spec
 * - createPlotSchema validates correct input
 * - createPlotSchema rejects invalid input
 * - updatePlotSchema validates partial updates
 * - updatePlotSchema allows empty fields
 */

import { describe, it, expect } from 'vitest';
import { createPlotSchema, updatePlotSchema } from '@/domains/plot/plot.validators';

describe('Plot Validators', () => {
  describe('createPlotSchema', () => {
    const validData = {
      plotNumber: 'A-1',
      area: 10.5,
      address: 'ул. Ленина, д. 1',
    };

    describe('valid data', () => {
      it('should accept valid data with all required fields', () => {
        const result = createPlotSchema.safeParse(validData);
        expect(result.success).toBe(true);
      });

  it('should accept valid data with cadastral number', () => {
    const data = {
      ...validData,
      cadastralNumber: '78:12:1234567:890',
    };
    const result = createPlotSchema.safeParse(data);
    expect(result.success).toBe(true);
  });

      it('should accept valid data with note', () => {
        const data = {
          ...validData,
          note: 'Некоторые заметки',
        };
        const result = createPlotSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it('should accept very large area (no max limit)', () => {
        const data = {
          ...validData,
          area: 999999999,
        };
        const result = createPlotSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it('should accept area with many decimal places', () => {
        const data = {
          ...validData,
          area: 10.123456789,
        };
        const result = createPlotSchema.safeParse(data);
        expect(result.success).toBe(true);
      });
    });

    describe('invalid data', () => {
      it('should reject missing plotNumber', () => {
        const result = createPlotSchema.safeParse({ area: 10.5 });
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.errors[0].path).toContain('plotNumber');
        }
      });

      it('should reject empty plotNumber', () => {
        const result = createPlotSchema.safeParse({ plotNumber: '' });
        expect(result.success).toBe(false);
      });

      it('should reject plotNumber less than 1 character', () => {
        const result = createPlotSchema.safeParse({ plotNumber: '' });
        expect(result.success).toBe(false);
      });

      it('should reject missing area', () => {
        const result = createPlotSchema.safeParse({ plotNumber: 'A-1' });
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.errors[0].path).toContain('area');
        }
      });

      it('should reject negative area', () => {
        const result = createPlotSchema.safeParse({ ...validData, area: -10 });
        expect(result.success).toBe(false);
      });

      it('should reject zero area', () => {
        const result = createPlotSchema.safeParse({ ...validData, area: 0 });
        expect(result.success).toBe(false);
      });

      it('should reject cadastral number with invalid format', () => {
        const data = {
          ...validData,
          cadastralNumber: 'invalid-cadastral',
        };
        const result = createPlotSchema.safeParse(data);
        expect(result.success).toBe(false);
      });

  it('should accept cadastral number with valid format', () => {
    const data = {
      ...validData,
      cadastralNumber: '78:12:1234567:890',
    };
    const result = createPlotSchema.safeParse(data);
    expect(result.success).toBe(true);
  });

      it('should accept cadastral number as empty string', () => {
        const data = {
          ...validData,
          cadastralNumber: '',
        };
        const result = createPlotSchema.safeParse(data);
        expect(result.success).toBe(true);
      });
    });
  });

  describe('updatePlotSchema', () => {
    it('should accept empty object for partial updates', () => {
      const result = updatePlotSchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it('should accept partial data with plotNumber', () => {
      const result = updatePlotSchema.safeParse({ plotNumber: 'A-2' });
      expect(result.success).toBe(true);
    });

    it('should accept partial data with area', () => {
      const result = updatePlotSchema.safeParse({ area: 20.5 });
      expect(result.success).toBe(true);
    });

  it('should accept partial data with cadastralNumber', () => {
    const result = updatePlotSchema.safeParse({ cadastralNumber: '78:12:7654321:890' });
    expect(result.success).toBe(true);
  });

    it('should accept partial data with address', () => {
      const result = updatePlotSchema.safeParse({ address: 'ул. Новая, д. 5' });
      expect(result.success).toBe(true);
    });

    it('should accept partial data with note', () => {
      const result = updatePlotSchema.safeParse({ note: 'Обновленная заметка' });
      expect(result.success).toBe(true);
    });

    it('should reject negative area', () => {
      const result = updatePlotSchema.safeParse({ area: -5 });
      expect(result.success).toBe(false);
    });

    it('should reject zero area', () => {
      const result = updatePlotSchema.safeParse({ area: 0 });
      expect(result.success).toBe(false);
    });

    it('should accept large area (no max limit)', () => {
      const result = updatePlotSchema.safeParse({ area: 999999999 });
      expect(result.success).toBe(true);
    });

    it('should accept cadastral number with empty string', () => {
      const result = updatePlotSchema.safeParse({ cadastralNumber: '' });
      expect(result.success).toBe(true);
    });

    it('should reject cadastral number with invalid format', () => {
      const result = updatePlotSchema.safeParse({ cadastralNumber: 'invalid' });
      expect(result.success).toBe(false);
    });
  });
});
