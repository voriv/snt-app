import { prisma } from '@/lib/prisma';
import type {
  CreateUserInput,
  UpdateUserInput,
  UserRepository as UserRepositoryInterface,
} from './user-repository.interface';
import type { User } from '@prisma/client';
import { RepositoryError, NotFoundError, ConflictError } from './_lib/errors';

/**
 * Реализация репозитория пользователя через Prisma.
 *
 * @public
 */
export class UserRepository implements UserRepositoryInterface {
  async findByEmail(email: string): Promise<User | null> {
    try {
      const user = await prisma.user.findUnique({
        where: { email },
        include: {
          member: true,
        },
      });
      return user;
    } catch (error) {
      throw new RepositoryError('Failed to fetch user by email', String(error));
    }
  }

  async findById(id: string): Promise<User | null> {
    try {
      const user = await prisma.user.findUnique({
        where: { id },
        include: {
          member: true,
        },
      });
      return user;
    } catch (error) {
      throw new RepositoryError('Failed to fetch user by id', String(error));
    }
  }

  async create(data: CreateUserInput): Promise<User> {
    try {
      const user = await prisma.user.create({
        data: {
          email: data.email,
          passwordHash: data.passwordHash,
          role: (data.role ?? 'MEMBER') as any,
          name: data.name,
          phone: data.phone,
          avatarUrl: data.avatarUrl,
        },
      });
      return user;
    } catch (error) {
      if ((error as any).code === 'P2002') {
        throw new ConflictError('user-email', 'Пользователь с таким email уже существует');
      }
      throw new RepositoryError('Failed to create user', String(error));
    }
  }

  async update(id: string, data: UpdateUserInput): Promise<User> {
    try {
      const user = await prisma.user.update({
        where: { id },
        data,
      });
      return user;
    } catch (error) {
      if ((error as any).code === 'P2025') {
        throw new NotFoundError('User', id);
      }
      throw new RepositoryError('Failed to update user', String(error));
    }
  }

  async saveResetToken(
    userId: string,
    resetToken: string,
    resetTokenExp: Date,
  ): Promise<User> {
    try {
      const user = await prisma.user.update({
        where: { id: userId },
        data: { resetToken, resetTokenExp },
      });
      return user;
    } catch (error) {
      if ((error as any).code === 'P2025') {
        throw new NotFoundError('User', userId);
      }
      throw new RepositoryError('Failed to save reset token', String(error));
    }
  }

  async clearResetToken(userId: string): Promise<User> {
    try {
      const user = await prisma.user.update({
        where: { id: userId },
        data: { resetToken: null, resetTokenExp: null },
      });
      return user;
    } catch (error) {
      if ((error as any).code === 'P2025') {
        throw new NotFoundError('User', userId);
      }
      throw new RepositoryError('Failed to clear reset token', String(error));
    }
  }
}
