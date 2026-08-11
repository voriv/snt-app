import type {
  Document,
  CreateDocumentData,
  UpdateDocumentData,
  UpdateMetadataData,
  DocumentFilter,
  DocumentWithDetails,
  PaginatedResult,
} from './document.types';

/**
 * @interface IDocumentRepository
 * @domain documents
 * @description Интерфейс репозитория для работы с документами
 *
 * @spec
 * - findById: возвращает null если не найден
 * - findByIdWithDetails: включает category, tags, uploader
 * - findMany: с ролевой фильтрацией и пагинацией
 * - create: создаёт запись со статусом DRAFT
 * - update: полное обновление документа
 * - updateMetadata: partial update метаданных
 * - updateCategoryIdByIds: batch update для переноса при удалении категории
 * - getByCategoryId: документы категории
 *
 * @traces US-22-03..US-22-07
 * @task DOCS-T2.4.2
 */
export interface IDocumentRepository {
  /**
   * Найти документ по ID
   * @param id - ID документа
   * @returns Документ или null
   */
  findById(id: string): Promise<Document | null>;

  /**
   * Найти документ по ID с деталями (category, tags, uploader)
   * @param id - ID документа
   * @returns Документ с деталями или null
   */
  findByIdWithDetails(id: string): Promise<DocumentWithDetails | null>;

  /**
   * Получить список документов с фильтрацией и пагинацией
   * @param filters - Параметры фильтрации
   * @param userRole - Роль пользователя (для ролевой фильтрации)
   * @returns Пагинированный результат
   */
  findMany(
    filters: DocumentFilter,
    userRole: string,
  ): Promise<PaginatedResult<DocumentWithDetails>>;

  /**
   * Создать новый документ (черновик)
   * @param data - Данные для создания
   * @returns Созданный документ
   */
  create(data: CreateDocumentData): Promise<Document>;

  /**
   * Полное обновление документа
   * @param id - ID документа
   * @param data - Данные для обновления
   * @returns Обновлённый документ
   */
  update(id: string, data: UpdateDocumentData): Promise<Document>;

  /**
   * Partial update метаданных документа
   * @param id - ID документа
   * @param data - Метаданные для обновления
   * @returns Обновлённый документ
   */
  updateMetadata(id: string, data: UpdateMetadataData): Promise<Document>;

  /**
   * Массово обновить categoryId у документов (перенос при удалении категории)
   * @param docIds - Массив ID документов
   * @param newCategoryId - Новый categoryId (null для без категории)
   */
  updateCategoryIdByIds(docIds: string[], newCategoryId: string | null): Promise<void>;

  /**
   * Получить документы по ID категории
   * @param categoryId - ID категории
   * @returns Массив документов
   */
  getByCategoryId(categoryId: string): Promise<Document[]>;
}
