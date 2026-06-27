import type { User } from '@prisma/client';

/**
 * Интерфейс репозитория пользователя.
 *
 * @public
 */
export interface UserRepository {
  /**
   * Находит пользователя по email.
   * @param email - Email пользователя
   * @returns Пользователь или null
   */
  findByEmail(email: string): Promise<User | null>;

  /**
   * Находит пользователя по ID.
   * @param id - ID пользователя
   * @returns Пользователь или null
   */
  findById(id: string): Promise<User | null>;

  /**
   * Создаёт нового пользователя.
   * @param data - Данные для создания
   * @returns Созданный пользователь
   */
  create(data: CreateUserInput): Promise<User>;

  /**
   * Обновляет пользователя.
   * @param id - ID пользователя
   * @param data - Данные для обновления
   * @returns Обновлённый пользователь
   */
  update(id: string, data: UpdateUserInput): Promise<User>;

  /**
   * Сохраняет токен сброса пароля.
   * @param userId - ID пользователя
   * @param resetToken - Токен
   * @param resetTokenExp - Время истечения
   * @returns Обновлённый пользователь
   */
  saveResetToken(
    userId: string,
    resetToken: string,
    resetTokenExp: Date,
  ): Promise<User>;

  /**
   * Очищает токен сброса пароля (после использования).
   * @param userId - ID пользователя
   * @returns Обновлённый пользователь
   */
  clearResetToken(userId: string): Promise<User>;
}

/**
 * Входные данные для создания пользователя.
 *
 * @public
 */
export interface CreateUserInput {
  email: string;
  passwordHash: string;
  role?: string;
  isActive?: boolean;
  name?: string | null;
  phone?: string | null;
  avatarUrl?: string | null;
}

/**
 * Входные данные для обновления пользователя.
 *
 * @public
 */
export interface UpdateUserInput {
  name?: string | null;
  phone?: string | null;
  avatarUrl?: string | null;
  passwordHash?: string;
  emailVerified?: Date | null;
}
