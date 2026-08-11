import type { DocumentCategory, CreateCategoryData, CategoryTreeItem } from './category.types';

/**
 * @interface IDocumentCategoryRepository
 * @domain documents
 * @description Интерфейс репозитория для работы с категориями документов
 *
 * @spec
 * - findAll: возвращает все категории
 * - findById: возвращает null если не найдена (не кидает ошибку)
 * - findByNameAndParent: проверяет уникальность name+parentId
 * - findByParentId: возвращает дочерние категории (parentId = null → корневые)
 * - create: создаёт новую категорию, id генерируется через cuid
 * - delete: hard delete
 * - getChildrenIds: возвращает ID прямых подкатегорий
 * - getTree: рекурсивное дерево категорий
 * - updateParentIdByIds: массовое обновление parentId (для перепривязки при удалении)
 *
 * @traces US-22-01 AC-1..5, US-22-02 AC-1..5
 * @task DOCS-T2.4.1
 */
export interface IDocumentCategoryRepository {
  /**
   * Получить все категории
   * @returns Массив всех категорий
   */
  findAll(): Promise<DocumentCategory[]>;

  /**
   * Найти категорию по ID
   * @param id - ID категории
   * @returns Категория или null если не найдена
   */
  findById(id: string): Promise<DocumentCategory | null>;

  /**
   * Найти категорию по имени и родителю (для проверки уникальности)
   * @param name - Название категории
   * @param parentId - ID родителя (null для корневых)
   * @returns Категория или null если не найдена
   */
  findByNameAndParent(name: string, parentId: string | null): Promise<DocumentCategory | null>;

  /**
   * Получить дочерние категории родителя
   * @param parentId - ID родителя (null для корневых)
   * @returns Массив дочерних категорий
   */
  findByParentId(parentId: string | null): Promise<DocumentCategory[]>;

  /**
   * Создать новую категорию
   * @param data - Данные для создания
   * @returns Созданная категория
   */
  create(data: CreateCategoryData): Promise<DocumentCategory>;

  /**
   * Удалить категорию (hard delete)
   * @param id - ID категории
   */
  delete(id: string): Promise<void>;

  /**
   * Получить ID всех прямых подкатегорий
   * @param parentId - ID родительской категории
   * @returns Массив ID подкатегорий
   */
  getChildrenIds(parentId: string): Promise<string[]>;

  /**
   * Получить дерево категорий (рекурсивное)
   * @returns Дерево категорий
   */
  getTree(): Promise<CategoryTreeItem[]>;

  /**
   * Массово обновить parentId у категорий
   * @param categoryIds - Массив ID категорий для обновления
   * @param newParentId - Новый parentId (null для корневых)
   */
  updateParentIdByIds(categoryIds: string[], newParentId: string | null): Promise<void>;
}
