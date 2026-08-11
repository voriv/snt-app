/**
 * @file tests/api/documents.test.ts
 * @description API-тесты для модуля управления документами
 *
 * @spec
 * - Hoisted мокирование для корректной работы с импортами в route.ts
 * - Мокирование auth() и prisma
 * - Проверяют HTTP-статусы (200, 201, 400, 401, 403, 404, 409, 500)
 * - Проверяют форматы ответов
 * - Проверяют валидацию входящих данных
 * - Проверяют обработку ошибок
 *
 * @traces US-22-01..US-22-07
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';

// ============================================================================
// Hoisted Mocks
// ============================================================================

const authMock = vi.hoisted(() => vi.fn());

const prismaMock = vi.hoisted(() => ({
  documentCategory: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    create: vi.fn(),
    delete: vi.fn(),
    updateMany: vi.fn(),
    update: vi.fn(),
  },
  document: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn(),
  },
  documentTag: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
  documentTagLink: {
    deleteMany: vi.fn(),
    createMany: vi.fn(),
  },
  user: {
    findUnique: vi.fn(),
  },
  $transaction: vi.fn(async (fn) => fn(prismaMock)),
}));

// Mock auth module
vi.mock('@/lib/auth', () => ({
  auth: authMock,
}));

// Mock prisma module
vi.mock('@/infrastructure/prisma/client', () => ({
  prisma: prismaMock,
}));

// Mock FileStorage to avoid filesystem operations
vi.mock('@/domains/documents/file.storage', () => ({
  FileStorage: vi.fn().mockImplementation(() => ({
    saveFile: vi.fn().mockResolvedValue('uploads/documents/test.pdf'),
    getFile: vi.fn().mockResolvedValue({
      buffer: Buffer.from('test'),
      mimeType: 'application/pdf',
      originalName: 'test.pdf',
    }),
    deleteFile: vi.fn().mockResolvedValue(undefined),
  })),
}));

// Import routes AFTER mocking
import { GET as categoriesGET, POST as categoriesPOST } from '@/app/api/v1/documents/categories/route';
import { DELETE as categoryDELETE } from '@/app/api/v1/documents/categories/[id]/route';
import { GET as documentsGET } from '@/app/api/v1/documents/route';
import { GET as documentGET, PUT as documentPUT } from '@/app/api/v1/documents/[id]/route';
import { PUT as metadataPUT } from '@/app/api/v1/documents/[id]/metadata/route';
import { GET as downloadGET } from '@/app/api/v1/documents/[id]/download/route';

// ============================================================================
// Helpers
// ============================================================================

function createAdminSession(): any {
  return {
    user: {
      id: 'user-1',
      email: 'admin@example.com',
      roles: ['ADMIN'],
      name: 'admin',
    },
    expires: new Date(Date.now() + 3600000).toISOString(),
  };
}

function createMemberSession(): any {
  return {
    user: {
      id: 'user-2',
      email: 'member@example.com',
      roles: ['MEMBER'],
      name: 'member',
    },
    expires: new Date(Date.now() + 3600000).toISOString(),
  };
}

function createMockRequest(method: string, path: string, body?: unknown): NextRequest {
  const url = `http://localhost${path}`;
  const headers = new Headers();
  if (body !== undefined && body !== null) {
    headers.set('Content-Type', 'application/json');
  }
  return {
    method,
    url,
    headers,
    nextUrl: new URL(url),
    json: async () => body ?? {},
    text: async () => (body ? JSON.stringify(body) : ''),
  } as unknown as NextRequest;
}

// ============================================================================
// Categories API Tests
// ============================================================================

describe('GET /api/v1/documents/categories', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 401 without auth', async () => {
    authMock.mockResolvedValue(null);
    const request = createMockRequest('GET', '/api/v1/documents/categories');
    const response = await categoriesGET(request);
    expect(response.status).toBe(401);
  });

  it('should return 200 with category tree when authenticated', async () => {
    authMock.mockResolvedValue(createAdminSession());
    vi.mocked(prismaMock.documentCategory.findMany).mockResolvedValue([
      { id: 'cat-1', name: 'Договоры', description: null, parentId: null, createdAt: new Date(), updatedAt: new Date() },
    ]);

    const request = createMockRequest('GET', '/api/v1/documents/categories');
    const response = await categoriesGET(request);

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json).toMatchObject({ success: true, data: expect.any(Array) });
  });
});

describe('POST /api/v1/documents/categories', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 401 without auth', async () => {
    authMock.mockResolvedValue(null);
    const request = createMockRequest('POST', '/api/v1/documents/categories', { name: 'Test' });
    const response = await categoriesPOST(request);
    expect(response.status).toBe(401);
  });

  it('should return 403 for non-ADMIN role', async () => {
    authMock.mockResolvedValue(createMemberSession());
    const request = createMockRequest('POST', '/api/v1/documents/categories', { name: 'Test' });
    const response = await categoriesPOST(request);
    expect(response.status).toBe(403);
  });

  it('should return 201 when creating valid category', async () => {
    authMock.mockResolvedValue(createAdminSession());
    vi.mocked(prismaMock.documentCategory.findFirst).mockResolvedValue(null);
    vi.mocked(prismaMock.documentCategory.create).mockResolvedValue({
      id: 'cat-new',
      name: 'Новая категория',
      description: null,
      parentId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const request = createMockRequest('POST', '/api/v1/documents/categories', {
      name: 'Новая категория',
    });
    const response = await categoriesPOST(request);

    expect(response.status).toBe(201);
    const json = await response.json();
    expect(json).toMatchObject({ success: true, data: expect.any(Object) });
  });

  it('should return 400 when name is empty', async () => {
    authMock.mockResolvedValue(createAdminSession());
    const request = createMockRequest('POST', '/api/v1/documents/categories', { name: '' });
    const response = await categoriesPOST(request);
    expect(response.status).toBe(400);
  });

  it('should return 409 when category name already exists', async () => {
    authMock.mockResolvedValue(createAdminSession());
    vi.mocked(prismaMock.documentCategory.findFirst).mockResolvedValue({
      id: 'cat-1',
      name: 'Дубликат',
      description: null,
      parentId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const request = createMockRequest('POST', '/api/v1/documents/categories', { name: 'Дубликат' });
    const response = await categoriesPOST(request);

    expect(response.status).toBe(409);
    const json = await response.json();
    expect(json).toMatchObject({ success: false, error: { code: 'CONFLICT' } });
  });

  it('should return 404 when parent category not found', async () => {
    authMock.mockResolvedValue(createAdminSession());
    vi.mocked(prismaMock.documentCategory.findUnique).mockResolvedValue(null);

    const request = createMockRequest('POST', '/api/v1/documents/categories', {
      name: 'Подкатегория',
      parentId: 'cat-nonexistent',
    });
    const response = await categoriesPOST(request);

    expect(response.status).toBe(404);
  });
});

describe('DELETE /api/v1/documents/categories/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 401 without auth', async () => {
    authMock.mockResolvedValue(null);
    const response = await categoryDELETE(createMockRequest('DELETE', ''), { params: { id: 'cat-1' } });
    expect(response.status).toBe(401);
  });

  it('should return 403 for non-ADMIN role', async () => {
    authMock.mockResolvedValue(createMemberSession());
    const response = await categoryDELETE(createMockRequest('DELETE', ''), { params: { id: 'cat-1' } });
    expect(response.status).toBe(403);
  });

  it('should return 404 when category not found', async () => {
    authMock.mockResolvedValue(createAdminSession());
    vi.mocked(prismaMock.documentCategory.findUnique).mockResolvedValue(null);

    const response = await categoryDELETE(createMockRequest('DELETE', ''), { params: { id: 'cat-nonexistent' } });

    expect(response.status).toBe(404);
    const json = await response.json();
    expect(json).toMatchObject({ success: false, error: { code: 'NOT_FOUND' } });
  });

  it('should return 200 when category deleted successfully', async () => {
    authMock.mockResolvedValue(createAdminSession());
    vi.mocked(prismaMock.documentCategory.findUnique).mockResolvedValue({
      id: 'cat-1',
      name: 'Test',
      description: null,
      parentId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    vi.mocked(prismaMock.document.findMany).mockResolvedValue([]);
    vi.mocked(prismaMock.documentCategory.findMany).mockResolvedValue([]);
    vi.mocked(prismaMock.documentCategory.delete).mockResolvedValue({ id: 'cat-1' });

    const response = await categoryDELETE(createMockRequest('DELETE', ''), { params: { id: 'cat-1' } });

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json).toMatchObject({ success: true });
  });
});

// ============================================================================
// Documents List API Tests
// ============================================================================

describe('GET /api/v1/documents', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 401 without auth', async () => {
    authMock.mockResolvedValue(null);
    const request = createMockRequest('GET', '/api/v1/documents');
    const response = await documentsGET(request);
    expect(response.status).toBe(401);
  });

  it('should return 200 with documents when authenticated', async () => {
    authMock.mockResolvedValue(createAdminSession());
    vi.mocked(prismaMock.document.findMany).mockResolvedValue([]);
    vi.mocked(prismaMock.document.count).mockResolvedValue(0);

    const request = createMockRequest('GET', '/api/v1/documents');
    const response = await documentsGET(request);

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json).toMatchObject({ success: true, data: expect.any(Object) });
  });
});

// ============================================================================
// Document Detail API Tests
// ============================================================================

describe('GET /api/v1/documents/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 401 without auth', async () => {
    authMock.mockResolvedValue(null);
    const response = await documentGET(createMockRequest('GET', ''), { params: { id: 'doc-1' } });
    expect(response.status).toBe(401);
  });

  it('should return 404 when document not found', async () => {
    authMock.mockResolvedValue(createAdminSession());
    vi.mocked(prismaMock.document.findUnique).mockResolvedValue(null);

    const response = await documentGET(createMockRequest('GET', ''), { params: { id: 'doc-nonexistent' } });

    expect(response.status).toBe(404);
    const json = await response.json();
    expect(json).toMatchObject({ success: false, error: { code: 'NOT_FOUND' } });
  });

  it('should return 403 when user lacks access (BR-04)', async () => {
    authMock.mockResolvedValue(createMemberSession());
    vi.mocked(prismaMock.document.findUnique).mockResolvedValue({
      id: 'doc-1',
      title: 'Admin only',
      description: null,
      originalName: 'test.pdf',
      storagePath: 'uploads/test.pdf',
      fileSize: 1024,
      mimeType: 'application/pdf',
      categoryId: null,
      documentType: 'contract',
      visibleRoles: ['ADMIN'],
      status: 'published',
      uploadedById: 'user-1',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const response = await documentGET(createMockRequest('GET', ''), { params: { id: 'doc-1' } });

    expect(response.status).toBe(403);
    const json = await response.json();
    expect(json).toMatchObject({ success: false, error: { code: 'FORBIDDEN' } });
  });

  it('should return 403 for draft documents when non-ADMIN (BR-07)', async () => {
    authMock.mockResolvedValue(createMemberSession());
    vi.mocked(prismaMock.document.findUnique).mockResolvedValue({
      id: 'doc-1',
      title: 'Draft',
      description: null,
      originalName: 'draft.pdf',
      storagePath: 'uploads/draft.pdf',
      fileSize: 1024,
      mimeType: 'application/pdf',
      categoryId: null,
      documentType: 'contract',
      visibleRoles: ['ADMIN', 'MEMBER'],
      status: 'draft',
      uploadedById: 'user-1',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const response = await documentGET(createMockRequest('GET', ''), { params: { id: 'doc-1' } });

    expect(response.status).toBe(403);
  });
});

describe('PUT /api/v1/documents/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 401 without auth', async () => {
    authMock.mockResolvedValue(null);
    const response = await documentPUT(createMockRequest('PUT', '', { title: 'New' }), { params: { id: 'doc-1' } });
    expect(response.status).toBe(401);
  });

  it('should return 403 for non-ADMIN role', async () => {
    authMock.mockResolvedValue(createMemberSession());
    const response = await documentPUT(createMockRequest('PUT', '', { title: 'New' }), { params: { id: 'doc-1' } });
    expect(response.status).toBe(403);
  });

  it('should return 400 when trying to update archived document (BR-08)', async () => {
    authMock.mockResolvedValue(createAdminSession());
    vi.mocked(prismaMock.document.findUnique).mockResolvedValue({
      id: 'doc-1',
      title: 'Archived',
      description: null,
      originalName: 'archived.pdf',
      storagePath: 'uploads/archived.pdf',
      fileSize: 1024,
      mimeType: 'application/pdf',
      categoryId: null,
      documentType: 'contract',
      visibleRoles: ['ADMIN'],
      status: 'archived',
      uploadedById: 'user-1',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const response = await documentPUT(createMockRequest('PUT', '', { title: 'New Title' }), { params: { id: 'doc-1' } });

    expect(response.status).toBe(400);
    const json = await response.json();
    expect(json).toMatchObject({ success: false, error: { code: 'BUSINESS_RULE_VIOLATION' } });
  });
});

describe('PUT /api/v1/documents/[id]/metadata', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 401 without auth', async () => {
    authMock.mockResolvedValue(null);
    const response = await metadataPUT(createMockRequest('PUT', '', {}), { params: { id: 'doc-1' } });
    expect(response.status).toBe(401);
  });

  it('should return 403 for non-ADMIN role', async () => {
    authMock.mockResolvedValue(createMemberSession());
    const response = await metadataPUT(createMockRequest('PUT', '', {}), { params: { id: 'doc-1' } });
    expect(response.status).toBe(403);
  });

  it('should return 400 when validation fails', async () => {
    authMock.mockResolvedValue(createAdminSession());
    const response = await metadataPUT(createMockRequest('PUT', '', { title: '' }), { params: { id: 'doc-1' } });
    expect(response.status).toBe(400);
  });
});

describe('GET /api/v1/documents/[id]/download', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 401 without auth', async () => {
    authMock.mockResolvedValue(null);
    const response = await downloadGET(createMockRequest('GET', ''), { params: { id: 'doc-1' } });
    expect(response.status).toBe(401);
  });

  it('should return 404 when document not found', async () => {
    authMock.mockResolvedValue(createAdminSession());
    vi.mocked(prismaMock.document.findUnique).mockResolvedValue(null);

    const response = await downloadGET(createMockRequest('GET', ''), { params: { id: 'doc-nonexistent' } });

    expect(response.status).toBe(404);
    const json = await response.json();
    expect(json).toMatchObject({ success: false, error: { code: 'NOT_FOUND' } });
  });

  it('should return 403 when user lacks access', async () => {
    authMock.mockResolvedValue(createMemberSession());
    vi.mocked(prismaMock.document.findUnique).mockResolvedValue({
      id: 'doc-1',
      title: 'Admin only',
      description: null,
      originalName: 'test.pdf',
      storagePath: 'uploads/test.pdf',
      fileSize: 1024,
      mimeType: 'application/pdf',
      categoryId: null,
      documentType: 'contract',
      visibleRoles: ['ADMIN'],
      status: 'published',
      uploadedById: 'user-1',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const response = await downloadGET(createMockRequest('GET', ''), { params: { id: 'doc-1' } });

    expect(response.status).toBe(403);
  });
});
