/**
 * @service AuthService
 * @domain auth
 * @description Бизнес-логика регистрации и аутентификации пользователей
 *
 * @spec
 * - Валидация: через Zod-схемы из auth.validators.ts
 * - Ошибки: UserDuplicateError, UserInvalidDataError, InvalidCredentialsError
 * - Зависимости: IAuthRepository через DI
 */
import type { IAuthRepository } from './auth.repository.interface';
import { AuthRepository } from './auth.repository.prisma';
import type { RegisterData, UserData, LoginData, UserWithPassword } from './auth.types';
import { registerSchema, loginSchema } from './auth.validators';
import { UserDuplicateError, UserInvalidDataError, InvalidCredentialsError } from './auth.errors';
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
   * @throws {UserInvalidDataError} при ошибке валидации
   * @throws {UserDuplicateError} если email уже зарегистрирован
   *
   * @spec
   * - Шаг 1: Валидация данных через registerSchema — Zod
   * - Шаг 2: Приведение email к нижнему регистру и обрезка пробелов
   * - Шаг 3: Хеширование пароля через bcrypt.hash — salt rounds = 10
   * - Шаг 4: Проверка уникальности email через repository.findByEmail
   * - Шаг 5: Создание пользователя через repository.create (роль GUEST назначается в репозитории, US-8)
   * - При нарушении уникальности email на уровне БД — преобразует в UserDuplicateError
   * - При любой другой ошибке — UserInvalidDataError
   * - Пароль никогда не возвращается в ответе
   *
   * @see docs/user-stories/US-2-registration.md — FR-4..FR-7
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

      // Создание пользователя (роль GUEST назначается в репозитории, US-8)
      return this.repository.create({
        email,
        passwordHash,
        name: null,
      });
    } catch (error) {
      if (error instanceof UserDuplicateError || error instanceof UserInvalidDataError) {
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
   * @throws {InvalidCredentialsError} если пользователь не найден или пароль неверный
   * @throws {UserInvalidDataError} при ошибке валидации
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
      if (error instanceof InvalidCredentialsError || error instanceof UserInvalidDataError) {
        throw error;
      }

      if (error instanceof Error) {
        throw new UserInvalidDataError('Ошибка при входе');
      }

      throw new UserInvalidDataError('Ошибка при входе');
    }
  }
}
