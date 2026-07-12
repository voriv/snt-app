/**
 * @class AuthRepository
 * @domain auth
 * @description Реализация IAuthRepository через Prisma Client
 *
 * @spec
 * - Использует singleton Prisma Client из infrastructure/prisma/client.ts
 * - findByEmail возвращает null если пользователь не найден — НЕ бросает ошибку
 * - create может выбросить Prisma P2002 при нарушении уникальности email
 * - Превращает Prisma ошибку P2002 в UserDuplicateError на уровне сервиса
 * - Превращает GuestRoleMissingError из транзакции без изменений
 * - Превращает любую другую ошибку в UserInvalidDataError
 *
 * @see src/domains/auth/auth.repository.interface.ts — интерфейс
 */
import type { IAuthRepository } from './auth.repository.interface';
import type { UserData, UserWithPassword, CreateUserInput } from './auth.types';
import { prisma } from '@/infrastructure/prisma/client';
import { UserDuplicateError, UserInvalidDataError, GuestRoleMissingError } from './auth.errors';

export class AuthRepository implements IAuthRepository {
  /**
   * Найти пользователя по email
   * @param email - Email пользователя
   * @returns UserData если найден, null если не найден
   */
  async findByEmail(email: string): Promise<UserData | null> {
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  /**
   * Найти пользователя по email с хешем пароля
   *
   * @param email - Email пользователя
   * @returns UserWithPassword если найден, null если не найден
   *
   * @spec
   * - Включает поле password из БД — хеш bcrypt
   * - Возвращает null если пользователь не найден — НЕ бросает ошибку
   * - Используется ТОЛЬКО для верификации пароля при авторизации
   */
  async findByEmailWithPassword(email: string): Promise<UserWithPassword | null> {
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        password: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      passwordHash: user.password,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  /**
   * Создать нового пользователя
   *
   * @param data - Данные для создания: email, passwordHash, name
   * @returns Созданный пользователь без password
   * @throws {UserDuplicateError} если email уже существует
   * @throws {GuestRoleMissingError} если роль GUEST отсутствует в БД
   * @throws {UserInvalidDataError} при других ошибках создания
   *
   * @spec
   * - Создаёт пользователя и назначает ему системную роль GUEST в одной транзакции (RBAC, US-8, US-01)
   * - Роль GUEST ищется по name в таблице roles
   * - Если роль GUEST отсутствует — выбрасывает GuestRoleMissingError ВНУТРИ транзакции (AC-5, US-01)
   * - Транзакция полностью откатывается при отсутствии роли GUEST — пользователь не создаётся
   * - При Prisma P2002 для email — выбрасывает UserDuplicateError
   * - При Prisma P2002 для user_roles (idempotency) — выбрасывает UserInvalidDataError
   * - Любая другая ошибка преобразуется в UserInvalidDataError
   */
  async create(data: CreateUserInput): Promise<UserData> {
    try {
      const result = await prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: {
            email: data.email,
            password: data.passwordHash,
            name: data.name,
          },
          select: {
            id: true,
            email: true,
            name: true,
            createdAt: true,
            updatedAt: true,
          },
        });

        // Поиск системной роли GUEST
        const guestRole = await tx.role.findUnique({
          where: { name: 'GUEST' },
          select: { id: true },
        });

        // AC-5: Если роль GUEST отсутствует — откатить транзакцию
        if (!guestRole) {
          throw new GuestRoleMissingError();
        }

        // Назначение системной роли GUEST новому пользователю (RBAC, US-8)
        await tx.userRole.create({
          data: {
            userId: user.id,
            roleId: guestRole.id,
          },
        });

        return user;
      });

      return {
        id: result.id,
        email: result.email,
        name: result.name,
        createdAt: result.createdAt,
        updatedAt: result.updatedAt,
      };
    } catch (error) {
      // GuestRoleMissingError — пробрасываем без изменений
      if (error instanceof GuestRoleMissingError) {
        throw error;
      }

      // Prisma P2002 - уникальное ограничение нарушено (email уже существует)
      const prismaError = error as { code?: string; meta?: { target?: string[] } };
      if (prismaError.code === 'P2002' && prismaError.meta?.target?.includes('email')) {
        throw new UserDuplicateError(data.email);
      }

      // Любая другая ошибка преобразуется в UserInvalidDataError
      console.error('AuthRepository.create error:', error);
      throw new UserInvalidDataError('Ошибка при создании пользователя');
    }
  }
}
