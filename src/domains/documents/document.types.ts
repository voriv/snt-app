import type { DocumentTag } from './tag.types';

/**
 * @type DocumentStatus
 * @domain documents
 * @description Статус документа в системе
 *
 * @spec
 * - draft: черновик, виден только ADMIN (BR-07)
 * - published: опубликован, виден по ролям (BR-04)
 * - archived: архивирован, только просмотр (BR-08)
 *
 * @traces US-22-03..US-22-07
 * @task DOCS-T2.1.2
 */
export type DocumentStatus = 'draft' | 'published' | 'archived';

/**
 * @type Document
 * @domain documents
 * @description Полная сущность документа
 *
 * @spec
 * - Хранит метаданные файла и ссылку на storagePath
 * - Файл хранится в отдельном хранилище, не в БД (NFR-хранилище)
 * - visibleRoles — JSON-массив строк ролей (RBAC)
 * - Документ может находиться только в одной категории (BR-02)
 * - Один статус одновременно (BR-05)
 *
 * @traces US-22-03, US-22-04, US-22-05, US-22-06, US-22-07
 * @task DOCS-T2.1.2
 */
export interface Document {
  id: string;
  title: string;
  description: string | null;
  originalName: string;
  storagePath: string | null;
  fileSize: number;
  mimeType: string;
  categoryId: string | null;
  documentType: string;
  visibleRoles: string[];
  status: DocumentStatus;
  uploadedById: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * @type CreateDocumentData
 * @domain documents
 * @description Данные для создания черновика документа при загрузке файла
 *
 * @spec
 * - Заполняется системой после валидации файла
 * - Статус всегда DRAFT после создания
 *
 * @traces US-22-03 AC-1..3
 * @task DOCS-T2.1.2
 */
export interface CreateDocumentData {
  originalName: string;
  storagePath: string;
  fileSize: number;
  mimeType: string;
  uploadedById: string;
}

/**
 * @type UpdateMetadataData
 * @domain documents
 * @description Данные для сохранения метаданных после загрузки файла (US-22-04)
 *
 * @spec
 * - Меняет статус draft → published
 * - tags — массив строк (названий), которые будут upsert-нуты
 *
 * @traces US-22-04 AC-1..5
 * @task DOCS-T2.1.2
 */
export interface UpdateMetadataData {
  title: string;
  description?: string | null;
  categoryId?: string | null;
  documentType: string;
  visibleRoles: string[];
  tags?: string[];
  status?: DocumentStatus;
}

/**
 * @type UpdateDocumentData
 * @domain documents
 * @description Данные для редактирования существующего документа (US-22-07)
 *
 * @spec
 * - Все поля опциональны (partial update)
 * - archived-документ нельзя редактировать (BR-08)
 *
 * @traces US-22-07 AC-1..8
 * @task DOCS-T2.1.2
 */
export interface UpdateDocumentData {
  title?: string;
  description?: string | null;
  categoryId?: string | null;
  documentType?: string;
  visibleRoles?: string[];
  tags?: string[];
  status?: DocumentStatus;
}

/**
 * @type DocumentFilter
 * @domain documents
 * @description Фильтры для поиска и пагинации списка документов
 *
 * @spec
 * - Все поля опциональны
 * - search ищет по title, description, tags (BR-11)
 * - page начиная с 1, default limit 20
 *
 * @traces US-22-05 AC-1..9
 * @task DOCS-T2.1.2
 */
export interface DocumentFilter {
  categoryId?: string;
  documentType?: string;
  status?: DocumentStatus;
  search?: string;
  page?: number;
  limit?: number;
}

/**
 * @type DocumentWithDetails
 * @domain documents
 * @description Документ с связанными сущностями для отображения в UI
 *
 * @spec
 * - category — опционально (если categoryId = null)
 * - tags — массив тегов документа
 * - uploader — пользователь, загрузивший документ (только id, name, email)
 *
 * @traces US-22-05, US-22-06
 * @task DOCS-T2.1.2
 */
export interface DocumentWithDetails extends Document {
  category: { id: string; name: string } | null;
  tags: DocumentTag[];
  uploader: { id: string; name: string | null; email: string };
}

/**
 * @type PaginatedResult
 * @domain documents
 * @description Общий тип для пагинированных ответов
 *
 * @traces US-22-05 AC-1..9
 * @task DOCS-T2.1.2
 */
export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}
