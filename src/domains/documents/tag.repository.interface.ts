import type { DocumentTag, TagWithName } from './tag.types';

/**
 * @interface IDocumentTagRepository
 * @domain documents
 * @description Интерфейс репозитория для работы с тегами документов
 *
 * @spec
 * - findAll: все теги (для UI-автодополнения)
 * - findByName: поиск по имени
 * - upsert: create or return existing
 * - linkDocument: установить связи документа с тегами (замена всех)
 * - unlinkTag: удалить одну связь
 *
 * @traces US-22-04 AC-4, US-22-07 AC-3, AC-4
 * @task DOCS-T2.4.3
 */
export interface IDocumentTagRepository {
  /**
   * Получить все теги
   * @returns Массив всех тегов
   */
  findAll(): Promise<DocumentTag[]>;

  /**
   * Найти тег по имени
   * @param name - Название тега
   * @returns Тег или null
   */
  findByName(name: string): Promise<DocumentTag | null>;

  /**
   * Создать тег, если не существует, или вернуть существующий
   * @param name - Название тега
   * @returns Тег (существующий или новый)
   */
  upsert(name: string): Promise<DocumentTag>;

  /**
   * Установить связи документа с тегами (замена всех существующих)
   * @param documentId - ID документа
   * @param tagIds - Массив ID тегов
   */
  linkDocument(documentId: string, tagIds: string[]): Promise<void>;

  /**
   * Удалить связь документа с тегом
   * @param documentId - ID документа
   * @param tagId - ID тега
   */
  unlinkTag(documentId: string, tagId: string): Promise<void>;
}
