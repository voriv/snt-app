/**
 * @interface IAuthRepository
 * @domain auth
 * @description Контракт доступа к данным пользователей для аутентификации
 *
 * @spec
 * - Все методы асинхронные
 * - findByEmail возвращает null если пользователь не найден — НЕ бросает ошибку
 * - create может выбросить ошибку уникальности на уровне БД (P2002 Prisma)
 * - Работает с таблицей User в БД
 *
 * @see docs/model/entities/user.md — концептуальная модель User
 */
import type { UserData, UserWithPassword, CreateUserInput } from './auth.types';

export interface IAuthRepository {
  /**
   * Найти пользователя по email
   * @param email - Email пользователя
   * @returns UserData если найден, null если не найден
   *
   * @spec
   * - Возвращает UserData без поля password
   * - Возвращает null если пользователь не найден — НЕ бросает ошибку
   * - Используется для регистрации (проверка уникальности) и просмотра профиля
   */
  findByEmail(email: string): Promise<UserData | null>;

  /**
   * Найти пользователя по email с хешем пароля
   * @param email - Email пользователя
   * @returns UserWithPassword если найден, null если не найден
   *
   * @spec
   * - Возвращает UserData + passwordHash — полный объект с хешем пароля
   * - Возвращает null если пользователь не найден — НЕ бросает ошибку
   * - Используется ТОЛЬКО для верификации пароля при авторизации
   * - passwordHash никогда не покидает этот метод
   */
  findByEmailWithPassword(email: string): Promise<UserWithPassword | null>;

  /**
   * Создать нового пользователя
   *
   * @param data - Данные для создания: email, passwordHash, name
   * @returns Созданный пользователь без password
   * @throws Prisma P2002 при нарушении уникальности email
   *
   * @spec
   * - email уже должен быть приведён к lowercase и обрезан
   * - passwordHash уже должен быть захеширован через bcrypt
   * - Роль GUEST назначается в репозитории через user_roles (RBAC, US-8)
   */
  create(data: CreateUserInput): Promise<UserData>;
}
