/**
 * @file roles.validators.test.ts
 * @domain roles
 * @description Unit tests for roles domain validation schemas
 */
import { describe, it, expect } from 'vitest';
import {
  createRoleSchema,
  updateRoleSchema,
  createPageSchema,
  updatePageSchema,
  createApiEndpointSchema,
  updateApiEndpointSchema,
} from '@/domains/roles/roles.validators';

describe('createRoleSchema', () => {
  it('should accept valid role data', () => {
    const validData = {
      name: 'Admin',
      description: 'Admin role',
    };

    expect(() => createRoleSchema.parse(validData)).not.toThrow();
  });

  it('should accept role data without description', () => {
    const validData = {
      name: 'User',
    };

    expect(() => createRoleSchema.parse(validData)).not.toThrow();
  });

  it('should reject when name is empty', () => {
    const invalidData = {
      name: '',
      description: 'Test',
    };

    expect(() => createRoleSchema.parse(invalidData)).toThrow();
  });

  it('should reject when name is too short', () => {
    const invalidData = {
      name: 'A',
      description: 'Test',
    };

    expect(() => createRoleSchema.parse(invalidData)).toThrow();
  });

  it('should reject when name is too long', () => {
    const invalidData = {
      name: 'A'.repeat(51),
      description: 'Test',
    };

    expect(() => createRoleSchema.parse(invalidData)).toThrow();
  });

  it('should reject when name is missing', () => {
    const invalidData = {
      description: 'Test',
    };

    expect(() => createRoleSchema.parse(invalidData)).toThrow();
  });

  it('should reject when description is too long', () => {
    const invalidData = {
      name: 'Test',
      description: 'A'.repeat(501),
    };

    expect(() => createRoleSchema.parse(invalidData)).toThrow();
  });

  it('should transform empty description to null', () => {
    const inputData = {
      name: 'Test',
      description: '',
    };

    const result = createRoleSchema.parse(inputData);
    expect(result.description).toBeNull();
  });
});

describe('updateRoleSchema', () => {
  it('should accept partial data with name', () => {
    const validData = {
      name: 'New Name',
    };

    expect(() => updateRoleSchema.parse(validData)).not.toThrow();
  });

  it('should accept partial data without name', () => {
    const validData = {
      description: 'New description',
    };

    expect(() => updateRoleSchema.parse(validData)).not.toThrow();
  });

  it('should accept null name', () => {
    const validData = {
      name: null,
    };

    expect(() => updateRoleSchema.parse(validData)).not.toThrow();
  });

  it('should accept null description', () => {
    const validData = {
      name: 'Test',
      description: null,
    };

    expect(() => updateRoleSchema.parse(validData)).not.toThrow();
  });

  it('should transform empty name to null', () => {
    const inputData = {
      name: '',
    };

    const result = updateRoleSchema.parse(inputData);
    expect(result.name).toBeNull();
  });

  it('should transform empty description to null', () => {
    const inputData = {
      description: '',
    };

    const result = updateRoleSchema.parse(inputData);
    expect(result.description).toBeNull();
  });
});

describe('createPageSchema', () => {
  it('should accept valid page data', () => {
    const validData = {
      path: '/dashboard',
      title: 'Dashboard',
    };

    expect(() => createPageSchema.parse(validData)).not.toThrow();
  });

  it('should accept page with all optional fields', () => {
    const validData = {
      path: '/dashboard/settings',
      title: 'Settings',
      groupName: 'Settings',
      sortOrder: 10,
      isActive: true,
    };

    expect(() => createPageSchema.parse(validData)).not.toThrow();
  });

  it('should reject when path does not start with /', () => {
    const invalidData = {
      path: 'dashboard',
      title: 'Dashboard',
    };

    expect(() => createPageSchema.parse(invalidData)).toThrow();
  });

  it('should reject when path contains invalid characters', () => {
    const invalidData = {
      path: '/dashboard/settings/',
      title: 'Settings',
    };

    expect(() => createPageSchema.parse(invalidData)).not.toThrow();
  });

  it('should reject when title is too short', () => {
    const invalidData = {
      path: '/test',
      title: 'A',
    };

    expect(() => createPageSchema.parse(invalidData)).toThrow();
  });

  it('should reject when title is too long', () => {
    const invalidData = {
      path: '/test',
      title: 'A'.repeat(101),
    };

    expect(() => createPageSchema.parse(invalidData)).toThrow();
  });

  it('should set default sortOrder to 0', () => {
    const validData = {
      path: '/test',
      title: 'Test',
    };

    const result = createPageSchema.parse(validData);
    expect(result.sortOrder).toBe(0);
  });

  it('should set default isActive to true', () => {
    const validData = {
      path: '/test',
      title: 'Test',
    };

    const result = createPageSchema.parse(validData);
    expect(result.isActive).toBe(true);
  });

  it('should transform empty groupName to null', () => {
    const inputData = {
      path: '/test',
      title: 'Test',
      groupName: '',
    };

    const result = createPageSchema.parse(inputData);
    expect(result.groupName).toBeNull();
  });
});

