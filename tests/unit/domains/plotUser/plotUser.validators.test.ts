/**
 * Тесты для валидаторов домена PlotUser
 */
import { describe, it, expect } from 'vitest';
import {
  createPlotUserRoleSchema,
  updatePlotUserRoleSchema,
} from '@/domains/plotUser/plotUser.validators';
import type { CreatePlotUserRoleInput, UpdatePlotUserRoleInput } from '@/domains/plotUser/plotUser.types';

describe('PlotUser Validators', () => {
  describe('createPlotUserRoleSchema', () => {
    describe('valid data', () => {
      it('should accept valid data with all required fields', () => {
        const validData: CreatePlotUserRoleInput = {
          userId: 'clx1234567890',
          plotId: 'clx2234567890',
          role: 1,
        };

        const result = createPlotUserRoleSchema.parse(validData);
        expect(result).toEqual({
          userId: 'clx1234567890',
          plotId: 'clx2234567890',
          role: 1,
          status: 'active',
        });
      });

      it('should accept valid data with status', () => {
        const validData: CreatePlotUserRoleInput = {
          userId: 'clx1234567890',
          plotId: 'clx2234567890',
          role: 2,
          status: 'pending',
        };

        const result = createPlotUserRoleSchema.parse(validData);
        expect(result).toEqual(validData);
      });

      it('should accept valid data with comment', () => {
        const validData: CreatePlotUserRoleInput = {
          userId: 'clx1234567890',
          plotId: 'clx2234567890',
          role: 1,
          comment: 'Собственник участка',
        };

        const result = createPlotUserRoleSchema.parse(validData);
        expect(result.comment).toBe('Собственник участка');
      });

      it('should accept valid data with null comment', () => {
        const validData: CreatePlotUserRoleInput = {
          userId: 'clx1234567890',
          plotId: 'clx2234567890',
          role: 1,
          comment: null,
        };

        const result = createPlotUserRoleSchema.parse(validData);
        expect(result.comment).toBeNull();
      });

      it('should accept valid data with expiresAt', () => {
        const futureDate = new Date();
        futureDate.setFullYear(futureDate.getFullYear() + 1);

        const validData: CreatePlotUserRoleInput = {
          userId: 'clx1234567890',
          plotId: 'clx2234567890',
          role: 1,
          expiresAt: futureDate.toISOString(),
        };

        const result = createPlotUserRoleSchema.parse(validData);
        expect(result.expiresAt).toBe(futureDate.toISOString());
      });

      it('should accept valid data with null expiresAt', () => {
        const validData: CreatePlotUserRoleInput = {
          userId: 'clx1234567890',
          plotId: 'clx2234567890',
          role: 1,
          expiresAt: null,
        };

        const result = createPlotUserRoleSchema.parse(validData);
        expect(result.expiresAt).toBeNull();
      });
    });

    describe('invalid data', () => {
      it('should reject missing userId', () => {
        const invalidData = {
          plotId: 'clx2234567890',
          role: 1,
        } as unknown as CreatePlotUserRoleInput;

        expect(() => createPlotUserRoleSchema.parse(invalidData)).toThrow();
      });

      it('should reject invalid userId (not cuid)', () => {
        const invalidData: CreatePlotUserRoleInput = {
          userId: 'invalid',
          plotId: 'clx2234567890',
          role: 1,
        };

        const result = createPlotUserRoleSchema.safeParse(invalidData);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.errors[0].message).toBe('Пользователь не найден');
        }
      });

      it('should reject missing plotId', () => {
        const invalidData = {
          userId: 'clx1234567890',
          role: 1,
        } as unknown as CreatePlotUserRoleInput;

        expect(() => createPlotUserRoleSchema.parse(invalidData)).toThrow();
      });

      it('should reject invalid plotId (not cuid)', () => {
        const invalidData: CreatePlotUserRoleInput = {
          userId: 'clx1234567890',
          plotId: 'invalid',
          role: 1,
        };

        const result = createPlotUserRoleSchema.safeParse(invalidData);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.errors[0].message).toBe('Участок не найден');
        }
      });

      it('should reject invalid role (0)', () => {
        const invalidData = {
          userId: 'clx1234567890',
          plotId: 'clx2234567890',
          role: 0,
        } as unknown as CreatePlotUserRoleInput;

        const result = createPlotUserRoleSchema.safeParse(invalidData);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.errors[0].message).toBe(
            'Роль должна быть 1 (владелец), 2 (проживает) или 3 (представитель)'
          );
        }
      });

      it('should reject invalid role (4)', () => {
        const invalidData = {
          userId: 'clx1234567890',
          plotId: 'clx2234567890',
          role: 4,
        } as unknown as CreatePlotUserRoleInput;

        const result = createPlotUserRoleSchema.safeParse(invalidData);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.errors[0].message).toBe(
            'Роль должна быть 1 (владелец), 2 (проживает) или 3 (представитель)'
          );
        }
      });

      it('should reject invalid role (string)', () => {
        const invalidData = {
          userId: 'clx1234567890',
          plotId: 'clx2234567890',
          role: 'owner',
        } as unknown as CreatePlotUserRoleInput;

        const result = createPlotUserRoleSchema.safeParse(invalidData);
        expect(result.success).toBe(false);
      });

      it('should reject invalid status', () => {
        const invalidData: CreatePlotUserRoleInput = {
          userId: 'clx1234567890',
          plotId: 'clx2234567890',
          role: 1,
          status: 'inactive' as 'active',
        };

        const result = createPlotUserRoleSchema.safeParse(invalidData);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.errors[0].message).toBe(
            'Статус должен быть active, pending или expired'
          );
        }
      });

      it('should reject comment too long', () => {
        const invalidData: CreatePlotUserRoleInput = {
          userId: 'clx1234567890',
          plotId: 'clx2234567890',
          role: 1,
          comment: 'a'.repeat(501),
        };

        const result = createPlotUserRoleSchema.safeParse(invalidData);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.errors[0].message).toBe(
            'Комментарий не может превышать 500 символов'
          );
        }
      });

      it('should reject invalid expiresAt format', () => {
        const invalidData: CreatePlotUserRoleInput = {
          userId: 'clx1234567890',
          plotId: 'clx2234567890',
          role: 1,
          expiresAt: 'not-a-date',
        };

        const result = createPlotUserRoleSchema.safeParse(invalidData);
        expect(result.success).toBe(false);
      });
    });
  });

  describe('updatePlotUserRoleSchema', () => {
    it('should accept empty object for partial updates', () => {
      const result = updatePlotUserRoleSchema.parse({});
      expect(result).toEqual({});
    });

    it('should accept partial data with role', () => {
      const validData: UpdatePlotUserRoleInput = {
        role: 2,
      };

      const result = updatePlotUserRoleSchema.parse(validData);
      expect(result).toEqual({ role: 2 });
    });

    it('should accept partial data with status', () => {
      const validData: UpdatePlotUserRoleInput = {
        status: 'pending',
      };

      const result = updatePlotUserRoleSchema.parse(validData);
      expect(result).toEqual({ status: 'pending' });
    });

    it('should accept partial data with comment', () => {
      const validData: UpdatePlotUserRoleInput = {
        comment: 'Новый комментарий',
      };

      const result = updatePlotUserRoleSchema.parse(validData);
      expect(result.comment).toBe('Новый комментарий');
    });

    it('should accept partial data with null comment', () => {
      const validData: UpdatePlotUserRoleInput = {
        comment: null,
      };

      const result = updatePlotUserRoleSchema.parse(validData);
      expect(result.comment).toBeNull();
    });

    it('should accept partial data with expiresAt', () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);

      const validData: UpdatePlotUserRoleInput = {
        expiresAt: futureDate.toISOString(),
      };

      const result = updatePlotUserRoleSchema.parse(validData);
      expect(result.expiresAt).toBe(futureDate.toISOString());
    });

    it('should accept partial data with null expiresAt', () => {
      const validData: UpdatePlotUserRoleInput = {
        expiresAt: null,
      };

      const result = updatePlotUserRoleSchema.parse(validData);
      expect(result.expiresAt).toBeNull();
    });

    it('should reject negative area', () => {
      const invalidData = {
        role: 1,
        comment: 'a'.repeat(501),
      } as unknown as UpdatePlotUserRoleInput;

      const result = updatePlotUserRoleSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe(
          'Комментарий не может превышать 500 символов'
        );
      }
    });

    it('should reject invalid expiresAt format', () => {
      const invalidData = {
        expiresAt: 'not-a-date',
      } as unknown as UpdatePlotUserRoleInput;

      const result = updatePlotUserRoleSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });
});
