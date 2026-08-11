import { NotFoundError } from '@/shared/errors/NotFoundError';
import { ConflictError } from '@/shared/errors/ConflictError';

/**
 * @error CategoryNotFoundError
 * @domain documents
 * @description Ошибка, когда категория документа не найдена по ID
 *
 * @spec
 * - Возвращается при findById, delete, если категория не существует
 * - HTTP 404
 *
 * @traces US-22-01 AC-5, US-22-02 AC-5
 * @task DOCS-T2.3.1
 */
export class CategoryNotFoundError extends NotFoundError {
  constructor(id: string) {
    super('Категория', id);
    this.name = 'CategoryNotFoundError';
  }
}

/**
 * @error CategoryNameNotUniqueError
 * @domain documents
 * @description Ошибка, когда категория с таким именем уже существует на том же уровне иерархии
 *
 * @spec
 * - Проверка по составному ключу (name, parentId)
 * - HTTP 409
 *
 * @traces US-22-01 AC-4
 * @task DOCS-T2.3.1
 */
export class CategoryNameNotUniqueError extends ConflictError {
  constructor(name: string, parentId: string | null) {
    const parentMsg = parentId ? `в родительской категории ${parentId}` : 'на корневом уровне';
    super(`Категория с таким названием уже существует ${parentMsg}`);
    this.name = 'CategoryNameNotUniqueError';
  }
}

/**
 * @error ParentCategoryNotFoundError
 * @domain documents
 * @description Ошибка, когда указанная родительская категория не найдена
 *
 * @spec
 * - Проверка существования parentId перед созданием подкатегории
 * - HTTP 404
 *
 * @traces US-22-01 AC-5
 * @task DOCS-T2.3.1
 */
export class ParentCategoryNotFoundError extends NotFoundError {
  constructor(parentId: string) {
    super('Родительская категория', parentId);
    this.name = 'ParentCategoryNotFoundError';
  }
}
