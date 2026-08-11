/**
 * @type DocumentCategory
 * @domain documents
 * @description Полная сущность категории документа
 *
 * @spec
 * - Поддерживает иерархию через self-reference (parentId → DocumentCategory.id)
 * - parentId = null означает корневую категорию
 * - name уникально в рамках одного родителя (@@unique([name, parentId]))
 *
 * @traces US-22-01 AC-1..5, US-22-02 AC-1..5
 * @task DOCS-T2.1.1
 */
export interface DocumentCategory {
  id: string;
  name: string;
  description: string | null;
  parentId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * @type CreateCategoryData
 * @domain documents
 * @description Данные для создания новой категории документа
 *
 * @spec
 * - name — обязательное, уникальное в рамках родителя
 * - description — опционально, max 500 символов
 * - parentId — опционально, ссылка на родительскую категорию
 *
 * @traces US-22-01 AC-1, AC-2
 * @task DOCS-T2.1.1
 */
export interface CreateCategoryData {
  name: string;
  description?: string | null;
  parentId?: string | null;
}

/**
 * @type CategoryTreeItem
 * @domain documents
 * @description Категория с вложенными детьми для отображения дерева категорий в UI
 *
 * @spec
 * - Рекурсивная структура: children содержит подкатегории того же типа
 * - Используется в CategoryTree компоненте и getTree() репозитория
 *
 * @traces US-22-01 AC-1, AC-2
 * @task DOCS-T2.1.1
 */
export interface CategoryTreeItem {
  id: string;
  name: string;
  description: string | null;
  children: CategoryTreeItem[];
}
