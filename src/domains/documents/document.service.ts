import type { IDocumentRepository } from './document.repository.interface';
import type { IDocumentTagRepository } from './tag.repository.interface';
import type { IDocumentCategoryRepository } from './category.repository.interface';
import { FileStorage } from './file.storage';
import type {
  Document,
  CreateDocumentData,
  UpdateDocumentData,
  UpdateMetadataData,
  DocumentFilter,
  DocumentWithDetails,
  PaginatedResult,
} from './document.types';
import {
  DocumentNotFoundError,
  DocumentAccessDeniedError,
  DocumentArchivedError,
} from './document.errors';

/**
 * @service DocumentService
 * @domain documents
 * @description Сервис бизнес-логики для управления документами
 *
 * @spec
 * - uploadFile: валидация файла, сохранение в storage, создание draft
 * - saveMetadata: валидация, обновление, draft → published, upsert тегов
 * - getDocuments: фильтрация + пагинация + ролевая фильтрация
 * - getDocument: получение + проверка доступа
 * - updateDocument: проверка архива, валидация, обновление с тегами
 * - getDownloadInfo: проверка доступа, возврат info для скачивания
 *
 * @traces US-22-03, US-22-04, US-22-05, US-22-06, US-22-07
 * @task DOCS-T2.7.2
 */
export class DocumentService {
  constructor(
    private readonly documentRepo: IDocumentRepository,
    private readonly tagRepo: IDocumentTagRepository,
    private readonly categoryRepo: IDocumentCategoryRepository,
    private readonly fileStorage: FileStorage,
  ) {}

  /**
   * Загрузить файл и создать черновик документа
   *
   * @param data - Данные файла
   * @returns Черновик документа (status = draft)
   *
   * @traces US-22-03 AC-1..6
   * @task DOCS-T2.7.2
   */
  async uploadFile(data: CreateDocumentData): Promise<Document> {
    // Создаём запись в БД со статусом DRAFT
    return this.documentRepo.create(data);
  }

  /**
   * Сохранить метаданные и опубликовать документ
   *
   * @param id - ID документа
   * @param data - Метаданные для сохранения
   * @returns Опубликованный документ
   *
   * @traces US-22-04 AC-1..5
   * @task DOCS-T2.7.2
   */
  async saveMetadata(id: string, data: UpdateMetadataData): Promise<Document> {
    // Проверка существования документа
    const existing = await this.documentRepo.findById(id);
    if (!existing) {
      throw new DocumentNotFoundError(id);
    }

    // Проверка существования категории, если указана
    if (data.categoryId) {
      const category = await this.categoryRepo.findById(data.categoryId);
      if (!category) {
        throw new DocumentNotFoundError(data.categoryId);
      }
    }

    // Обновление метаданных (draft → published)
    const doc = await this.documentRepo.updateMetadata(id, data);

    // Upsert тегов, если указаны
    if (data.tags && data.tags.length > 0) {
      const tagIds: string[] = [];
      for (const tagName of data.tags) {
        const tag = await this.tagRepo.upsert(tagName);
        tagIds.push(tag.id);
      }
      await this.tagRepo.linkDocument(id, tagIds);
    }

    return doc;
  }

  /**
   * Получить список документов с фильтрацией и пагинацией
   *
   * @param filters - Параметры фильтрации
   * @param userRole - Роль пользователя
   * @returns Пагинированный список документов
   *
   * @traces US-22-05 AC-1..9
   * @task DOCS-T2.7.2
   */
  async getDocuments(
    filters: DocumentFilter,
    userRole: string,
  ): Promise<PaginatedResult<DocumentWithDetails>> {
    return this.documentRepo.findMany(filters, userRole);
  }

