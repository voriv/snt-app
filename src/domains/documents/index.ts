// Domain types
export type { DocumentCategory, CreateCategoryData, CategoryTreeItem } from './category.types';
export type {
  Document,
  DocumentStatus,
  CreateDocumentData,
  UpdateMetadataData,
  UpdateDocumentData,
  DocumentFilter,
  DocumentWithDetails,
  PaginatedResult,
} from './document.types';
export type { DocumentTag, TagWithName } from './tag.types';

// Validators
export {
  createCategorySchema,
} from './category.validators';
export {
  ALLOWED_MIME_TYPES,
  MAX_FILE_SIZE,
  fileValidationSchema,
  documentMetadataSchema,
  updateDocumentSchema,
  documentFiltersSchema,
} from './document.validators';
export { tagNameSchema } from './tag.validators';

// Errors
export {
  CategoryNotFoundError,
  CategoryNameNotUniqueError,
  ParentCategoryNotFoundError,
} from './category.errors';
export {
  DocumentNotFoundError,
  DocumentAccessDeniedError,
  DocumentArchivedError,
  FileTooLargeError,
  UnsupportedFileTypeError,
  EmptyFileError,
} from './document.errors';

// Repository interfaces
export type { IDocumentCategoryRepository } from './category.repository.interface';
export type { IDocumentRepository } from './document.repository.interface';
export type { IDocumentTagRepository } from './tag.repository.interface';

// Repository implementations
export { DocumentCategoryRepositoryPrisma } from './category.repository.prisma';
export { DocumentRepositoryPrisma } from './document.repository.prisma';
export { DocumentTagRepositoryPrisma } from './tag.repository.prisma';

// Services
export { DocumentCategoryService } from './category.service';
export { DocumentService } from './document.service';
export { DocumentTagService } from './tag.service';

// File storage
// note: FileStorage is a class, not type-only
export { FileStorage } from './file.storage';
export type { FileStorageResult } from './file.storage';
