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

/**
 * @type GuestRoleMissingError
 * @domain auth
 * @description Системная роль GUEST отсутствует в БД — регистрация отклоняется
 *
 * @spec
 * - Наследуется от BusinessRuleError — HTTP 500
 * - Используется при отсутствии роли GUEST в БД
 * - Пользователь не создаётся, транзакция откатывается
 * - Сообщение на русском языке
 *
 * @see docs/user-stories/US-01-автоматическое-назначение-роли-GUEST-при-регистрации.md — AC-5
 */
import { BusinessRuleError } from '@/shared/errors/index';

export class GuestRoleMissingError extends BusinessRuleError {
  constructor() {
    super('Системная роль GUEST не найдена. Регистрация невозможна. Обратитесь к администратору.');
  }
}

/**
 * @type InvalidCurrentPasswordError
 * @domain auth
 * @description Ошибка неверного текущего пароля при смене пароля
 *
 * @spec
 * - Наследуется от BusinessRuleError
 * - Используется когда введённый текущий пароль не совпадает с хешем в БД
 * - Сообщение на русском языке
 *
 * @see docs/requirements/REQ-AUTH-001.md — BR-09, FR-10
 * @see docs/user-stories/US-12-активная-смена-пароля-пользователем.md
 */
export class InvalidCurrentPasswordError extends BusinessRuleError {
  constructor() {
    super('Неверный текущий пароль');
  }
}

/**
 * @type NewPasswordMatchesCurrentError
 * @domain auth
 * @description Ошибка: новый пароль совпадает с текущим
 *
 * @spec
 * - Наследуется от BusinessRuleError
 * - Используется когда новый пароль совпадает с текущим (запрещено бизнес-правилом)
 * - Сообщение на русском языке
 *
 * @see docs/requirements/REQ-AUTH-001.md — BR-10, FR-11
 * @see docs/user-stories/US-12-активная-смена-пароля-пользователем.md
 */
export class NewPasswordMatchesCurrentError extends BusinessRuleError {
  constructor() {
    super('Новый пароль не может совпадать с текущим');
  }
}
