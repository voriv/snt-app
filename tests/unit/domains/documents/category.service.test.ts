/**
 * @file category.service.test.ts
 * @domain documents
 * @description Unit-тесты для DocumentCategoryService
 *
 * @spec
 * - Мокирование репозиториев через vi.fn()
 * - Покрытие всех методов сервиса
 * - Проверка обработки ошибок
 *
 * @traces US-22-01 AC-1..5, US-22-02 AC-1..5
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DocumentCategoryService } from '@/domains/documents/category.service';
import type { IDocumentCategoryRepository } from '@/domains/documents/category.repository.interface';
import type { IDocumentRepository } from '@/domains/documents/document.repository.interface';
import type { DocumentCategory, CreateCategoryData, CategoryTreeItem } from '@/domains/documents/category.types';
import type { Document } from '@/domains/documents/document.types';
import {
  CategoryNotFoundError,
  CategoryNameNotUniqueError,
  ParentCategoryNotFoundError,
} from '@/domains/documents/category.errors';

// ============================================================================
// Test Data Helpers
// ============================================================================

function createTestCategory(overrides?: Partial<DocumentCategory>): DocumentCategory {
  return {
    id: 'cat-1',
    name: 'Договоры',
    description: 'Категория договоров',
    parentId: null,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    ...overrides,
  };
}

function createTestDocument(overrides?: Partial<Document>): Document {
  return {
    id: 'doc-1',
    title: 'Тестовый документ',
    description: null,
    originalName: 'test.pdf',
    storagePath: 'uploads/documents/test.pdf',
    fileSize: 1024,
    mimeType: 'application/pdf',
    categoryId: 'cat-1',
    documentType: 'contract',
    visibleRoles: ['ADMIN', 'MEMBER'],
    status: 'published',
    uploadedById: 'user-1',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    ...overrides,
  };
}

function createTestTreeItem(overrides?: Partial<CategoryTreeItem>): CategoryTreeItem {
  return {
    id: 'cat-1',
    name: 'Договоры',
    description: null,
    children: [],
    ...overrides,
  };
}

// ============================================================================
// Mock Repositories
// ============================================================================

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

// ============================================================================
// Tests
// ============================================================================

describe('DocumentCategoryService', () => {
  let categoryRepo: IDocumentCategoryRepository;
  let documentRepo: IDocumentRepository;
  let service: DocumentCategoryService;

  beforeEach(() => {
    categoryRepo = createMockCategoryRepo();
    documentRepo = createMockDocumentRepo();
    service = new DocumentCategoryService(categoryRepo, documentRepo);
    vi.clearAllMocks();
  });

  // ==========================================================================
  // create()
  // ==========================================================================

  describe('create()', () => {
    it('should create a root category successfully', async () => {
      const data: CreateCategoryData = { name: 'Новая категория' };
      const created = createTestCategory({ id: 'cat-new', name: 'Новая категория' });

      vi.mocked(categoryRepo.findByNameAndParent).mockResolvedValue(null);
      vi.mocked(categoryRepo.create).mockResolvedValue(created);

      const result = await service.create(data);

      expect(result).toEqual(created);
      expect(categoryRepo.findByNameAndParent).toHaveBeenCalledWith('Новая категория', null);
      expect(categoryRepo.create).toHaveBeenCalledWith(data);
      // Не должна проверять родителя для корневой категории
      expect(categoryRepo.findById).not.toHaveBeenCalled();
    });

    it('should create a subcategory when parentId is provided', async () => {
      const parentCategory = createTestCategory({ id: 'cat-parent' });
      const data: CreateCategoryData = { name: 'Подкатегория', parentId: 'cat-parent' };
      const created = createTestCategory({ id: 'cat-child', name: 'Подкатегория', parentId: 'cat-parent' });

      vi.mocked(categoryRepo.findById).mockResolvedValue(parentCategory);
      vi.mocked(categoryRepo.findByNameAndParent).mockResolvedValue(null);
      vi.mocked(categoryRepo.create).mockResolvedValue(created);

      const result = await service.create(data);

      expect(result).toEqual(created);
      expect(categoryRepo.findById).toHaveBeenCalledWith('cat-parent');
      expect(categoryRepo.findByNameAndParent).toHaveBeenCalledWith('Подкатегория', 'cat-parent');
    });

    it('should throw ParentCategoryNotFoundError when parent does not exist', async () => {
      const data: CreateCategoryData = { name: 'Подкатегория', parentId: 'cat-nonexistent' };

      vi.mocked(categoryRepo.findById).mockResolvedValue(null);

      await expect(service.create(data)).rejects.toThrow(ParentCategoryNotFoundError);
      expect(categoryRepo.findById).toHaveBeenCalledWith('cat-nonexistent');
    });

    it('should throw CategoryNameNotUniqueError when name already exists at same level', async () => {
      const existing = createTestCategory({ name: 'Дубликат' });
      const data: CreateCategoryData = { name: 'Дубликат' };

      vi.mocked(categoryRepo.findByNameAndParent).mockResolvedValue(existing);

      await expect(service.create(data)).rejects.toThrow(CategoryNameNotUniqueError);
    });

    it('should throw CategoryNameNotUniqueError for duplicate name in parent', async () => {
      const existing = createTestCategory({ id: 'cat-existing', name: 'Дубликат', parentId: 'cat-parent' });
      const parentCategory = createTestCategory({ id: 'cat-parent' });
      const data: CreateCategoryData = { name: 'Дубликат', parentId: 'cat-parent' };

      vi.mocked(categoryRepo.findById).mockResolvedValue(parentCategory);
      vi.mocked(categoryRepo.findByNameAndParent).mockResolvedValue(existing);

      await expect(service.create(data)).rejects.toThrow(CategoryNameNotUniqueError);
    });
  });

  // ==========================================================================
  // delete()
  // ==========================================================================

  describe('delete()', () => {
    it('should throw CategoryNotFoundError when category does not exist', async () => {
      vi.mocked(categoryRepo.findById).mockResolvedValue(null);

      await expect(service.delete('cat-nonexistent')).rejects.toThrow(CategoryNotFoundError);
    });

    it('should delete an empty category without documents or children', async () => {
      const category = createTestCategory({ id: 'cat-1', parentId: null });

      vi.mocked(categoryRepo.findById).mockResolvedValue(category);
      vi.mocked(documentRepo.getByCategoryId).mockResolvedValue([]);
      vi.mocked(categoryRepo.getChildrenIds).mockResolvedValue([]);

      await service.delete('cat-1');

      expect(categoryRepo.delete).toHaveBeenCalledWith('cat-1');
      expect(documentRepo.updateCategoryIdByIds).not.toHaveBeenCalled();
      expect(categoryRepo.updateParentIdByIds).not.toHaveBeenCalled();
    });

    it('should move documents to parent category when deleting non-root category', async () => {
      const category = createTestCategory({ id: 'cat-1', parentId: 'cat-parent' });
      const doc1 = createTestDocument({ id: 'doc-1', categoryId: 'cat-1' });

      vi.mocked(categoryRepo.findById).mockResolvedValue(category);
      vi.mocked(documentRepo.getByCategoryId).mockResolvedValue([doc1]);
      vi.mocked(categoryRepo.getChildrenIds).mockResolvedValue([]);

      await service.delete('cat-1');

      expect(documentRepo.updateCategoryIdByIds).toHaveBeenCalledWith(['doc-1'], 'cat-parent');
      expect(categoryRepo.delete).toHaveBeenCalledWith('cat-1');
    });

    it('should move documents to null when deleting root category', async () => {
      const category = createTestCategory({ id: 'cat-1', parentId: null });
      const doc1 = createTestDocument({ id: 'doc-1', categoryId: 'cat-1' });

      vi.mocked(categoryRepo.findById).mockResolvedValue(category);
      vi.mocked(documentRepo.getByCategoryId).mockResolvedValue([doc1]);
      vi.mocked(categoryRepo.getChildrenIds).mockResolvedValue([]);

      await service.delete('cat-1');

      expect(documentRepo.updateCategoryIdByIds).toHaveBeenCalledWith(['doc-1'], null);
      expect(categoryRepo.delete).toHaveBeenCalledWith('cat-1');
    });

    it('should rebind child categories to parent when deleting', async () => {
      const category = createTestCategory({ id: 'cat-1', parentId: 'cat-parent' });
      const childIds = ['cat-child-1', 'cat-child-2'];

      vi.mocked(categoryRepo.findById).mockResolvedValue(category);
      vi.mocked(documentRepo.getByCategoryId).mockResolvedValue([]);
      vi.mocked(categoryRepo.getChildrenIds).mockResolvedValue(childIds);

      await service.delete('cat-1');

      expect(categoryRepo.updateParentIdByIds).toHaveBeenCalledWith(childIds, 'cat-parent');
      expect(categoryRepo.delete).toHaveBeenCalledWith('cat-1');
    });

    it('should rebind child categories to null when deleting root with children', async () => {
      const category = createTestCategory({ id: 'cat-1', parentId: null });
      const childIds = ['cat-child-1'];

      vi.mocked(categoryRepo.findById).mockResolvedValue(category);
      vi.mocked(documentRepo.getByCategoryId).mockResolvedValue([]);
      vi.mocked(categoryRepo.getChildrenIds).mockResolvedValue(childIds);

      await service.delete('cat-1');

      expect(categoryRepo.updateParentIdByIds).toHaveBeenCalledWith(childIds, null);
    });

    it('should handle full deletion with documents and children', async () => {
      const category = createTestCategory({ id: 'cat-1', parentId: 'cat-parent' });
      const doc1 = createTestDocument({ id: 'doc-1', categoryId: 'cat-1' });
      const doc2 = createTestDocument({ id: 'doc-2', categoryId: 'cat-1' });
      const childIds = ['cat-child-1'];

      vi.mocked(categoryRepo.findById).mockResolvedValue(category);
      vi.mocked(documentRepo.getByCategoryId).mockResolvedValue([doc1, doc2]);
      vi.mocked(categoryRepo.getChildrenIds).mockResolvedValue(childIds);

      await service.delete('cat-1');

      expect(documentRepo.updateCategoryIdByIds).toHaveBeenCalledWith(['doc-1', 'doc-2'], 'cat-parent');
      expect(categoryRepo.updateParentIdByIds).toHaveBeenCalledWith(childIds, 'cat-parent');
      expect(categoryRepo.delete).toHaveBeenCalledWith('cat-1');
    });
  });

  // ==========================================================================
  // getTree()
  // ==========================================================================

  describe('getTree()', () => {
    it('should return category tree from repository', async () => {
      const tree: CategoryTreeItem[] = [
        createTestTreeItem({
          id: 'cat-1',
          name: 'Договоры',
          children: [createTestTreeItem({ id: 'cat-2', name: 'Протоколы' })],
        }),
      ];

      vi.mocked(categoryRepo.getTree).mockResolvedValue(tree);

      const result = await service.getTree();

      expect(result).toEqual(tree);
      expect(categoryRepo.getTree).toHaveBeenCalled();
    });

    it('should return empty array when no categories exist', async () => {
      vi.mocked(categoryRepo.getTree).mockResolvedValue([]);

      const result = await service.getTree();

      expect(result).toEqual([]);
    });
  });

  // ==========================================================================
  // getAll()
  // ==========================================================================

  describe('getAll()', () => {
    it('should return all categories from repository', async () => {
      const categories = [
        createTestCategory({ id: 'cat-1', name: 'Договоры' }),
        createTestCategory({ id: 'cat-2', name: 'Протоколы' }),
      ];

      vi.mocked(categoryRepo.findAll).mockResolvedValue(categories);

      const result = await service.getAll();

      expect(result).toEqual(categories);
      expect(categoryRepo.findAll).toHaveBeenCalled();
    });

    it('should return empty array when no categories exist', async () => {
      vi.mocked(categoryRepo.findAll).mockResolvedValue([]);

      const result = await service.getAll();

      expect(result).toEqual([]);
    });
  });
});
