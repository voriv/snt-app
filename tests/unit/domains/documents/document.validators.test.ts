/**
 * @file document.validators.test.ts
 * @domain documents
 * @description Unit-тесты для валидации документов
 *
 * @traces US-22-03 AC-1..6, US-22-04 AC-1..5, US-22-05 AC-1..9, US-22-07 AC-1..8
 */
import { describe, it, expect } from 'vitest';
import {
  fileValidationSchema,
  documentMetadataSchema,
  updateDocumentSchema,
  documentFiltersSchema,
  ALLOWED_MIME_TYPES,
  MAX_FILE_SIZE,
} from '@/domains/documents/document.validators';
import { tagNameSchema } from '@/domains/documents/tag.validators';

// ============================================================================
// fileValidationSchema
// ============================================================================

describe('fileValidationSchema', () => {
  it('should accept valid PDF file', () => {
    const validData = { mimeType: 'application/pdf', fileSize: 1024 };
    const result = fileValidationSchema.parse(validData);
    expect(result).toEqual(validData);
  });

  it('should accept valid DOCX file', () => {
    const validData = {
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      fileSize: 2048,
    };
    expect(() => fileValidationSchema.parse(validData)).not.toThrow();
  });

  it('should accept valid image files', () => {
    const images = ['image/jpeg', 'image/png', 'image/gif', 'image/bmp', 'image/webp'];
    for (const mime of images) {
      expect(() => fileValidationSchema.parse({ mimeType: mime, fileSize: 1024 })).not.toThrow();
    }
  });

  it('should reject unsupported MIME type', () => {
    const invalidData = { mimeType: 'application/x-executable', fileSize: 1024 };
    expect(() => fileValidationSchema.parse(invalidData)).toThrow();
  });

  it('should reject zero file size', () => {
    const invalidData = { mimeType: 'application/pdf', fileSize: 0 };
    expect(() => fileValidationSchema.parse(invalidData)).toThrow();
  });

  it('should reject negative file size', () => {
    const invalidData = { mimeType: 'application/pdf', fileSize: -1 };
    expect(() => fileValidationSchema.parse(invalidData)).toThrow();
  });

  it('should reject file size exceeding MAX_FILE_SIZE', () => {
    const invalidData = { mimeType: 'application/pdf', fileSize: MAX_FILE_SIZE + 1 };
    expect(() => fileValidationSchema.parse(invalidData)).toThrow();
  });

  it('should accept file size exactly at MAX_FILE_SIZE', () => {
    const validData = { mimeType: 'application/pdf', fileSize: MAX_FILE_SIZE };
    expect(() => fileValidationSchema.parse(validData)).not.toThrow();
  });

  it('should accept minimum file size (1 byte)', () => {
    const validData = { mimeType: 'application/pdf', fileSize: 1 };
    expect(() => fileValidationSchema.parse(validData)).not.toThrow();
  });
});

// ============================================================================
// documentMetadataSchema
// ============================================================================

