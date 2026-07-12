/**
 * @file userProfile.validators.test.ts
 * @domain userProfile
 * @description Unit-тесты для Zod-схем валидации UserProfile
 *
 * @spec
 * - userProfileCreateSchema: валидация обязательных firstName/lastName, опциональные поля
 * - userProfileUpdateSchema: частичное обновление, опциональные поля
 * - avatarFileSchema: проверка размера и типа файла
 * - updateThemeSchema: валидация темы оформления
 *
 * @see tests/unit/domains/roles/roles.validators.test.ts — пример структуры тестов
 */
import { describe, it, expect } from 'vitest';
import {
  userProfileCreateSchema,
  userProfileUpdateSchema,
  avatarFileSchema,
  updateThemeSchema,
} from '@/domains/userProfile/userProfile.validators';
import { ZodError } from 'zod';

// ============================================================================
// userProfileCreateSchema Tests
// ============================================================================

describe('userProfileCreateSchema', () => {
  describe('valid data', () => {
    it('should accept valid profile data with all fields', () => {
      const validData = {
        firstName: 'Иван',
        middleName: 'Петрович',
        lastName: 'Петров',
        phone: '+79991234567',
        bio: 'Тестовая биография',
      };

      const result = userProfileCreateSchema.parse(validData);

      expect(result).toEqual(validData);
    });

    it('should accept profile data without optional fields', () => {
      const minimalData = {
        firstName: 'Иван',
        lastName: 'Петров',
      };

      const result = userProfileCreateSchema.parse(minimalData);

      expect(result).toEqual(minimalData);
    });

    it('should transform empty middleName to null', () => {
      const data = {
        firstName: 'Иван',
        middleName: '',
        lastName: 'Петров',
      };

      const result = userProfileCreateSchema.parse(data);

      expect(result.middleName).toBeNull();
    });

    it('should transform empty bio to null', () => {
      const data = {
        firstName: 'Иван',
        lastName: 'Петров',
        bio: '',
      };

      const result = userProfileCreateSchema.parse(data);

      expect(result.bio).toBeNull();
    });
  });

  describe('invalid data', () => {
    it('should reject missing firstName', () => {
      const invalidData = {
        lastName: 'Петров',
      };

      expect(() => userProfileCreateSchema.parse(invalidData)).toThrow(ZodError);
    });

    it('should reject empty firstName', () => {
      const invalidData = {
        firstName: '',
        lastName: 'Петров',
      };

      expect(() => userProfileCreateSchema.parse(invalidData)).toThrow(ZodError);
    });

    it('should reject firstName less than 2 characters', () => {
      const invalidData = {
        firstName: 'И',
        lastName: 'Петров',
      };

      const result = userProfileCreateSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe(
          'Имя должно содержать минимум 2 символа'
        );
      }
    });

    it('should reject firstName more than 50 characters', () => {
      const invalidData = {
        firstName: 'И'.repeat(51),
        lastName: 'Петров',
      };

      const result = userProfileCreateSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe(
          'Имя не может превышать 50 символов'
        );
      }
    });

    it('should reject missing lastName', () => {
      const invalidData = {
        firstName: 'Иван',
      };

      expect(() => userProfileCreateSchema.parse(invalidData)).toThrow(ZodError);
    });

    it('should reject empty lastName', () => {
      const invalidData = {
        firstName: 'Иван',
        lastName: '',
      };

      expect(() => userProfileCreateSchema.parse(invalidData)).toThrow(ZodError);
    });

    it('should reject lastName less than 2 characters', () => {
      const invalidData = {
        firstName: 'Иван',
        lastName: 'П',
      };

      const result = userProfileCreateSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe(
          'Фамилия должна содержать минимум 2 символа'
        );
      }
    });

    it('should reject lastName more than 50 characters', () => {
      const invalidData = {
        firstName: 'Иван',
        lastName: 'П'.repeat(51),
      };

      const result = userProfileCreateSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe(
          'Фамилия не может превышать 50 символов'
        );
      }
    });

    it('should reject bio more than 500 characters', () => {
      const invalidData = {
        firstName: 'Иван',
        lastName: 'Петров',
        bio: 'Текст'.repeat(126), // 504 characters
      };

      const result = userProfileCreateSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe(
          'Биография не может превышать 500 символов'
        );
      }
    });
  });
});

