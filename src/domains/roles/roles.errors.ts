/**
 * @file roles.errors.ts
 * @domain roles
 * @description Доменные ошибки управления ролями, страницами, API endpoints и доступом
 *
 * @spec
 * - Все ошибки наследуются от базовых классов в @/shared/errors
 * - Каждая ошибка соответствует строке в таблице «Обработка ошибок» US-8
 *
 * @see docs/user-stories/US-8-roles-management.md — секция «Обработка ошибок»
 */
import { NotFoundError, ConflictError, ForbiddenError, ValidationError, BusinessRuleError } from '@/shared/errors/index';

/**
 * @class GuestRoleNotFoundError
 * @domain roles
 * @description Системная роль GUEST не найдена в БД — регистрация невозможна
 * @throws HTTP 500
 */
export class GuestRoleNotFoundError extends BusinessRuleError {
  readonly name = 'GuestRoleNotFoundError';
  constructor() {
    super('Системная роль GUEST не найдена в базе данных. Обратитесь к администратору.');
  }
}

/**
 * @class RoleNotFoundError
 * @description Роль не найдена — HTTP 404
 */
export class RoleNotFoundError extends NotFoundError {
  readonly name = 'RoleNotFoundError';
  constructor(id: string) {
    super('Role', id, 'ROLE_NOT_FOUND');
  }
}

/**
 * @class RoleDuplicateError
 * @description Роль с таким именем уже существует — HTTP 409
 */
export class RoleDuplicateError extends ConflictError {
  constructor(name: string) {
    super(`Роль с именем "${name}" уже существует`);
  }
}

/**
 * @class RoleSystemProtectedError
 * @description Системную роль нельзя удалить или переименовать — HTTP 403
 */
export class RoleSystemProtectedError extends ForbiddenError {
  constructor(roleName: string) {
    super(`Системную роль "${roleName}" нельзя удалить или переименовать`);
  }
}

/**
 * @class LastSuperAdminError
 * @description Попытка удалить/исключить последнего SUPER_ADMIN — HTTP 409
 */
export class LastSuperAdminError extends ConflictError {
  constructor(message: string = 'Нельзя удалить последнего SUPER_ADMIN') {
    super(message);
  }
}

/**
 * @class RoleInvalidDataError
 * @description Неверные данные роли — HTTP 400
 */
export class RoleInvalidDataError extends ValidationError {
  constructor(message: string) {
    super(`Неверные данные роли: ${message}`);
  }
}

/**
 * @class PageNotFoundError
 * @description Страница не найдена — HTTP 404
 */
export class PageNotFoundError extends NotFoundError {
  readonly name = 'PageNotFoundError';
  constructor(id: string) {
    super('Page', id, 'PAGE_NOT_FOUND');
  }
}

/**
 * @class PageDuplicateError
 * @description Страница с таким путём уже существует — HTTP 409
 */
export class PageDuplicateError extends ConflictError {
  constructor(path: string) {
    super(`Страница с путём "${path}" уже существует`);
  }
}

/**
 * @class PageInvalidDataError
 * @description Неверные данные страницы — HTTP 400
 */
export class PageInvalidDataError extends ValidationError {
  constructor(message: string) {
    super(`Неверные данные страницы: ${message}`);
  }
}

/**
 * @class ApiEndpointNotFoundError
 * @description API endpoint не найден — HTTP 404
 */
export class ApiEndpointNotFoundError extends NotFoundError {
  readonly name = 'ApiEndpointNotFoundError';
  constructor(id: string) {
    super('ApiEndpoint', id, 'API_ENDPOINT_NOT_FOUND');
  }
}

/**
 * @class ApiEndpointDuplicateError
 * @description Endpoint с такой комбинацией method+path уже существует — HTTP 409
 */
export class ApiEndpointDuplicateError extends ConflictError {
  constructor(method: string, path: string) {
    super(`Endpoint ${method} ${path} уже существует`);
  }
}

/**
 * @class ApiEndpointInvalidDataError
 * @description Неверные данные API endpoint — HTTP 400
 */
export class ApiEndpointInvalidDataError extends ValidationError {
  constructor(message: string) {
    super(`Неверные данные API endpoint: ${message}`);
  }
}
