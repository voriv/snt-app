/**
 * @file document.errors.test.ts
 * @domain documents
 * @description Unit-тесты для классов ошибок документов
 */
import { describe, it, expect } from 'vitest';
import {
  DocumentNotFoundError,
  DocumentAccessDeniedError,
  DocumentArchivedError,
  FileTooLargeError,
  UnsupportedFileTypeError,
  EmptyFileError,
} from '@/domains/documents/document.errors';
import {
  NotFoundError,
  ForbiddenError,
  BusinessRuleError,
  ValidationError,
} from '@/shared/errors';

describe('DocumentNotFoundError', () => {
  it('should extend NotFoundError', () => {
    const error = new DocumentNotFoundError('doc-123');
    expect(error).toBeInstanceOf(NotFoundError);
  });

  it('should have correct HTTP status', () => {
    const error = new DocumentNotFoundError('doc-123');
    expect(error.statusCode).toBe(404);
  });

  it('should include the ID in message', () => {
    const error = new DocumentNotFoundError('doc-123');
    expect(error.message).toContain('doc-123');
  });

  it('should have correct error name', () => {
    const error = new DocumentNotFoundError('doc-123');
    expect(error.name).toBe('DocumentNotFoundError');
  });
});

describe('DocumentAccessDeniedError', () => {
  it('should extend ForbiddenError', () => {
    const error = new DocumentAccessDeniedError('doc-123', 'MEMBER');
    expect(error).toBeInstanceOf(ForbiddenError);
  });

  it('should have correct HTTP status', () => {
    const error = new DocumentAccessDeniedError('doc-123', 'MEMBER');
    expect(error.statusCode).toBe(403);
  });

  it('should have correct error message', () => {
    const error = new DocumentAccessDeniedError('doc-123', 'MEMBER');
    expect(error.message).toContain('нет доступа');
  });

  it('should have correct error name', () => {
    const error = new DocumentAccessDeniedError('doc-123', 'MEMBER');
    expect(error.name).toBe('DocumentAccessDeniedError');
  });
});

describe('DocumentArchivedError', () => {
  it('should extend BusinessRuleError', () => {
    const error = new DocumentArchivedError('doc-123');
    expect(error).toBeInstanceOf(BusinessRuleError);
  });

  it('should have correct error message', () => {
    const error = new DocumentArchivedError('doc-123');
    expect(error.message).toContain('Архивированные документы недоступны для редактирования');
  });

  it('should have correct error name', () => {
    const error = new DocumentArchivedError('doc-123');
    expect(error.name).toBe('DocumentArchivedError');
  });
});

describe('FileTooLargeError', () => {
  it('should extend ValidationError', () => {
    const error = new FileTooLargeError(200_000_000, 100_000_000);
    expect(error).toBeInstanceOf(ValidationError);
  });

  it('should include max size in message', () => {
    const error = new FileTooLargeError(200_000_000, 104_857_600);
    expect(error.message).toContain('100 МБ');
  });

  it('should have correct error name', () => {
    const error = new FileTooLargeError(200_000_000, 100_000_000);
    expect(error.name).toBe('FileTooLargeError');
  });
});

describe('UnsupportedFileTypeError', () => {
  it('should extend ValidationError', () => {
    const error = new UnsupportedFileTypeError('application/x-executable');
    expect(error).toBeInstanceOf(ValidationError);
  });

  it('should have correct error message', () => {
    const error = new UnsupportedFileTypeError('application/x-executable');
    expect(error.message).toContain('не поддерживаются');
  });

  it('should have correct error name', () => {
    const error = new UnsupportedFileTypeError('application/x-executable');
    expect(error.name).toBe('UnsupportedFileTypeError');
  });
});

describe('EmptyFileError', () => {
  it('should extend ValidationError', () => {
    const error = new EmptyFileError();
    expect(error).toBeInstanceOf(ValidationError);
  });

  it('should have correct error message', () => {
    const error = new EmptyFileError();
    expect(error.message).toBe('Файл не может быть пустым');
  });

  it('should have correct error name', () => {
    const error = new EmptyFileError();
    expect(error.name).toBe('EmptyFileError');
  });
});
