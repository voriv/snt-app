/**
 * @service AuthService
 * @domain auth
 * @description Бизнес-логика регистрации и аутентификации пользователей
 *
 * @spec
 * - Валидация: через Zod-схемы из auth.validators.ts
 * - Ошибки: GuestRoleMissingError, UserDuplicateError, UserInvalidDataError, InvalidCredentialsError
 * - Зависимости: IAuthRepository через DI
 */
import type { IAuthRepository } from './auth.repository.interface';
import { AuthRepository } from './auth.repository.prisma';
import type { RegisterData, UserData, LoginData, UserWithPassword } from './auth.types';
import { registerSchema, loginSchema, changePasswordSchema } from './auth.validators';
import { GuestRoleMissingError, UserDuplicateError, UserInvalidDataError, InvalidCredentialsError, InvalidCurrentPasswordError, NewPasswordMatchesCurrentError } from './auth.errors';
import { ZodError } from 'zod';
import bcrypt from 'bcryptjs';

/** Количество раундов salt для bcrypt */
const BCRYPT_SALT_ROUNDS = 10;

/**
 * Сервис аутентификации
 */
export class AuthService {
  constructor(private readonly repository: IAuthRepository = new AuthRepository()) {}

  /**
   * Зарегистрировать нового пользователя
   *
   * @param data - Данные регистрации: email, password, confirmPassword
   * @returns Созданный пользователь без пароля
   * @throws {GuestRoleMissingError} если роль GUEST отсутствует в БД
   * @throws {UserInvalidDataError} при ошибке валидации
   * @throws {UserDuplicateError} если email уже зарегистрирован
   *
   * @spec
   * - Шаг 1: Валидация данных через registerSchema — Zod
   * - Шаг 2: Приведение email к нижнему регистру и обрезка пробелов
   * - Шаг 3: Хеширование пароля через bcrypt.hash — salt rounds = 10
   * - Шаг 4: Проверка уникальности email через repository.findByEmail
   * - Шаг 5: Создание пользователя через repository.create (роль GUEST назначается в репозитории в транзакции)
   * - При нарушении уникальности email на уровне БД — преобразует в UserDuplicateError
   * - При отсутствии роли GUEST — выбрасывает GuestRoleMissingError (AC-5, US-01)
   * - Транзакция откатывается полностью — пользователь без роли не создаётся
   * - При любой другой ошибке — UserInvalidDataError
   * - Пароль никогда не возвращается в ответе
   *
   * @see docs/user-stories/US-2-registration.md — FR-4..FR-7
   * @see docs/user-stories/US-01-автоматическое-назначение-роли-GUEST-при-регистрации.md — AC-1..AC-5
   */
  async registerUser(data: unknown): Promise<UserData> {
    try {
      // Валидация данных
      const validatedData = registerSchema.parse(data);

      const email = validatedData.email.toLowerCase().trim();
      const passwordHash = await bcrypt.hash(validatedData.password, BCRYPT_SALT_ROUNDS);

      // Проверка уникальности email
      const existingUser = await this.repository.findByEmail(email);
      if (existingUser) {
        throw new UserDuplicateError(email);
      }

      // Создание пользователя с автоматическим назначением роли GUEST (US-01)
      return this.repository.create({
        email,
        passwordHash,
        name: null,
      });
    } catch (error) {
      if (error instanceof GuestRoleMissingError || error instanceof UserDuplicateError || error instanceof UserInvalidDataError) {
        throw error;
      }

      if (error instanceof Error) {
        throw new UserInvalidDataError(error.message);
      }

      throw new UserInvalidDataError('Ошибка при регистрации');
    }
  }

