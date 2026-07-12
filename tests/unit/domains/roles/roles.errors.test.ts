/**
 * @file roles.errors.test.ts
 * @domain roles
 * @description Unit-тесты для классов ошибок домена ролей
 */
import { describe, it, expect } from 'vitest';
import {
  RoleNotFoundError,
  RoleDuplicateError,
  RoleSystemProtectedError,
  LastSuperAdminError,
  RoleInvalidDataError,
  PageNotFoundError,
  PageDuplicateError,
  PageInvalidDataError,
  ApiEndpointNotFoundError,
  ApiEndpointDuplicateError,
  ApiEndpointInvalidDataError,
} from '@/domains/roles/roles.errors';
import {
  NotFoundError,
  ConflictError,
  ForbiddenError,
  ValidationError,
} from '@/shared/errors';

describe('RoleNotFoundError', () => {
  it('should extend NotFoundError', () => {
    const error = new RoleNotFoundError('role-123');
    expect(error).toBeInstanceOf(NotFoundError);
  });

  it('should have correct error code', () => {
    const error = new RoleNotFoundError('role-123');
    expect(error.code).toBe('ROLE_NOT_FOUND');
  });

  it('should include the ID in message', () => {
    const error = new RoleNotFoundError('role-123');
    expect(error.message).toContain('role-123');
  });
});

describe('RoleDuplicateError', () => {
  it('should extend ConflictError', () => {
    const error = new RoleDuplicateError('Admin');
    expect(error).toBeInstanceOf(ConflictError);
  });

  it('should have correct HTTP status', () => {
    const error = new RoleDuplicateError('Admin');
    expect(error.statusCode).toBe(409);
  });

  it('should include the duplicate role name in message', () => {
    const error = new RoleDuplicateError('SuperAdmin');
    expect(error.message).toContain('SuperAdmin');
    expect(error.message).toContain('Роль с именем');
  });
});

describe('RoleSystemProtectedError', () => {
  it('should extend ForbiddenError', () => {
    const error = new RoleSystemProtectedError('Super Admin');
    expect(error).toBeInstanceOf(ForbiddenError);
  });

  it('should have correct HTTP status', () => {
    const error = new RoleSystemProtectedError('Admin');
    expect(error.statusCode).toBe(403);
  });

  it('should include the role name in message', () => {
    const error = new RoleSystemProtectedError('Protected Role');
    expect(error.message).toContain('Protected Role');
    expect(error.message).toContain('Системную роль');
  });
});

describe('LastSuperAdminError', () => {
  it('should extend ConflictError', () => {
    const error = new LastSuperAdminError();
    expect(error).toBeInstanceOf(ConflictError);
  });

  it('should have correct HTTP status', () => {
    const error = new LastSuperAdminError();
    expect(error.statusCode).toBe(409);
  });

  it('should have default message', () => {
    const error = new LastSuperAdminError();
    expect(error.message).toContain('последнего SUPER_ADMIN');
  });

  it('should accept custom message', () => {
    const error = new LastSuperAdminError('Custom message');
    expect(error.message).toBe('Custom message');
  });
});

describe('RoleInvalidDataError', () => {
  it('should extend ValidationError', () => {
    const error = new RoleInvalidDataError('name is required');
    expect(error).toBeInstanceOf(ValidationError);
  });

  it('should have correct HTTP status', () => {
    const error = new RoleInvalidDataError('test');
    expect(error.statusCode).toBe(400);
  });

  it('should include the validation message', () => {
    const error = new RoleInvalidDataError('invalid name format');
    expect(error.message).toContain('invalid name format');
  });
});

describe('PageNotFoundError', () => {
  it('should extend NotFoundError', () => {
    const error = new PageNotFoundError('page-123');
    expect(error).toBeInstanceOf(NotFoundError);
  });

  it('should have correct error code', () => {
    const error = new PageNotFoundError('page-123');
    expect(error.code).toBe('PAGE_NOT_FOUND');
  });

  it('should include the page ID in message', () => {
    const error = new PageNotFoundError('page-456');
    expect(error.message).toContain('page-456');
  });
});

describe('PageDuplicateError', () => {
  it('should extend ConflictError', () => {
    const error = new PageDuplicateError('/dashboard');
    expect(error).toBeInstanceOf(ConflictError);
  });

  it('should have correct HTTP status', () => {
    const error = new PageDuplicateError('/dashboard');
    expect(error.statusCode).toBe(409);
  });

  it('should include the duplicate path in message', () => {
    const error = new PageDuplicateError('/settings');
    expect(error.message).toContain('/settings');
    expect(error.message).toContain('Страница с путём');
  });
});

describe('PageInvalidDataError', () => {
  it('should extend ValidationError', () => {
    const error = new PageInvalidDataError('path is invalid');
    expect(error).toBeInstanceOf(ValidationError);
  });

  it('should have correct HTTP status', () => {
    const error = new PageInvalidDataError('test');
    expect(error.statusCode).toBe(400);
  });

  it('should include the validation message', () => {
    const error = new PageInvalidDataError('invalid path format');
    expect(error.message).toContain('invalid path format');
  });
});

describe('ApiEndpointNotFoundError', () => {
  it('should extend NotFoundError', () => {
    const error = new ApiEndpointNotFoundError('endpoint-123');
    expect(error).toBeInstanceOf(NotFoundError);
  });

  it('should have correct error code', () => {
    const error = new ApiEndpointNotFoundError('endpoint-123');
    expect(error.code).toBe('API_ENDPOINT_NOT_FOUND');
  });

  it('should include the endpoint ID in message', () => {
    const error = new ApiEndpointNotFoundError('endpoint-456');
    expect(error.message).toContain('endpoint-456');
  });
});

describe('ApiEndpointDuplicateError', () => {
  it('should extend ConflictError', () => {
    const error = new ApiEndpointDuplicateError('GET', '/api/users');
    expect(error).toBeInstanceOf(ConflictError);
  });

  it('should have correct HTTP status', () => {
    const error = new ApiEndpointDuplicateError('POST', '/api/login');
    expect(error.statusCode).toBe(409);
  });

  it('should include the method and path in message', () => {
    const error = new ApiEndpointDuplicateError('PUT', '/api/endpoint');
    expect(error.message).toContain('PUT');
    expect(error.message).toContain('/api/endpoint');
    expect(error.message).toContain('Endpoint');
  });
});

describe('ApiEndpointInvalidDataError', () => {
  it('should extend ValidationError', () => {
    const error = new ApiEndpointInvalidDataError('method is invalid');
    expect(error).toBeInstanceOf(ValidationError);
  });

  it('should have correct HTTP status', () => {
    const error = new ApiEndpointInvalidDataError('test');
    expect(error.statusCode).toBe(400);
  });

  it('should include the validation message', () => {
    const error = new ApiEndpointInvalidDataError('invalid method format');
    expect(error.message).toContain('invalid method format');
  });
});