describe('updatePageSchema', () => {
  it('should accept partial data', () => {
    const validData = {
      title: 'New Title',
    };

    expect(() => updatePageSchema.parse(validData)).not.toThrow();
  });

  it('should accept all null values', () => {
    const validData = {
      path: null,
      title: null,
      groupName: null,
      sortOrder: null,
      isActive: null,
    };

    expect(() => updatePageSchema.parse(validData)).not.toThrow();
  });

  it('should transform empty path to null', () => {
    const inputData = {
      path: '',
    };

    const result = updatePageSchema.parse(inputData);
    expect(result.path).toBeNull();
  });

  it('should transform empty groupName to null', () => {
    const inputData = {
      groupName: '',
    };

    const result = updatePageSchema.parse(inputData);
    expect(result.groupName).toBeNull();
  });
});

describe('createApiEndpointSchema', () => {
  it('should accept valid endpoint data', () => {
    const validData = {
      method: 'GET',
      path: '/api/users',
    };

    expect(() => createApiEndpointSchema.parse(validData)).not.toThrow();
  });

  it('should accept endpoint with all optional fields', () => {
    const validData = {
      method: 'POST',
      path: '/api/users',
      description: 'Create user',
      accessType: 'role',
      isActive: true,
    };

    expect(() => createApiEndpointSchema.parse(validData)).not.toThrow();
  });

  it('should accept all HTTP methods', () => {
    const methods = ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'];

    methods.forEach((method) => {
      const validData = {
        method,
        path: '/api/test',
      };

      expect(() => createApiEndpointSchema.parse(validData)).not.toThrow();
    });
  });

  it('should reject invalid HTTP method', () => {
    const invalidData = {
      method: 'INVALID',
      path: '/api/test',
    };

    expect(() => createApiEndpointSchema.parse(invalidData)).toThrow();
  });

  it('should reject path without leading slash', () => {
    const invalidData = {
      method: 'GET',
      path: 'api/users',
    };

    expect(() => createApiEndpointSchema.parse(invalidData)).toThrow();
  });

  it('should set default accessType to role', () => {
    const validData = {
      method: 'GET',
      path: '/api/test',
    };

    const result = createApiEndpointSchema.parse(validData);
    expect(result.accessType).toBe('role');
  });

  it('should set default isActive to true', () => {
    const validData = {
      method: 'GET',
      path: '/api/test',
    };

    const result = createApiEndpointSchema.parse(validData);
    expect(result.isActive).toBe(true);
  });

  it('should transform empty description to null', () => {
    const inputData = {
      method: 'GET',
      path: '/api/test',
      description: '',
    };

    const result = createApiEndpointSchema.parse(inputData);
    expect(result.description).toBeNull();
  });

  it('should accept path with parameter', () => {
    const validData = {
      method: 'GET',
      path: '/api/users/:id',
    };

    expect(() => createApiEndpointSchema.parse(validData)).not.toThrow();
  });

  it('should accept all access types', () => {
    const accessTypes = ['public', 'owner', 'role', 'super_admin'];

    accessTypes.forEach((accessType) => {
      const validData = {
        method: 'GET',
        path: '/api/test',
        accessType,
      };

      expect(() => createApiEndpointSchema.parse(validData)).not.toThrow();
    });
  });
});

describe('updateApiEndpointSchema', () => {
  it('should accept partial data', () => {
    const validData = {
      method: 'POST',
    };

    expect(() => updateApiEndpointSchema.parse(validData)).not.toThrow();
  });

  it('should accept all null values', () => {
    const validData = {
      method: null,
      path: null,
      description: null,
      accessType: null,
      isActive: null,
    };

    expect(() => updateApiEndpointSchema.parse(validData)).not.toThrow();
  });

  it('should transform empty description to null', () => {
    const inputData = {
      description: '',
    };

    const result = updateApiEndpointSchema.parse(inputData);
    expect(result.description).toBeNull();
  });

  it('should reject invalid accessType', () => {
    const invalidData = {
      accessType: 'invalid',
    };

    expect(() => updateApiEndpointSchema.parse(invalidData)).toThrow();
  });
});
