/**
 * Базовая ошибка репозитория.
 *
 * @remarks
 * Оборачивает ошибки Prisma в доменные ошибки.
 *
 * @public
 */
export class RepositoryError extends Error {
  public readonly operation: string;
  public readonly cause: string;

  constructor(operation: string, cause: string) {
    super(`Repository error [${operation}]: ${cause}`);
    this.name = 'RepositoryError';
    this.operation = operation;
    this.cause = cause;
    Object.setPrototypeOf(this, RepositoryError.prototype);
  }
}

/**
 * Ошибка «сущность не найдена» на уровне репозитория.
 *
 * @public
 */
export class RepositoryNotFoundError extends RepositoryError {
  public readonly entity: string;
  public readonly id: string;

  constructor(entity: string, id: string) {
    super(`${entity}.notFound`, `${entity} с ID ${id} не найден`);
    this.name = 'RepositoryNotFoundError';
    this.entity = entity;
    this.id = id;
    Object.setPrototypeOf(this, RepositoryNotFoundError.prototype);
  }
}

/**
 * Ошибка конфликта (дубликат) на уровне репозитория.
 *
 * @public
 */
export class RepositoryConflictError extends RepositoryError {
  public readonly field: string;
  public readonly reason: string;

  constructor(field: string, reason: string) {
    super(`${field}.conflict`, reason);
    this.name = 'RepositoryConflictError';
    this.field = field;
    this.reason = reason;
    Object.setPrototypeOf(this, RepositoryConflictError.prototype);
  }
}