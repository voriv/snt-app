import type { IDocumentTagRepository } from './tag.repository.interface';
import type { DocumentTag } from './tag.types';

/**
 * @service DocumentTagService
 * @domain documents
 * @description Сервис для работы с тегами документов
 *
 * @spec
 * - getAllTags: все теги для UI-автодополнения
 * - assignTags: upsert тегов по именам + привязка к документу
 *
 * @traces US-22-04 AC-4, US-22-07 AC-3, AC-4
 * @task DOCS-T2.7.3
 */
export class DocumentTagService {
  constructor(private readonly tagRepo: IDocumentTagRepository) {}

  /**
   * Получить все теги
   * @returns Все теги для UI-автодополнения
   *
   * @traces US-22-04, US-22-07
   * @task DOCS-T2.7.3
   */
  async getAllTags(): Promise<DocumentTag[]> {
    return this.tagRepo.findAll();
  }

  /**
   * Назначить теги документу (upsert по именам + привязка)
   * @param documentId - ID документа
   * @param tagNames - Массив названий тегов
   *
   * @traces US-22-04 AC-4, US-22-07 AC-3
   * @task DOCS-T2.7.3
   */
  async assignTags(documentId: string, tagNames: string[]): Promise<void> {
    if (tagNames.length === 0) {
      await this.tagRepo.linkDocument(documentId, []);
      return;
    }

    const tagIds: string[] = [];
    for (const name of tagNames) {
      const tag = await this.tagRepo.upsert(name);
      tagIds.push(tag.id);
    }

    await this.tagRepo.linkDocument(documentId, tagIds);
  }
}
