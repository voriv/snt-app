/**
 * Базовый класс для доменных ошибок сервиса.
 *
 * @public
 */
export class ServiceError extends Error {
  public readonly errorCode: string;

  constructor(errorCode: string, message: string) {
    super(message);
    this.name = 'ServiceError';
    this.errorCode = errorCode;
    Object.setPrototypeOf(this, ServiceError.prototype);
  }
}

/**
 * Ошибка валидации входных данных.
 *
 * @public
 */
export class ValidationError extends ServiceError {
  public readonly field?: string;
  public readonly details?: unknown;

  constructor(field: string, message: string, details?: unknown) {
    super('VALIDATION_ERROR', message);
    this.name = 'ValidationError';
    this.field = field;
    this.details = details;
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

/**
 * Ошибка "ресурс не найден".
 *
 * @public
 */
export class NotFoundError extends ServiceError {
  public readonly entity: string;
  public readonly id: string;

  constructor(entity: string, id: string) {
    super('NOT_FOUND', `${entity} с ID ${id} не найден`);
    this.name = 'NotFoundError';
    this.entity = entity;
    this.id = id;
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }
}

/**
 * Ошибка конфликта данных (например, дубликат).
 *
 * @public
 */
export class ConflictError extends ServiceError {
  public readonly resource: string;
  public readonly reason: string;

  constructor(resource: string, reason: string) {
    super('CONFLICT', `${resource}: ${reason}`);
    this.name = 'ConflictError';
    this.resource = resource;
    this.reason = reason;
    Object.setPrototypeOf(this, ConflictError.prototype);
  }
}

/**
 * Ошибка бизнес-правила.
 *
 * @public
 */
export class BusinessRuleError extends ServiceError {
  public readonly rule: string;

  constructor(rule: string, message: string) {
    super('BUSINESS_RULE_ERROR', message);
    this.name = 'BusinessRuleError';
    this.rule = rule;
    Object.setPrototypeOf(this, BusinessRuleError.prototype);
  }
}

/**
 * Ошибка авторизации (недостаточно прав).
 *
 * @public
 */
export class ForbiddenError extends ServiceError {
  constructor(message = 'Доступ запрещён') {
    super('FORBIDDEN', message);
    this.name = 'ForbiddenError';
    Object.setPrototypeOf(this, ForbiddenError.prototype);
  }
}
