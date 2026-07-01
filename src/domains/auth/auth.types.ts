/**
 * @type RegisterData
 * @domain auth
 * @description Данные для регистрации нового пользователя
 *
 * @spec
 * - Email: обязателен, приводится к нижнему регистру, обрезаются пробелы
 * - Пароль: обязателен, минимум 6 символов, пробелы в начале/конце НЕ обрезаются
 * - Подтверждение пароля: обязателено, должно совпадать с паролем
 *
 * @see docs/user-stories/US-2-registration.md — BR-1..BR-4
 */
export interface RegisterData {
  /** Email пользователя. Обязателен. Приводится к lowercase, обрезаются пробелы */
  email: string;
  /** Пароль. Обязателен, минимум 6 символов. Пробелы — часть пароля */
  password: string;
  /** Подтверждение пароля. Обязателено, должно совпадать с password */
  confirmPassword: string;
}

/**
 * @type UserData
 * @domain auth
 * @description Данные пользователя, возвращаемые после регистрации. Без пароля
 *
 * @spec
 * - Пароль никогда не включается в ответ API
 * - Роли пользователя определяются через таблицу user_roles (RBAC, US-8)
 * - name — null при регистрации, заполняется позже через профиль
 *
 * @see docs/model/entities/user.md — концептуальная модель User
 */
export interface UserData {
  /** Уникальный идентификатор. Генерируется автоматически cuid */
  id: string;
  /** Email пользователя. Уникальный в системе */
  email: string;
  /** Имя пользователя. null при регистрации */
  name: string | null;
  /** Дата создания учётной записи */
  createdAt: Date;
  /** Дата последнего обновления */
  updatedAt: Date;
}

/**
 * @type CreateUserInput
 * @domain auth
 * @description Внутренний тип для создания пользователя в БД. Содержит хеш пароля
 *
 * @spec
 * - Используется только внутри репозитория, не экспортируется в API
 * - passwordHash — результат bcrypt.hash
 * - email — уже lowercase и обрезан
 * - Роли назначаются через user_roles (RBAC, US-8), не при создании пользователя
 */
export interface CreateUserInput {
  /** Email. Уже приведён к lowercase, пробелы обрезаны */
  email: string;
  /** Хеш пароля. bcrypt hash с salt rounds = 10 */
  passwordHash: string;
  /** Имя. null при регистрации */
  name: null;
}

/**
 * @type UserWithPassword
 * @domain auth
 * @description Данные пользователя с хешем пароля. Используется только внутри домена auth для верификации
 *
 * @spec
 * - Расширяет UserData полем passwordHash — хеш пароля bcrypt
 * - Никогда не передаётся за пределы домена auth — не экспортируется через index.ts
 * - Используется в AuthRepository.findByEmailWithPassword и AuthService.verifyCredentials
 * - passwordHash — результат bcrypt.hash с salt rounds = 10
 *
 * @see docs/model/entities/user.md — поле password в концептуальной модели
 */
export interface UserWithPassword extends UserData {
  /** Хеш пароля. bcrypt hash, никогда не передаётся клиенту */
  passwordHash: string;
}

/**
 * @type LoginData
 * @domain auth
 * @description Данные для входа в систему — email и пароль
 *
 * @spec
 * - Email: обязателен, приводится к нижнему регистру, обрезаются пробелы
 * - Пароль: обязателен, пробелы в начале/конце НЕ обрезаются — часть пароля
 * - Валидация через loginSchema в auth.validators.ts
 *
 * @see docs/user-stories/US-3-authentication.md — BR-1, BR-2
 */
export interface LoginData {
  /** Email пользователя. Обязателен. Приводится к lowercase, обрезаются пробелы */
  email: string;
  /** Пароль. Обязателен. Пробелы — часть пароля */
  password: string;
}