  /**
   * Получить документ по ID с проверкой доступа
   *
   * @param id - ID документа
   * @param userRole - Роль пользователя
   * @returns Документ с деталями
   * @throws {DocumentNotFoundError} — если документ не найден
   * @throws {DocumentAccessDeniedError} — если нет прав доступа
   *
   * @traces US-22-06 AC-1, AC-5, AC-6
   * @task DOCS-T2.7.2
   */
  async getDocument(id: string, userRole: string): Promise<DocumentWithDetails> {
    const doc = await this.documentRepo.findByIdWithDetails(id);
    if (!doc) {
      throw new DocumentNotFoundError(id);
    }

    // Проверка доступа
    this.checkAccess(doc, userRole);

    return doc;
  }

  /**
   * Обновить метаданные документа
   *
   * @param id - ID документа
   * @param data - Данные для обновления
   * @returns Обновлённый документ
   * @throws {DocumentArchivedError} — если документ архивирован
   *
   * @traces US-22-07 AC-1..8
   * @task DOCS-T2.7.2
   */
  async updateDocument(id: string, data: UpdateDocumentData): Promise<Document> {
    // Проверка существования документа
    const existing = await this.documentRepo.findById(id);
    if (!existing) {
      throw new DocumentNotFoundError(id);
    }

    // Архивированный документ нельзя редактировать
    if (existing.status === 'archived') {
      throw new DocumentArchivedError(id);
    }

    // Проверка существования категории, если указана
    if (data.categoryId) {
      const category = await this.categoryRepo.findById(data.categoryId);
      if (!category) {
        throw new DocumentNotFoundError(data.categoryId);
      }
    }

    // Обновление документа
    const doc = await this.documentRepo.update(id, data);

    // Upsert тегов, если указаны
    if (data.tags !== undefined) {
      if (data.tags.length > 0) {
        const tagIds: string[] = [];
        for (const tagName of data.tags) {
          const tag = await this.tagRepo.upsert(tagName);
          tagIds.push(tag.id);
        }
        await this.tagRepo.linkDocument(id, tagIds);
      } else {
        // Если передан пустой массив — удаляем все теги
        await this.tagRepo.linkDocument(id, []);
      }
    }

    return doc;
  }

  /**
   * Получить информацию для скачивания файла
   *
   * @param id - ID документа
   * @param userRole - Роль пользователя
   * @returns Путь к файлу, оригинальное имя и MIME-тип
   * @throws {DocumentNotFoundError} — если документ не найден
   * @throws {DocumentAccessDeniedError} — если нет прав доступа
   *
   * @traces US-22-06 AC-4
   * @task DOCS-T2.7.2
   */
  async getDownloadInfo(
    id: string,
    userRole: string,
  ): Promise<{ path: string; originalName: string; mimeType: string }> {
    const doc = await this.documentRepo.findById(id);
    if (!doc) {
      throw new DocumentNotFoundError(id);
    }

    // Проверка доступа
    this.checkAccessSimple(doc, userRole);

    if (!doc.storagePath) {
      throw new DocumentNotFoundError(id);
    }

    return {
      path: doc.storagePath,
      originalName: doc.originalName,
      mimeType: doc.mimeType,
    };
  }

  /**
   * Проверить доступ пользователя к документу (с деталями)
   */
  private checkAccess(doc: DocumentWithDetails, userRole: string): void {
    // ADMIN имеет доступ ко всем документам
    if (userRole === 'ADMIN') {
      return;
    }

    // Draft видны только ADMIN
    if (doc.status === 'draft') {
      throw new DocumentAccessDeniedError(doc.id, userRole);
    }

    // Проверка visibleRoles
    if (!doc.visibleRoles.includes(userRole)) {
      throw new DocumentAccessDeniedError(doc.id, userRole);
    }
  }

  /**
   * Проверить доступ пользователя к документу (без деталей)
   */
  private checkAccessSimple(doc: Document, userRole: string): void {
    // ADMIN имеет доступ ко всем документам
    if (userRole === 'ADMIN') {
      return;
    }

    // Draft видны только ADMIN
    if (doc.status === 'draft') {
      throw new DocumentAccessDeniedError(doc.id, userRole);
    }

    // Проверка visibleRoles
    if (!doc.visibleRoles.includes(userRole)) {
      throw new DocumentAccessDeniedError(doc.id, userRole);
    }
  }
}
