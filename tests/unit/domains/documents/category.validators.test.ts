/**
 * @file category.validators.test.ts
 * @domain documents
 * @description Unit-тесты для валидации категорий документов
 *
 * @traces US-22-01 AC-3, AC-4
 */
import { describe, it, expect } from 'vitest';
import { createCategorySchema } from '@/domains/documents/category.validators';

describe('createCategorySchema', () => {
  it('should accept valid category data with name only', () => {
    const validData = { name: 'Договоры' };
    const result = createCategorySchema.parse(validData);
    expect(result.name).toBe('Договоры');
  });

  it('should accept valid category data with description', () => {
    const validData = { name: 'Договоры', description: 'Юридические документы' };
    const result = createCategorySchema.parse(validData);
    expect(result.name).toBe('Договоры');
    expect(result.description).toBe('Юридические документы');
  });

  it('should accept valid category data with parentId', () => {
    const validData = { name: 'Протоколы', parentId: 'cat-1' };
    const result = createCategorySchema.parse(validData);
    expect(result.name).toBe('Протоколы');
    expect(result.parentId).toBe('cat-1');
  });

  it('should accept all fields', () => {
    const validData = {
      name: 'Договоры',
      description: 'Категория договоров',
      parentId: 'cat-parent',
    };
    const result = createCategorySchema.parse(validData);
    expect(result).toEqual(validData);
  });

  it('should reject when name is empty', () => {
    const invalidData = { name: '' };
    expect(() => createCategorySchema.parse(invalidData)).toThrow();
  });

  it('should reject when name is only whitespace', () => {
    const invalidData = { name: '   ' };
    expect(() => createCategorySchema.parse(invalidData)).toThrow();
  });

  it('should reject when name exceeds 100 characters', () => {
    const invalidData = { name: 'A'.repeat(101) };
    expect(() => createCategorySchema.parse(invalidData)).toThrow();
  });

  it('should accept name with exactly 100 characters', () => {
    const validData = { name: 'A'.repeat(100) };
    const result = createCategorySchema.parse(validData);
    expect(result.name.length).toBe(100);
  });

  it('should reject when description exceeds 500 characters', () => {
    const invalidData = { name: 'Test', description: 'A'.repeat(501) };
    expect(() => createCategorySchema.parse(invalidData)).toThrow();
  });

  it('should accept description with exactly 500 characters', () => {
    const validData = { name: 'Test', description: 'A'.repeat(500) };
    const result = createCategorySchema.parse(validData);
    expect(result.description?.length).toBe(500);
  });

  it('should transform empty description to null', () => {
    const inputData = { name: 'Test', description: '' };
    const result = createCategorySchema.parse(inputData);
    expect(result.description).toBeNull();
  });

  it('should accept null description', () => {
    const validData = { name: 'Test', description: null };
    const result = createCategorySchema.parse(validData);
    expect(result.description).toBeNull();
  });

  it('should trim whitespace from name', () => {
    const inputData = { name: '  Договоры  ' };
    const result = createCategorySchema.parse(inputData);
    expect(result.name).toBe('Договоры');
  });

  it('should accept null parentId', () => {
    const validData = { name: 'Test', parentId: null };
    const result = createCategorySchema.parse(validData);
    expect(result.parentId).toBeNull();
  });

  it('should reject when name is missing', () => {
    const invalidData = { description: 'Test' };
    expect(() => createCategorySchema.parse(invalidData)).toThrow();
  });
});