// ============================================================================
// userProfileUpdateSchema Tests
// ============================================================================

describe('userProfileUpdateSchema', () => {
  it('should accept empty object for partial updates', () => {
    const result = userProfileUpdateSchema.parse({});

    expect(result).toEqual({});
  });

  it('should accept partial data with name', () => {
    const data = { firstName: 'Александр' };
    const result = userProfileUpdateSchema.parse(data);

    expect(result.firstName).toBe('Александр');
  });

  it('should accept partial data without name', () => {
    const data = { middleName: 'Петрович' };
    const result = userProfileUpdateSchema.parse(data);

    expect(result.middleName).toBe('Петрович');
  });

  it('should accept null name', () => {
    const data = { firstName: null };
    const result = userProfileUpdateSchema.parse(data);

    expect(result.firstName).toBeNull();
  });

  it('should accept null middleName', () => {
    const data = { middleName: null };
    const result = userProfileUpdateSchema.parse(data);

    expect(result.middleName).toBeNull();
  });

  it('should transform empty name to null', () => {
    const data = { firstName: '' };
    const result = userProfileUpdateSchema.parse(data);

    expect(result.firstName).toBeNull();
  });

  it('should transform empty middleName to null', () => {
    const data = { middleName: '' };
    const result = userProfileUpdateSchema.parse(data);

    expect(result.middleName).toBeNull();
  });

  it('should transform empty lastName to null', () => {
    const data = { lastName: '' };
    const result = userProfileUpdateSchema.parse(data);

    expect(result.lastName).toBeNull();
  });
});

// ============================================================================
// avatarFileSchema Tests
// ============================================================================

describe('avatarFileSchema', () => {
  const maxSize = 5 * 1024 * 1024; // 5MB

  it('should accept valid file data', () => {
    const validData = {
      fileSize: 1024 * 1024, // 1MB
      fileType: 'image/jpeg',
    };

    const result = avatarFileSchema.parse(validData);

    expect(result).toEqual(validData);
  });

  it('should accept file data with all supported MIME types', () => {
    const supportedTypes = ['image/jpeg', 'image/png', 'image/gif'];

    supportedTypes.forEach((type) => {
      const data = {
        fileSize: 1024 * 1024,
        fileType: type,
      };

      const result = avatarFileSchema.parse(data);
      expect(result.fileType).toBe(type);
    });
  });

  it('should reject file larger than 5MB', () => {
    const invalidData = {
      fileSize: maxSize + 1, // 5MB + 1 byte
      fileType: 'image/jpeg',
    };

    const result = avatarFileSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toBe(
        'Размер файла не должен превышать 5MB'
      );
    }
  });

  it('should reject unsupported file type', () => {
    const invalidData = {
      fileSize: 1024 * 1024,
      fileType: 'application/pdf',
    };

    const result = avatarFileSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toBe(
        'Поддерживаются только форматы JPG, PNG, GIF'
      );
    }
  });
});

// ============================================================================
// updateThemeSchema Tests
// ============================================================================

describe('updateThemeSchema', () => {
  it('should accept valid theme "light"', () => {
    const result = updateThemeSchema.parse({ theme: 'light' });

    expect(result.theme).toBe('light');
  });

  it('should accept valid theme "dark"', () => {
    const result = updateThemeSchema.parse({ theme: 'dark' });

    expect(result.theme).toBe('dark');
  });

  it('should accept valid theme "green"', () => {
    const result = updateThemeSchema.parse({ theme: 'green' });

    expect(result.theme).toBe('green');
  });

  it('should reject invalid theme', () => {
    const invalidData = { theme: 'blue' };

    const result = updateThemeSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toBe(
        'Недопустимое значение темы. Доступны: light, dark, green'
      );
    }
  });
});
