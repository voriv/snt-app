/**
 * @file users.errors.ts
 * @domain users
 * @description Доменные ошибки управления пользователями
 *
 * @spec
 * - Все ошибки наследуются от базовых классов в @/shared/errors
 *
 * @see docs/user-stories/US-20-01-просмотр-списка-пользователей.md
 */
import { ForbiddenError, NotFoundError } from '@/shared/errors';

/**
 * @class UsersAccessForbiddenError
 * @domain users
 * @description Доступ к списку пользователей запрещён — HTTP 403
 *
 * @throws HTTP 403
 */
export class UsersAccessForbiddenError extends ForbiddenError {
  readonly name = 'UsersAccessForbiddenError';

  constructor(message: string = 'Доступ запрещен. Только супер-администратор может просматривать список пользователей.') {
    super(message);
  }
}

/**
 * @class UserNotFoundError
 * @domain users
 * @description Пользователь не найден — HTTP 404
 *
 * @throws HTTP 404
 */
export class UserNotFoundError extends NotFoundError {
  readonly name = 'UserNotFoundError';

  constructor(userId: string) {
    super('Пользователь', userId, 'USER_NOT_FOUND');
  }
}
