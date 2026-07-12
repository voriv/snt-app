import { NotFoundError as BaseNotFoundError, ValidationError, ConflictError } from '@/shared/errors/index';

/**
 * @class PlotUserRoleNotFoundError
 * @domain plotUser
 * @description Ошибка: пользователь или участок не найден
 *
 * @spec
 * - HTTP 404 NotFound
 * - Сообщение: "Пользователь не найден" или "Участок не найден"
 *
 * @see AC-5.1, AC-5.2 (проверка существования)
 */
export class PlotUserRoleNotFoundError extends BaseNotFoundError {
  readonly name = 'PlotUserRoleNotFoundError';

  constructor(message: string) {
    // NotFoundError принимает (resource, id), но мы используем кастомное сообщение
    super('Record', message);
  }
}

/**
 * @class PlotUserRoleDuplicateError
 * @domain plotUser
 * @description Ошибка: активная связь уже существует
 *
 * @spec
 * - HTTP 409 Conflict
 * - Сообщение: "Для этого пользователя и участка уже существует активная связь"
 *
 * @see AC-5.3 (проверка дубликата)
 * @see BR-3 (уникальность активной связи)
 */
export class PlotUserRoleDuplicateError extends ConflictError {
  readonly name = 'PlotUserRoleDuplicateError';

  constructor(message: string = 'Для этого пользователя и участка уже существует активная связь') {
    super(message);
  }
}

/**
 * @class PlotUserRoleInvalidDataError
 * @domain plotUser
 * @description Ошибка: невалидные данные для создания/обновления связи
 *
 * @spec
 * - HTTP 400 Bad Request
 * - Сообщение: "Ошибка валидации: [поле] — [описание]"
 *
 * @see AC-5.4 (проверка expires_at)
 */
export class PlotUserRoleInvalidDataError extends ValidationError {
  readonly name = 'PlotUserRoleInvalidDataError';

  constructor(message: string) {
    super(message);
  }
}
