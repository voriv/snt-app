/**
 * @file tag.service.test.ts
 * @domain documents
 * @description Unit-тесты для DocumentTagService
 *
 * @traces US-22-04 AC-4, US-22-07 AC-3, AC-4
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DocumentTagService } from '@/domains/documents/tag.service';
import type { IDocumentTagRepository } from '@/domains/documents/tag.repository.interface';
import type { DocumentTag } from '@/domains/documents/tag.types';

// ============================================================================
// Test Data Helpers
// ============================================================================

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

// ============================================================================
// Tests
// ============================================================================

describe('DocumentTagService', () => {
  let tagRepo: IDocumentTagRepository;
  let service: DocumentTagService;

  beforeEach(() => {
    tagRepo = createMockTagRepo();
    service = new DocumentTagService(tagRepo);
    vi.clearAllMocks();
  });

  // ==========================================================================
  // getAllTags()
  // ==========================================================================

  describe('getAllTags()', () => {
    it('should return all tags from repository', async () => {
      const tags = [
        createTestTag({ id: 'tag-1', name: 'важный' }),
        createTestTag({ id: 'tag-2', name: 'договор' }),
      ];

      vi.mocked(tagRepo.findAll).mockResolvedValue(tags);

      const result = await service.getAllTags();

      expect(result).toEqual(tags);
      expect(tagRepo.findAll).toHaveBeenCalled();
    });

    it('should return empty array when no tags exist', async () => {
      vi.mocked(tagRepo.findAll).mockResolvedValue([]);

      const result = await service.getAllTags();

      expect(result).toEqual([]);
    });
  });

  // ==========================================================================
  // assignTags()
  // ==========================================================================

  describe('assignTags()', () => {
    it('should link empty tags when tagNames is empty array', async () => {
      await service.assignTags('doc-1', []);

      expect(tagRepo.linkDocument).toHaveBeenCalledWith('doc-1', []);
      expect(tagRepo.upsert).not.toHaveBeenCalled();
    });

    it('should upsert each tag and link to document', async () => {
      const tags = ['важный', 'договор', '2024'];

      vi.mocked(tagRepo.upsert).mockResolvedValueOnce(createTestTag({ id: 'tag-1', name: 'важный' }));
      vi.mocked(tagRepo.upsert).mockResolvedValueOnce(createTestTag({ id: 'tag-2', name: 'договор' }));
      vi.mocked(tagRepo.upsert).mockResolvedValueOnce(createTestTag({ id: 'tag-3', name: '2024' }));

      await service.assignTags('doc-1', tags);

      expect(tagRepo.upsert).toHaveBeenCalledWith('важный');
      expect(tagRepo.upsert).toHaveBeenCalledWith('договор');
      expect(tagRepo.upsert).toHaveBeenCalledWith('2024');
      expect(tagRepo.linkDocument).toHaveBeenCalledWith('doc-1', ['tag-1', 'tag-2', 'tag-3']);
    });

    it('should handle single tag', async () => {
      vi.mocked(tagRepo.upsert).mockResolvedValueOnce(createTestTag({ id: 'tag-1', name: 'новое' }));

      await service.assignTags('doc-1', ['новое']);

      expect(tagRepo.upsert).toHaveBeenCalledWith('новое');
      expect(tagRepo.linkDocument).toHaveBeenCalledWith('doc-1', ['tag-1']);
    });

    it('should use existing tag when upsert returns existing', async () => {
      const existingTag = createTestTag({ id: 'tag-existing', name: 'важный' });
      vi.mocked(tagRepo.upsert).mockResolvedValueOnce(existingTag);

      await service.assignTags('doc-1', ['важный']);

      expect(tagRepo.linkDocument).toHaveBeenCalledWith('doc-1', ['tag-existing']);
    });
  });
});
