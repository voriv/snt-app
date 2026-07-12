/**
 * @file userProfile.errors.test.ts
 * @domain userProfile
 * @description Unit-тесты для доменных ошибок UserProfile
 *
 * @spec
 * - UserProfileNotFoundError: NotFoundError, код NOT_FOUND (от NotFoundError), статус 404
 * - UserProfileInvalidDataError: ValidationError, код VALIDATION_ERROR (от ValidationError), статус 400
 * - UserProfileDuplicateError: ConflictError, код CONFLICT_ERROR (от ConflictError), статус 409
 * - ThemeInvalidError: ValidationError, код VALIDATION_ERROR (от ValidationError), статус 400
 * - FileTooLargeError: BusinessRuleError, код BUSINESS_RULE_ERROR (от BusinessRuleError), статус 422
 * - UnsupportedFileTypeError: BusinessRuleError, код BUSINESS_RULE_ERROR (от BusinessRuleError), статус 422
 * - ProfileRepositoryError: BaseError, код PROFILE_REPOSITORY_ERROR, статус 500
 * - ImageUploadError: BaseError, код IMAGE_UPLOAD_ERROR, статус 500
 *
 * @see tests/unit/domains/plot/plot.errors.test.ts — пример структуры тестов
 * @see tests/unit/domains/roles/roles.errors.test.ts — пример тестов ошибок
 */
import { describe, it, expect } from 'vitest';
import {
  UserProfileNotFoundError,
  UserProfileInvalidDataError,
  UserProfileDuplicateError,
  ThemeInvalidError,
  FileTooLargeError,
  UnsupportedFileTypeError,
  ProfileRepositoryError,
  ImageUploadError,
} from '@/domains/userProfile/userProfile.errors';
import { NotFoundError } from '@/shared/errors/NotFoundError';
import { ValidationError } from '@/shared/errors/ValidationError';
import { ConflictError } from '@/shared/errors/ConflictError';
import { BusinessRuleError } from '@/shared/errors/BusinessRuleError';
import { BaseError } from '@/shared/errors/BaseError';

// ============================================================================
// UserProfileNotFoundError Tests
// ============================================================================

describe('UserProfileNotFoundError', () => {
  it('should extend NotFoundError', () => {
    const error = new UserProfileNotFoundError('test-id');
    expect(error).toBeInstanceOf(NotFoundError);
    expect(error).toBeInstanceOf(BaseError);
  });

  it('should have correct error code', () => {
    const error = new UserProfileNotFoundError('test-id');
    expect(error.code).toBe('NOT_FOUND');
  });

  it('should have correct HTTP status code', () => {
    const error = new UserProfileNotFoundError('test-id');
    expect(error.statusCode).toBe(404);
  });

  it('should have default message with userId', () => {
    const userId = 'user-123';
    const error = new UserProfileNotFoundError(userId);
    expect(error.message).toBe(`UserProfile with id ${userId} not found`);
  });
});

// ============================================================================
// UserProfileInvalidDataError Tests
// ============================================================================

describe('UserProfileInvalidDataError', () => {
  it('should extend ValidationError', () => {
    const error = new UserProfileInvalidDataError('validation error');
    expect(error).toBeInstanceOf(ValidationError);
    expect(error).toBeInstanceOf(BaseError);
  });

  it('should have correct error code', () => {
    const error = new UserProfileInvalidDataError('validation error');
    expect(error.code).toBe('VALIDATION_ERROR');
  });

  it('should have correct HTTP status code', () => {
    const error = new UserProfileInvalidDataError('validation error');
    expect(error.statusCode).toBe(400);
  });

  it('should have custom message with prefix', () => {
    const message = 'invalid data';
    const error = new UserProfileInvalidDataError(message);
    expect(error.message).toBe(`UserProfile data is invalid: ${message}`);
  });
});

// ============================================================================
// UserProfileDuplicateError Tests
// ============================================================================

describe('UserProfileDuplicateError', () => {
  it('should extend ConflictError', () => {
    const error = new UserProfileDuplicateError('userId', 'user-123');
    expect(error).toBeInstanceOf(ConflictError);
    expect(error).toBeInstanceOf(BaseError);
  });

  it('should have correct error code', () => {
    const error = new UserProfileDuplicateError('userId', 'user-123');
    expect(error.code).toBe('CONFLICT_ERROR');
  });

  it('should have correct HTTP status code', () => {
    const error = new UserProfileDuplicateError('userId', 'user-123');
    expect(error.statusCode).toBe(409);
  });

  it('should have message with field and value', () => {
    const field = 'userId';
    const value = 'user-123';
    const error = new UserProfileDuplicateError(field, value);
    expect(error.message).toBe(`UserProfile with ${field}=${value} already exists`);
  });
});

