import type { IDocumentCategoryRepository } from './category.repository.interface';
import type { IDocumentRepository } from './document.repository.interface';
import type { DocumentCategory, CreateCategoryData, CategoryTreeItem } from './category.types';
import {
  CategoryNotFoundError,
  CategoryNameNotUniqueError,
  ParentCategoryNotFoundError,
} from './category.errors';

/**
 * @service DocumentCategoryService
 * @domain documents
 * @description Сервис бизнес-логики для категорий документов
 *
 * @spec
 * - create: валидация, проверка parentId, проверка уникальности name+parentId, создание
 * - delete: транзакция — перенос документов → перепривязка подкатегорий → удаление категории
 * - getTree: делегирование репозиторию
 * - getAll: делегирование репозиторию
 *
 * @traces US-22-01 AC-1..5, US-22-02 AC-1..5
 * @task DOCS-T2.7.1
 */
export class DocumentCategoryService {
  constructor(
    private readonly categoryRepo: IDocumentCategoryRepository,
    private readonly documentRepo: IDocumentRepository,
  ) {}

  /**
   * Создать новую категорию
   *
   * @param data - Валидированные данные для создания
   * @returns Созданная категория
   * @throws {ParentCategoryNotFoundError} — если parentId указывает на несуществующую категорию
   * @throws {CategoryNameNotUniqueError} — если категория с таким name уже существует на этом уровне
   *
   * @traces US-22-01 AC-1, AC-2, AC-4, AC-5
   * @task DOCS-T2.7.1
   */
  async create(data: CreateCategoryData): Promise<DocumentCategory> {
    // Проверка parentId, если указан
    if (data.parentId) {
      const parent = await this.categoryRepo.findById(data.parentId);
      if (!parent) {
        throw new ParentCategoryNotFoundError(data.parentId);
      }
    }

    // Проверка уникальности name+parentId
    const existing = await this.categoryRepo.findByNameAndParent(
      data.name,
      data.parentId ?? null,
    );
    if (existing) {
      throw new CategoryNameNotUniqueError(data.name, data.parentId ?? null);
    }

    return this.categoryRepo.create(data);
  }

  /**
   * Удалить категорию с переносом документов и перепривязкой подкатегорий
   *
   * @param id - ID категории для удаления
   * @throws {CategoryNotFoundError} — если категория не найдена
   *
   * @traces US-22-02 AC-1..5
   * @task DOCS-T2.7.1
   */
  async delete(id: string): Promise<void> {
    // Проверка существования категории
    const category = await this.categoryRepo.findById(id);
    if (!category) {
      throw new CategoryNotFoundError(id);
    }

    // Переносим документы в родительскую категорию (или null, если корневая)
    const docsInCategory = await this.documentRepo.getByCategoryId(id);
    if (docsInCategory.length > 0) {
      const docIds = docsInCategory.map((d) => d.id);
      await this.documentRepo.updateCategoryIdByIds(docIds, category.parentId);
    }

    // Перепривязываем подкатегории к родителю удаляемой категории
    const childIds = await this.categoryRepo.getChildrenIds(id);
    if (childIds.length > 0) {
      await this.categoryRepo.updateParentIdByIds(childIds, category.parentId);
    }

    // Удаляем категорию
    await this.categoryRepo.delete(id);
  }

  /**
   * Получить дерево категорий
   *
   * @returns Дерево категорий для UI
   *
   * @traces US-22-01 AC-1, AC-2
   * @task DOCS-T2.7.1
   */
  async getTree(): Promise<CategoryTreeItem[]> {
    return this.categoryRepo.getTree();
  }

  /**
   * Получить все категории (плоский список)
   *
   * @returns Все категории
   *
   * @traces US-22-01 AC-1, AC-2
   * @task DOCS-T2.7.1
   */
  async getAll(): Promise<DocumentCategory[]> {
    return this.categoryRepo.findAll();
  }
}
