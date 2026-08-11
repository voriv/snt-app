/**
 * @file category.errors.test.ts
 * @domain documents
 * @description Unit-тесты для классов ошибок категорий документов
 */
import { describe, it, expect } from 'vitest';
import {
  CategoryNotFoundError,
  CategoryNameNotUniqueError,
  ParentCategoryNotFoundError,
} from '@/domains/documents/category.errors';
import {
  NotFoundError,
  ConflictError,
} from '@/shared/errors';

describe('CategoryNotFoundError', () => {
  it('should extend NotFoundError', () => {
    const error = new CategoryNotFoundError('cat-123');
    expect(error).toBeInstanceOf(NotFoundError);
  });

  it('should have correct HTTP status', () => {
    const error = new CategoryNotFoundError('cat-123');
    expect(error.statusCode).toBe(404);
  });

  it('should include the ID in message', () => {
    const error = new CategoryNotFoundError('cat-123');
    expect(error.message).toContain('cat-123');
  });

  it('should have correct error name', () => {
    const error = new CategoryNotFoundError('cat-123');
    expect(error.name).toBe('CategoryNotFoundError');
  });
});

describe('CategoryNameNotUniqueError', () => {
  it('should extend ConflictError', () => {
    const error = new CategoryNameNotUniqueError('Договоры', null);
    expect(error).toBeInstanceOf(ConflictError);
  });

  it('should have correct HTTP status', () => {
    const error = new CategoryNameNotUniqueError('Договоры', null);
    expect(error.statusCode).toBe(409);
  });

  it('should include that category name already exists in message', () => {
    const error = new CategoryNameNotUniqueError('Договоры', null);
    expect(error.message).toContain('Категория с таким названием уже существует');
  });

  it('should mention root level when parentId is null', () => {
    const error = new CategoryNameNotUniqueError('Договоры', null);
    expect(error.message).toContain('на корневом уровне');
  });

  it('should mention parent category when parentId is provided', () => {
    const error = new CategoryNameNotUniqueError('Протоколы', 'cat-parent');
    expect(error.message).toContain('в родительской категории cat-parent');
  });

  it('should have correct error name', () => {
    const error = new CategoryNameNotUniqueError('Договоры', null);
    expect(error.name).toBe('CategoryNameNotUniqueError');
  });
});

describe('ParentCategoryNotFoundError', () => {
  it('should extend NotFoundError', () => {
    const error = new ParentCategoryNotFoundError('cat-parent');
    expect(error).toBeInstanceOf(NotFoundError);
  });

  it('should have correct HTTP status', () => {
    const error = new ParentCategoryNotFoundError('cat-parent');
    expect(error.statusCode).toBe(404);
  });

  it('should include the parent ID in message', () => {
    const error = new ParentCategoryNotFoundError('cat-parent');
    expect(error.message).toContain('cat-parent');
  });

  it('should have correct error name', () => {
    const error = new ParentCategoryNotFoundError('cat-parent');
    expect(error.name).toBe('ParentCategoryNotFoundError');
  });
});
