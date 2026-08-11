/**
 * @file document.service.test.ts
 * @domain documents
 * @description Unit-тесты для DocumentService
 *
 * @spec
 * - Мокирование репозиториев через vi.fn()
 * - Покрытие всех методов сервиса
 * - Проверка бизнес-логики доступа по ролям (BR-04, BR-07)
 * - Проверка защиты от редактирования архивированных документов (BR-08)
 *
 * @traces US-22-03, US-22-04, US-22-05, US-22-06, US-22-07
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DocumentService } from '@/domains/documents/document.service';
import type { IDocumentRepository } from '@/domains/documents/document.repository.interface';
import type { IDocumentTagRepository } from '@/domains/documents/tag.repository.interface';
import type { IDocumentCategoryRepository } from '@/domains/documents/category.repository.interface';
import { FileStorage } from '@/domains/documents/file.storage';
import type {
  Document,
  UpdateDocumentData,
  UpdateMetadataData,
  DocumentFilter,
  DocumentWithDetails,
  PaginatedResult,
  CreateDocumentData,
} from '@/domains/documents/document.types';
import type { DocumentTag } from '@/domains/documents/tag.types';
import type { DocumentCategory } from '@/domains/documents/category.types';
import {
  DocumentNotFoundError,
  DocumentAccessDeniedError,
  DocumentArchivedError,
} from '@/domains/documents/document.errors';

// ============================================================================
// Test Data Helpers
// ============================================================================

function createTestDocument(overrides?: Partial<Document>): Document {
  return {
    id: 'doc-1',
    title: 'Тестовый документ',
    description: null,
    originalName: 'test.pdf',
    storagePath: 'uploads/documents/test.pdf',
    fileSize: 1024,
    mimeType: 'application/pdf',
    categoryId: null,
    documentType: 'contract',
    visibleRoles: ['ADMIN', 'MEMBER'],
    status: 'published',
    uploadedById: 'user-1',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    ...overrides,
  };
}

function createTestDocumentWithDetails(overrides?: Partial<DocumentWithDetails>): DocumentWithDetails {
  return {
    ...createTestDocument(overrides),
    category: { id: 'cat-1', name: 'Договоры' },
    tags: [{ id: 'tag-1', name: 'важный', createdAt: new Date() }],
    uploader: { id: 'user-1', name: 'Admin User', email: 'admin@example.com' },
    ...(overrides as Partial<DocumentWithDetails>),
  };
}

function createTestCategory(overrides?: Partial<DocumentCategory>): DocumentCategory {
  return {
    id: 'cat-1',
    name: 'Договоры',
    description: null,
    parentId: null,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    ...overrides,
  };
}

function createTestTag(overrides?: Partial<DocumentTag>): DocumentTag {
  return {
    id: 'tag-1',
    name: 'важный',
    createdAt: new Date('2024-01-01'),
    ...overrides,
  };
}

// ============================================================================
// Mock Repositories
// ============================================================================

function createMockDocumentRepo(overrides?: Partial<IDocumentRepository>): IDocumentRepository {
  return {
    findById: vi.fn().mockResolvedValue(null),
    findByIdWithDetails: vi.fn().mockResolvedValue(null),
    create: vi.fn().mockResolvedValue(createTestDocument()),
    update: vi.fn().mockResolvedValue(createTestDocument()),
    updateMetadata: vi.fn().mockResolvedValue(createTestDocument()),
    findMany: vi.fn().mockResolvedValue({ items: [], total: 0, page: 1, limit: 20 }),
    getByCategoryId: vi.fn().mockResolvedValue([]),
    updateCategoryIdByIds: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

function createMockTagRepo(overrides?: Partial<IDocumentTagRepository>): IDocumentTagRepository {
  return {
    findAll: vi.fn().mockResolvedValue([]),
    findByName: vi.fn().mockResolvedValue(null),
    upsert: vi.fn().mockImplementation((name) => Promise.resolve(createTestTag({ name }))),
    linkDocument: vi.fn().mockResolvedValue(undefined),
    unlinkTag: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

function createMockCategoryRepo(overrides?: Partial<IDocumentCategoryRepository>): IDocumentCategoryRepository {
  return {
    findAll: vi.fn().mockResolvedValue([]),
    findById: vi.fn().mockResolvedValue(null),
    findByNameAndParent: vi.fn().mockResolvedValue(null),
    findByParentId: vi.fn().mockResolvedValue([]),
    create: vi.fn().mockResolvedValue(createTestCategory()),
    delete: vi.fn().mockResolvedValue(undefined),
    getChildrenIds: vi.fn().mockResolvedValue([]),
    getTree: vi.fn().mockResolvedValue([]),
    updateParentIdByIds: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

// ============================================================================
// Tests
// ============================================================================

describe('DocumentService', () => {
  let documentRepo: IDocumentRepository;
  let tagRepo: IDocumentTagRepository;
  let categoryRepo: IDocumentCategoryRepository;
  let fileStorage: FileStorage;
  let service: DocumentService;

  beforeEach(() => {
    documentRepo = createMockDocumentRepo();
    tagRepo = createMockTagRepo();
    categoryRepo = createMockCategoryRepo();
    fileStorage = new FileStorage();
    service = new DocumentService(documentRepo, tagRepo, categoryRepo, fileStorage);
    vi.clearAllMocks();
  });

  // ==========================================================================
  // uploadFile()
  // ==========================================================================

  describe('uploadFile()', () => {
    it('should create a draft document', async () => {
      const data: CreateDocumentData = {
        originalName: 'test.pdf',
        storagePath: 'uploads/documents/test.pdf',
        fileSize: 1024,
        mimeType: 'application/pdf',
        uploadedById: 'user-1',
      };
      const created = createTestDocument({ status: 'draft' });

      vi.mocked(documentRepo.create).mockResolvedValue(created);

      const result = await service.uploadFile(data);

      expect(result).toEqual(created);
      expect(documentRepo.create).toHaveBeenCalledWith(data);
    });
  });

  // ==========================================================================
  // saveMetadata()
  // ==========================================================================

  describe('saveMetadata()', () => {
    it('should throw DocumentNotFoundError when document does not exist', async () => {
      vi.mocked(documentRepo.findById).mockResolvedValue(null);

      const data: UpdateMetadataData = {
        title: 'Новый заголовок',
        documentType: 'contract',
        visibleRoles: ['ADMIN'],
      };

      await expect(service.saveMetadata('nonexistent', data)).rejects.toThrow(DocumentNotFoundError);
    });

    it('should update metadata and return document', async () => {
      const existing = createTestDocument();
      const updated = createTestDocument({ title: 'Новый заголовок', status: 'published' });
      const data: UpdateMetadataData = {
        title: 'Новый заголовок',
        documentType: 'contract',
        visibleRoles: ['ADMIN'],
      };

      vi.mocked(documentRepo.findById).mockResolvedValue(existing);
      vi.mocked(documentRepo.updateMetadata).mockResolvedValue(updated);

      const result = await service.saveMetadata('doc-1', data);

      expect(result).toEqual(updated);
      expect(documentRepo.updateMetadata).toHaveBeenCalledWith('doc-1', data);
    });

    it('should throw DocumentNotFoundError when category does not exist', async () => {
      const existing = createTestDocument();
      const data: UpdateMetadataData = {
        title: 'Тест',
        documentType: 'contract',
        visibleRoles: ['ADMIN'],
        categoryId: 'cat-nonexistent',
      };

      vi.mocked(documentRepo.findById).mockResolvedValue(existing);
      vi.mocked(categoryRepo.findById).mockResolvedValue(null);

      await expect(service.saveMetadata('doc-1', data)).rejects.toThrow(DocumentNotFoundError);
    });

    it('should upsert and link tags when provided', async () => {
      const existing = createTestDocument();
      const updated = createTestDocument();
      const data: UpdateMetadataData = {
        title: 'Тест',
        documentType: 'contract',
        visibleRoles: ['ADMIN'],
        tags: ['важный', 'новый'],
      };

      vi.mocked(documentRepo.findById).mockResolvedValue(existing);
      vi.mocked(documentRepo.updateMetadata).mockResolvedValue(updated);
      vi.mocked(tagRepo.upsert).mockResolvedValueOnce(createTestTag({ id: 'tag-1', name: 'важный' }));
      vi.mocked(tagRepo.upsert).mockResolvedValueOnce(createTestTag({ id: 'tag-2', name: 'новый' }));

      await service.saveMetadata('doc-1', data);

      expect(tagRepo.upsert).toHaveBeenCalledWith('важный');
      expect(tagRepo.upsert).toHaveBeenCalledWith('новый');
      expect(tagRepo.linkDocument).toHaveBeenCalledWith('doc-1', ['tag-1', 'tag-2']);
    });

    it('should not link tags when tags array is empty', async () => {
      const existing = createTestDocument();
      const updated = createTestDocument();
      const data: UpdateMetadataData = {
        title: 'Тест',
        documentType: 'contract',
        visibleRoles: ['ADMIN'],
        tags: [],
      };

      vi.mocked(documentRepo.findById).mockResolvedValue(existing);
      vi.mocked(documentRepo.updateMetadata).mockResolvedValue(updated);

      await service.saveMetadata('doc-1', data);

      expect(tagRepo.linkDocument).not.toHaveBeenCalled();
    });

    it('should not link tags when tags is undefined', async () => {
      const existing = createTestDocument();
      const updated = createTestDocument();
      const data: UpdateMetadataData = {
        title: 'Тест',
        documentType: 'contract',
        visibleRoles: ['ADMIN'],
      };

      vi.mocked(documentRepo.findById).mockResolvedValue(existing);
      vi.mocked(documentRepo.updateMetadata).mockResolvedValue(updated);

      await service.saveMetadata('doc-1', data);

      expect(tagRepo.linkDocument).not.toHaveBeenCalled();
    });
  });

  // ==========================================================================
  // getDocuments()
  // ==========================================================================

  describe('getDocuments()', () => {
    it('should return paginated documents from repository', async () => {
      const doc = createTestDocumentWithDetails();
      const result: PaginatedResult<DocumentWithDetails> = {
        items: [doc],
        total: 1,
        page: 1,
        limit: 20,
      };

      vi.mocked(documentRepo.findMany).mockResolvedValue(result);

      const filters: DocumentFilter = {};
      const response = await service.getDocuments(filters, 'MEMBER');

      expect(response).toEqual(result);
      expect(documentRepo.findMany).toHaveBeenCalledWith(filters, 'MEMBER');
    });
  });

  // ==========================================================================
  // getDocument()
  // ==========================================================================

  describe('getDocument()', () => {
    it('should throw DocumentNotFoundError when document does not exist', async () => {
      vi.mocked(documentRepo.findByIdWithDetails).mockResolvedValue(null);

      await expect(service.getDocument('nonexistent', 'ADMIN')).rejects.toThrow(DocumentNotFoundError);
    });

    it('should return document when ADMIN requests it', async () => {
      const doc = createTestDocumentWithDetails({ status: 'draft' });
      vi.mocked(documentRepo.findByIdWithDetails).mockResolvedValue(doc);

      const result = await service.getDocument('doc-1', 'ADMIN');

      expect(result).toEqual(doc);
    });

    it('should throw DocumentAccessDeniedError when non-ADMIN requests draft', async () => {
      const doc = createTestDocumentWithDetails({ status: 'draft' });
      vi.mocked(documentRepo.findByIdWithDetails).mockResolvedValue(doc);

      await expect(service.getDocument('doc-1', 'MEMBER')).rejects.toThrow(DocumentAccessDeniedError);
    });

    it('should throw DocumentAccessDeniedError when role not in visibleRoles', async () => {
      const doc = createTestDocumentWithDetails({
        status: 'published',
        visibleRoles: ['ADMIN'],
      });
      vi.mocked(documentRepo.findByIdWithDetails).mockResolvedValue(doc);

      await expect(service.getDocument('doc-1', 'MEMBER')).rejects.toThrow(DocumentAccessDeniedError);
    });

    it('should return document when role is in visibleRoles', async () => {
      const doc = createTestDocumentWithDetails({
        status: 'published',
        visibleRoles: ['ADMIN', 'MEMBER'],
      });
      vi.mocked(documentRepo.findByIdWithDetails).mockResolvedValue(doc);

      const result = await service.getDocument('doc-1', 'MEMBER');

      expect(result).toEqual(doc);
    });

    it('should allow viewing archived documents by authorized users', async () => {
      const doc = createTestDocumentWithDetails({
        status: 'archived',
        visibleRoles: ['ADMIN', 'MEMBER'],
      });
      vi.mocked(documentRepo.findByIdWithDetails).mockResolvedValue(doc);

      const result = await service.getDocument('doc-1', 'MEMBER');

      expect(result).toEqual(doc);
    });
  });

  // ==========================================================================
  // updateDocument()
  // ==========================================================================

  describe('updateDocument()', () => {
    it('should throw DocumentNotFoundError when document does not exist', async () => {
      vi.mocked(documentRepo.findById).mockResolvedValue(null);

      await expect(service.updateDocument('nonexistent', { title: 'New' })).rejects.toThrow(DocumentNotFoundError);
    });

    it('should throw DocumentArchivedError when trying to update archived document', async () => {
      const doc = createTestDocument({ status: 'archived' });
      vi.mocked(documentRepo.findById).mockResolvedValue(doc);

      await expect(service.updateDocument('doc-1', { title: 'New' })).rejects.toThrow(DocumentArchivedError);
    });

    it('should update draft document', async () => {
      const doc = createTestDocument({ status: 'draft' });
      const updated = createTestDocument({ status: 'draft', title: 'Новый заголовок' });
      const data: UpdateDocumentData = { title: 'Новый заголовок' };

      vi.mocked(documentRepo.findById).mockResolvedValue(doc);
      vi.mocked(documentRepo.update).mockResolvedValue(updated);

      const result = await service.updateDocument('doc-1', data);

      expect(result).toEqual(updated);
      expect(documentRepo.update).toHaveBeenCalledWith('doc-1', data);
    });

    it('should update published document', async () => {
      const doc = createTestDocument({ status: 'published' });
      const updated = createTestDocument({ status: 'published', title: 'Новый заголовок' });

      vi.mocked(documentRepo.findById).mockResolvedValue(doc);
      vi.mocked(documentRepo.update).mockResolvedValue(updated);

      const result = await service.updateDocument('doc-1', { title: 'Новый заголовок' });

      expect(result).toEqual(updated);
    });

    it('should throw DocumentNotFoundError when category does not exist', async () => {
      const doc = createTestDocument({ status: 'published' });

      vi.mocked(documentRepo.findById).mockResolvedValue(doc);
      vi.mocked(categoryRepo.findById).mockResolvedValue(null);

      await expect(service.updateDocument('doc-1', { categoryId: 'cat-nonexistent' }))
        .rejects.toThrow(DocumentNotFoundError);
    });

    it('should upsert and link tags when provided', async () => {
      const doc = createTestDocument({ status: 'published' });
      const updated = createTestDocument({ status: 'published' });
      const data: UpdateDocumentData = { tags: ['новое', 'тэг'] };

      vi.mocked(documentRepo.findById).mockResolvedValue(doc);
      vi.mocked(documentRepo.update).mockResolvedValue(updated);
      vi.mocked(tagRepo.upsert).mockResolvedValueOnce(createTestTag({ id: 'tag-1', name: 'новое' }));
      vi.mocked(tagRepo.upsert).mockResolvedValueOnce(createTestTag({ id: 'tag-2', name: 'тэг' }));

      await service.updateDocument('doc-1', data);

      expect(tagRepo.linkDocument).toHaveBeenCalledWith('doc-1', ['tag-1', 'tag-2']);
    });

    it('should remove all tags when empty array is provided', async () => {
      const doc = createTestDocument({ status: 'published' });
      const updated = createTestDocument({ status: 'published' });

      vi.mocked(documentRepo.findById).mockResolvedValue(doc);
      vi.mocked(documentRepo.update).mockResolvedValue(updated);

      await service.updateDocument('doc-1', { tags: [] });

      expect(tagRepo.linkDocument).toHaveBeenCalledWith('doc-1', []);
    });

    it('should not modify tags when tags is undefined', async () => {
      const doc = createTestDocument({ status: 'published' });
      const updated = createTestDocument({ status: 'published' });

      vi.mocked(documentRepo.findById).mockResolvedValue(doc);
      vi.mocked(documentRepo.update).mockResolvedValue(updated);

      await service.updateDocument('doc-1', { title: 'Новое' });

      expect(tagRepo.linkDocument).not.toHaveBeenCalled();
    });
  });

  // ==========================================================================
  // getDownloadInfo()
  // ==========================================================================

  describe('getDownloadInfo()', () => {
    it('should throw DocumentNotFoundError when document does not exist', async () => {
      vi.mocked(documentRepo.findById).mockResolvedValue(null);

      await expect(service.getDownloadInfo('nonexistent', 'ADMIN')).rejects.toThrow(DocumentNotFoundError);
    });

    it('should return download info for authorized user', async () => {
      const doc = createTestDocument({
        status: 'published',
        visibleRoles: ['ADMIN', 'MEMBER'],
        storagePath: 'uploads/documents/file.pdf',
        originalName: 'document.pdf',
        mimeType: 'application/pdf',
      });
      vi.mocked(documentRepo.findById).mockResolvedValue(doc);

      const result = await service.getDownloadInfo('doc-1', 'MEMBER');

      expect(result).toEqual({
        path: 'uploads/documents/file.pdf',
        originalName: 'document.pdf',
        mimeType: 'application/pdf',
      });
    });

    it('should throw DocumentNotFoundError when storagePath is missing', async () => {
      const doc = createTestDocument({ storagePath: null });
      vi.mocked(documentRepo.findById).mockResolvedValue(doc);

      await expect(service.getDownloadInfo('doc-1', 'ADMIN')).rejects.toThrow(DocumentNotFoundError);
    });

    it('should throw DocumentAccessDeniedError for unauthorized user', async () => {
      const doc = createTestDocument({
        status: 'published',
        visibleRoles: ['ADMIN'],
        storagePath: 'uploads/documents/file.pdf',
      });
      vi.mocked(documentRepo.findById).mockResolvedValue(doc);

      await expect(service.getDownloadInfo('doc-1', 'MEMBER')).rejects.toThrow(DocumentAccessDeniedError);
    });

    it('should throw DocumentAccessDeniedError for draft when non-ADMIN', async () => {
      const doc = createTestDocument({
        status: 'draft',
        visibleRoles: ['ADMIN'],
        storagePath: 'uploads/documents/file.pdf',
      });
      vi.mocked(documentRepo.findById).mockResolvedValue(doc);

      await expect(service.getDownloadInfo('doc-1', 'MEMBER')).rejects.toThrow(DocumentAccessDeniedError);
    });
  });
});