  /**
   * Верифицировать учётные данные пользователя
   *
   * @param data - Данные входа: email и password
   * @returns UserData при успешной верификации
   * @throws {InvalidCredentialsError} если пользователь не найден или пароль неверный (HTTP 401)
   * @throws {UserInvalidDataError} при ошибке валидации формата полей (HTTP 400)
   *
   * @spec
   * - Шаг 1: Валидация данных через loginSchema — Zod
   * - Шаг 2: Приведение email к нижнему регистру и обрезка пробелов
   * - Шаг 3: Поиск пользователя через repository.findByEmailWithPassword
   * - Шаг 4: Если пользователь не найден — InvalidCredentialsError — общее сообщение
   * - Шаг 5: Сравнение пароля через bcrypt.compare — никогда не расшифровывается
   * - Шаг 6: Если пароль неверный — InvalidCredentialsError — общее сообщение
   * - Возвращает UserData без пароля — пароль никогда не покидает метод
   * - Безопасность: одинаковое сообщение для «email не найден» и «пароль неверный»
   * - Разделение ошибок (AC-2.4, BR-03):
   *   - Zod-ошибка формата → UserInvalidDataError с конкретным сообщением (HTTP 400)
   *   - Неверные учётные данные → InvalidCredentialsError «Неверный email или пароль» (HTTP 401)
   *   - Прочие ошибки (БД, bcrypt) → UserInvalidDataError «Ошибка при входе»
   *
   * @see docs/user-stories/US-3-authentication.md — FR-1, BR-3, BR-4, Edge Cases 1,2,7
   */
  async verifyCredentials(data: unknown): Promise<UserData> {
    try {
      // Валидация данных
      const validatedData = loginSchema.parse(data);

      const email = validatedData.email.toLowerCase().trim();

      // Поиск пользователя с хешем пароля
      const user = await this.repository.findByEmailWithPassword(email);
      if (!user) {
        throw new InvalidCredentialsError();
      }

      // Сравнение пароля
      const isValidPassword = await bcrypt.compare(validatedData.password, user.passwordHash);
      if (!isValidPassword) {
        throw new InvalidCredentialsError();
      }

      // Возврат UserData без password
      const { passwordHash, ...userData } = user;
      return userData;
    } catch (error) {
      // Доменные ошибки перебрасываются как есть
      if (error instanceof InvalidCredentialsError || error instanceof UserInvalidDataError) {
        throw error;
      }

      // Zod-ошибка валидации формата → UserInvalidDataError с конкретным сообщением (HTTP 400)
      // AC-2.4: сообщение НЕ маскируется под «Неверный email или пароль» — это ошибка формата
      if (error instanceof ZodError) {
        const firstIssue = error.issues[0];
        throw new UserInvalidDataError(firstIssue?.message ?? 'Некорректные данные');
      }

      // Прочие ошибки (БД недоступна, сбой bcrypt и т.д.) → общая ошибка
      throw new UserInvalidDataError('Ошибка при входе');
    }
  }

  /**
   * Сменить пароль пользователя
   *
   * @param email - Email текущего пользователя (из сессии)
   * @param data - Данные смены пароля: currentPassword, newPassword, confirmPasswordNew
   * @returns void
   * @throws {UserInvalidDataError} при ошибке валидации входных данных
   * @throws {InvalidCurrentPasswordError} если текущий пароль неверный
   * @throws {NewPasswordMatchesCurrentError} если новый пароль совпадает с текущим
   *
   * @spec
   * - Шаг 1: Валидация данных через changePasswordSchema — Zod (AC-9.4, AC-9.5)
   * - Шаг 2: Найти пользователя с хешем пароля через repository.findByEmailWithPassword
   * - Шаг 3: Если пользователь не найден — UserNotFoundError / UserInvalidDataError
   * - Шаг 4: Проверить текущий пароль через bcrypt.compare (AC-9.2)
   * - Шаг 5: Проверить что новый пароль ≠ текущий через bcrypt.compare (AC-9.3)
   * - Шаг 6: Захэшировать новый пароль через bcrypt.hash — salt rounds = 10
   * - Шаг 7: Сохранить новый хеш через repository.updatePassword (AC-9.1)
   * - Шаг 8: Сессии сохраняются — ничего не делаем (BR-11)
   *
   * @covers AC-9.1
   * @covers AC-9.2
   * @covers AC-9.3
   * @covers AC-9.4
   * @covers AC-9.5
   *
   * @see docs/requirements/REQ-AUTH-001.md — BR-08..BR-12, FR-09..FR-12
   * @see docs/user-stories/US-12-активная-смена-пароля-пользователем.md
   */
  async changePassword(email: string, data: unknown): Promise<void> {
    try {
      // Шаг 1: Валидация входных данных через Zod-схему
      const validated = changePasswordSchema.parse(data);

      // Шаг 2: Найти пользователя с хешем пароля
      const user = await this.repository.findByEmailWithPassword(email);
      if (!user) {
        throw new UserInvalidDataError('Пользователь не найден');
      }

      // Шаг 4: Проверить текущий пароль
      const currentValid = await bcrypt.compare(validated.currentPassword, user.passwordHash);
      if (!currentValid) {
        throw new InvalidCurrentPasswordError();
      }

      // Шаг 5: Проверить что новый пароль ≠ текущий
      const samePassword = await bcrypt.compare(validated.newPassword, user.passwordHash);
      if (samePassword) {
        throw new NewPasswordMatchesCurrentError();
      }

      // Шаг 6: Захэшировать новый пароль
      const newHash = await bcrypt.hash(validated.newPassword, BCRYPT_SALT_ROUNDS);

      // Шаг 7: Сохранить в БД
      await this.repository.updatePassword(user.id, newHash);

      // Шаг 8: Сессии сохраняются (BR-11) — ничего не делаем
    } catch (error) {
      // Доменные ошибки перебрасываются как есть
      if (
        error instanceof InvalidCurrentPasswordError ||
        error instanceof NewPasswordMatchesCurrentError ||
        error instanceof UserInvalidDataError
      ) {
        throw error;
      }

      // Zod-ошибка валидации → UserInvalidDataError с конкретным сообщением
      if (error instanceof ZodError) {
        const firstIssue = error.issues[0];
        throw new UserInvalidDataError(firstIssue?.message ?? 'Некорректные данные');
      }

      // Прочие ошибки (БД, bcrypt) → общая ошибка
      throw new UserInvalidDataError('Ошибка при смене пароля');
    }
  }
}
