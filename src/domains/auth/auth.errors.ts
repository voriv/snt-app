/**
 * @type UserDuplicateError
 * @domain auth
 * @description Ошибка дублирования email при регистрации
 *
 * @spec
 * - Наследуется от ConflictError — HTTP 409
 * - Используется когда email уже зарегистрирован в системе
 *
 * @see docs/user-stories/US-2-registration.md — Edge Case 1, таблица ошибок
 */
import { ConflictError } from '@/shared/errors/index';

export class UserDuplicateError extends ConflictError {
  constructor(email: string) {
    super(`Пользователь с email ${email} уже зарегистрирован`);
  }
}

/**
 * @type UserInvalidDataError
 * @domain auth
 * @description Ошибка валидации данных регистрации
 *
 * @spec
 * - Наследуется от ValidationError — HTTP 400
 * - Используется при невалидном email, коротком пароле, несовпадении паролей
 * - message содержит конкретную причину ошибки на русском языке
 *
 * @see docs/user-stories/US-2-registration.md — BR-1..BR-4, таблица ошибок
 */
import { ValidationError } from '@/shared/errors/index';

export class UserInvalidDataError extends ValidationError {
  constructor(message: string) {
    super(message);
  }
}

/**
 * @type InvalidCredentialsError
 * @domain auth
 * @description Ошибка неверных учётных данных при входе
 *
 * @spec
 * - Наследуется от UnauthorizedError — HTTP 401
 * - Используется при неверном email или пароле
 * - Сообщение общее — не раскрывает, что именно неверно: email или пароль
 * - Это предотвращает перебор email-адресов (BR-3)
 *
 * @see docs/user-stories/US-3-authentication.md — FR-4, BR-3, таблица ошибок
 */
import { UnauthorizedError } from '@/shared/errors/index';

export class InvalidCredentialsError extends UnauthorizedError {
  constructor() {
    super('Неверный email или пароль');
  }
}