describe('documentMetadataSchema', () => {
  const validMetadata = {
    title: 'Договор купли-продажи',
    documentType: 'contract',
    visibleRoles: ['ADMIN', 'MEMBER'],
  };

  it('should accept minimal valid metadata', () => {
    const result = documentMetadataSchema.parse(validMetadata);
    expect(result.title).toBe('Договор купли-продажи');
    expect(result.documentType).toBe('contract');
    expect(result.visibleRoles).toEqual(['ADMIN', 'MEMBER']);
  });

  it('should accept metadata with all fields', () => {
    const fullData = {
      ...validMetadata,
      description: 'Описание документа',
      categoryId: 'cat-1',
      tags: ['важный', 'договор'],
      status: 'published' as const,
    };
    const result = documentMetadataSchema.parse(fullData);
    expect(result.description).toBe('Описание документа');
    expect(result.categoryId).toBe('cat-1');
    expect(result.tags).toEqual(['важный', 'договор']);
    expect(result.status).toBe('published');
  });

  it('should reject when title is empty', () => {
    const invalidData = { ...validMetadata, title: '' };
    expect(() => documentMetadataSchema.parse(invalidData)).toThrow();
  });

  it('should reject when title is only whitespace', () => {
    const invalidData = { ...validMetadata, title: '   ' };
    expect(() => documentMetadataSchema.parse(invalidData)).toThrow();
  });

  it('should reject when title exceeds 255 characters', () => {
    const invalidData = { ...validMetadata, title: 'A'.repeat(256) };
    expect(() => documentMetadataSchema.parse(invalidData)).toThrow();
  });

  it('should accept title with exactly 255 characters', () => {
    const validData = { ...validMetadata, title: 'A'.repeat(255) };
    const result = documentMetadataSchema.parse(validData);
    expect(result.title.length).toBe(255);
  });

  it('should reject when documentType is empty', () => {
    const invalidData = { ...validMetadata, documentType: '' };
    expect(() => documentMetadataSchema.parse(invalidData)).toThrow();
  });

  it('should reject when documentType exceeds 50 characters', () => {
    const invalidData = { ...validMetadata, documentType: 'A'.repeat(51) };
    expect(() => documentMetadataSchema.parse(invalidData)).toThrow();
  });

  it('should reject when visibleRoles is empty', () => {
    const invalidData = { ...validMetadata, visibleRoles: [] };
    expect(() => documentMetadataSchema.parse(invalidData)).toThrow();
  });

  it('should reject when tags exceed 10 items', () => {
    const invalidData = {
      ...validMetadata,
      tags: Array.from({ length: 11 }, () => 'tag'),
    };
    expect(() => documentMetadataSchema.parse(invalidData)).toThrow();
  });

  it('should accept exactly 10 tags', () => {
    const validData = {
      ...validMetadata,
      tags: Array.from({ length: 10 }, (_, i) => `tag${i}`),
    };
    const result = documentMetadataSchema.parse(validData);
    expect(result.tags?.length).toBe(10);
  });

  it('should reject when tag exceeds 50 characters', () => {
    const invalidData = {
      ...validMetadata,
      tags: ['A'.repeat(51)],
    };
    expect(() => documentMetadataSchema.parse(invalidData)).toThrow();
  });

  it('should transform empty description to null', () => {
    const inputData = { ...validMetadata, description: '' };
    const result = documentMetadataSchema.parse(inputData);
    expect(result.description).toBeNull();
  });

  it('should trim whitespace from title', () => {
    const inputData = { ...validMetadata, title: '  Договор  ' };
    const result = documentMetadataSchema.parse(inputData);
    expect(result.title).toBe('Договор');
  });

  it('should trim whitespace from documentType', () => {
    const inputData = { ...validMetadata, documentType: '  contract  ' };
    const result = documentMetadataSchema.parse(inputData);
    expect(result.documentType).toBe('contract');
  });

  it('should accept draft status', () => {
    const data = { ...validMetadata, status: 'draft' };
    expect(() => documentMetadataSchema.parse(data)).not.toThrow();
  });

  it('should accept archived status', () => {
    const data = { ...validMetadata, status: 'archived' };
    expect(() => documentMetadataSchema.parse(data)).not.toThrow();
  });
});

// ============================================================================
// updateDocumentSchema
// ============================================================================

describe('updateDocumentSchema', () => {
  it('should accept partial data with title only', () => {
    const data = { title: 'Новое название' };
    const result = updateDocumentSchema.parse(data);
    expect(result.title).toBe('Новое название');
  });

  it('should accept partial data with status only', () => {
    const data = { status: 'archived' };
    const result = updateDocumentSchema.parse(data);
    expect(result.status).toBe('archived');
  });

  it('should accept partial data with tags', () => {
    const data = { tags: ['новое', 'тэг'] };
    const result = updateDocumentSchema.parse(data);
    expect(result.tags).toEqual(['новое', 'тэг']);
  });

  it('should accept empty object (no changes)', () => {
    const result = updateDocumentSchema.parse({});
    expect(result).toEqual({});
  });

  it('should reject when title exceeds 255 characters', () => {
    const data = { title: 'A'.repeat(256) };
    expect(() => updateDocumentSchema.parse(data)).toThrow();
  });

  it('should reject when visibleRoles is empty', () => {
    const data = { visibleRoles: [] };
    expect(() => updateDocumentSchema.parse(data)).toThrow();
  });

  it('should reject when tags exceed 10 items', () => {
    const data = { tags: Array.from({ length: 11 }, () => 'tag') };
    expect(() => updateDocumentSchema.parse(data)).toThrow();
  });

  it('should transform empty description to null', () => {
    const data = { description: '' };
    const result = updateDocumentSchema.parse(data);
    expect(result.description).toBeNull();
  });
});

// ============================================================================
// documentFiltersSchema
// ============================================================================