// ============================================================================
// ThemeInvalidError Tests
// ============================================================================

describe('ThemeInvalidError', () => {
  it('should extend ValidationError', () => {
    const error = new ThemeInvalidError('blue');
    expect(error).toBeInstanceOf(ValidationError);
    expect(error).toBeInstanceOf(BaseError);
  });

  it('should have correct error code', () => {
    const error = new ThemeInvalidError('blue');
    expect(error.code).toBe('VALIDATION_ERROR');
  });

  it('should have correct HTTP status code', () => {
    const error = new ThemeInvalidError('blue');
    expect(error.statusCode).toBe(400);
  });

  it('should have message with theme value', () => {
    const theme = 'blue';
    const error = new ThemeInvalidError(theme);
    expect(error.message).toBe(`Invalid theme: "${theme}". Allowed values: light, dark, green`);
  });
});

// ============================================================================
// FileTooLargeError Tests
// ============================================================================

describe('FileTooLargeError', () => {
  it('should extend BusinessRuleError', () => {
    const error = new FileTooLargeError(6 * 1024 * 1024, 5 * 1024 * 1024);
    expect(error).toBeInstanceOf(BusinessRuleError);
    expect(error).toBeInstanceOf(BaseError);
  });

  it('should have correct error code', () => {
    const error = new FileTooLargeError(6 * 1024 * 1024, 5 * 1024 * 1024);
    expect(error.code).toBe('BUSINESS_RULE_ERROR');
  });

  it('should have correct HTTP status code', () => {
    const error = new FileTooLargeError(6 * 1024 * 1024, 5 * 1024 * 1024);
    expect(error.statusCode).toBe(422);
  });

  it('should have message with file and max sizes', () => {
    const fileSize = 6 * 1024 * 1024;
    const maxSize = 5 * 1024 * 1024;
    const error = new FileTooLargeError(fileSize, maxSize);
    expect(error.message).toBe(
      `File size ${fileSize} bytes exceeds maximum allowed ${maxSize} bytes`
    );
  });
});

// ============================================================================
// UnsupportedFileTypeError Tests
// ============================================================================

describe('UnsupportedFileTypeError', () => {
  it('should extend BusinessRuleError', () => {
    const error = new UnsupportedFileTypeError('application/pdf', ['image/jpeg', 'image/png']);
    expect(error).toBeInstanceOf(BusinessRuleError);
    expect(error).toBeInstanceOf(BaseError);
  });

  it('should have correct error code', () => {
    const error = new UnsupportedFileTypeError('application/pdf', ['image/jpeg', 'image/png']);
    expect(error.code).toBe('BUSINESS_RULE_ERROR');
  });

  it('should have correct HTTP status code', () => {
    const error = new UnsupportedFileTypeError('application/pdf', ['image/jpeg', 'image/png']);
    expect(error.statusCode).toBe(422);
  });

  it('should have message with file type and allowed types', () => {
    const fileType = 'application/pdf';
    const allowedTypes = ['image/jpeg', 'image/png'];
    const error = new UnsupportedFileTypeError(fileType, allowedTypes);
    expect(error.message).toBe(
      `Unsupported file type "${fileType}". Allowed types: ${allowedTypes.join(', ')}`
    );
  });
});

// ============================================================================
// ProfileRepositoryError Tests
// ============================================================================

describe('ProfileRepositoryError', () => {
  it('should extend BaseError', () => {
    const error = new ProfileRepositoryError('Database connection failed');
    expect(error).toBeInstanceOf(BaseError);
  });

  it('should have correct error code', () => {
    const error = new ProfileRepositoryError('Database connection failed');
    expect(error.code).toBe('PROFILE_REPOSITORY_ERROR');
  });

  it('should have correct HTTP status code', () => {
    const error = new ProfileRepositoryError('Database connection failed');
    expect(error.statusCode).toBe(500);
  });

  it('should preserve custom message', () => {
    const message = 'Database connection failed';
    const error = new ProfileRepositoryError(message);
    expect(error.message).toBe(message);
  });
});

// ============================================================================
// ImageUploadError Tests
// ============================================================================

describe('ImageUploadError', () => {
  it('should extend BaseError', () => {
    const error = new ImageUploadError('Failed to save image');
    expect(error).toBeInstanceOf(BaseError);
  });

  it('should have correct error code', () => {
    const error = new ImageUploadError('Failed to save image');
    expect(error.code).toBe('IMAGE_UPLOAD_ERROR');
  });

  it('should have correct HTTP status code', () => {
    const error = new ImageUploadError('Failed to save image');
    expect(error.statusCode).toBe(500);
  });

  it('should preserve custom message', () => {
    const message = 'Failed to save image to storage';
    const error = new ImageUploadError(message);
    expect(error.message).toBe(message);
  });
});