describe('documentFiltersSchema', () => {
  it('should accept empty filters (defaults)', () => {
    const result = documentFiltersSchema.parse({});
    expect(result.page).toBe(1);
    expect(result.limit).toBe(20);
  });

  it('should accept categoryId filter', () => {
    const data = { categoryId: 'cat-1' };
    const result = documentFiltersSchema.parse(data);
    expect(result.categoryId).toBe('cat-1');
  });

  it('should accept documentType filter', () => {
    const data = { documentType: 'contract' };
    const result = documentFiltersSchema.parse(data);
    expect(result.documentType).toBe('contract');
  });

  it('should accept status filter', () => {
    const data = { status: 'draft' };
    const result = documentFiltersSchema.parse(data);
    expect(result.status).toBe('draft');
  });

  it('should accept search filter', () => {
    const data = { search: 'договор' };
    const result = documentFiltersSchema.parse(data);
    expect(result.search).toBe('договор');
  });

  it('should parse page and limit from string', () => {
    const data = { page: '2', limit: '50' };
    const result = documentFiltersSchema.parse(data);
    expect(result.page).toBe(2);
    expect(result.limit).toBe(50);
  });

  it('should default page to 1 when not provided', () => {
    const result = documentFiltersSchema.parse({});
    expect(result.page).toBe(1);
  });

  it('should default limit to 20 when not provided', () => {
    const result = documentFiltersSchema.parse({});
    expect(result.limit).toBe(20);
  });

  it('should reject page less than 1', () => {
    const data = { page: '0' };
    expect(() => documentFiltersSchema.parse(data)).toThrow();
  });

  it('should reject page greater than 100', () => {
    const data = { page: '101' };
    expect(() => documentFiltersSchema.parse(data)).toThrow();
  });

  it('should reject limit less than 1', () => {
    const data = { limit: '0' };
    expect(() => documentFiltersSchema.parse(data)).toThrow();
  });

  it('should reject limit greater than 100', () => {
    const data = { limit: '101' };
    expect(() => documentFiltersSchema.parse(data)).toThrow();
  });

  it('should accept all filters combined', () => {
    const data = {
      categoryId: 'cat-1',
      documentType: 'contract',
      status: 'published',
      search: 'договор',
      page: '1',
      limit: '10',
    };
    const result = documentFiltersSchema.parse(data);
    expect(result.categoryId).toBe('cat-1');
    expect(result.documentType).toBe('contract');
    expect(result.status).toBe('published');
    expect(result.search).toBe('договор');
    expect(result.page).toBe(1);
    expect(result.limit).toBe(10);
  });
});

// ============================================================================
// tagNameSchema
// ============================================================================

describe('tagNameSchema', () => {
  it('should accept valid tag name', () => {
    const result = tagNameSchema.parse('важный');
    expect(result).toBe('важный');
  });

  it('should reject empty tag name', () => {
    expect(() => tagNameSchema.parse('')).toThrow();
  });

  it('should reject whitespace-only tag name', () => {
    expect(() => tagNameSchema.parse('   ')).toThrow();
  });

  it('should reject tag name exceeding 50 characters', () => {
    expect(() => tagNameSchema.parse('A'.repeat(51))).toThrow();
  });

  it('should accept tag name with exactly 50 characters', () => {
    const result = tagNameSchema.parse('A'.repeat(50));
    expect(result.length).toBe(50);
  });

  it('should trim whitespace from tag name', () => {
    const result = tagNameSchema.parse('  важный  ');
    expect(result).toBe('важный');
  });
});

// ============================================================================
// Constants
// ============================================================================

describe('ALLOWED_MIME_TYPES', () => {
  it('should contain PDF', () => {
    expect(ALLOWED_MIME_TYPES).toContain('application/pdf');
  });

  it('should contain DOCX', () => {
    expect(ALLOWED_MIME_TYPES).toContain(
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    );
  });

  it('should contain all image types', () => {
    expect(ALLOWED_MIME_TYPES).toContain('image/jpeg');
    expect(ALLOWED_MIME_TYPES).toContain('image/png');
    expect(ALLOWED_MIME_TYPES).toContain('image/gif');
    expect(ALLOWED_MIME_TYPES).toContain('image/bmp');
    expect(ALLOWED_MIME_TYPES).toContain('image/webp');
  });

  it('should not contain executable types', () => {
    expect(ALLOWED_MIME_TYPES).not.toContain('application/x-executable');
    expect(ALLOWED_MIME_TYPES).not.toContain('application/javascript');
  });
});

describe('MAX_FILE_SIZE', () => {
  it('should be 100 MB in bytes', () => {
    expect(MAX_FILE_SIZE).toBe(104_857_600);
  });
});
