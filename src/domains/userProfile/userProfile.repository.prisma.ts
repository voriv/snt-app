import { prisma } from '@/infrastructure/prisma/client';
import type { IUserProfileRepository } from './userProfile.repository.interface';
import type { UserProfileData, CreateUserProfileInput, UpdateUserProfileInput, UserProfileFull, Theme } from './userProfile.types';
import { ProfileRepositoryError } from './userProfile.errors';

/**
 * @service UserProfileRepository
 * @domain userProfile
 * @description Реализация репозитория для профиля пользователя
 *
 * @spec
 * - Использует Prisma Client для доступа к БД
 * - Все ошибки БД перехватываются и преобразуются в ProfileRepositoryError
 * - Маппинг полей: snake_case (БД/Prisma) <-> camelCase (доменные типы)
 */
export class UserProfileRepository implements IUserProfileRepository {
  /**
   * Найти профиль по ID
   * @param id - Уникальный идентификатор профиля
   * @returns Профиль пользователя или null если не найден
   */
  async findById(id: string): Promise<UserProfileData | null> {
    try {
      const profile = await prisma.userProfile.findUnique({
        where: { id },
      });
      return this.mapToDomain(profile);
    } catch (error) {
      throw new ProfileRepositoryError(
        `Error finding profile by id: ${id} - ${error}`
      );
    }
  }

  /**
   * Найти профиль по ID пользователя
   * @param userId - Уникальный идентификатор пользователя
   * @returns Профиль пользователя или null если не найден
   */
  async findByUserId(userId: string): Promise<UserProfileData | null> {
    try {
      const profile = await prisma.userProfile.findUnique({
        where: { user_id: userId },
      });
      return this.mapToDomain(profile);
    } catch (error) {
      throw new ProfileRepositoryError(
        `Error finding profile by userId: ${userId} - ${error}`
      );
    }
  }

  /**
   * Получить все профили пользователей
   * @returns Массив всех профилей
   */
  async findAll(): Promise<UserProfileData[]> {
    try {
      const profiles = await prisma.userProfile.findMany();
      return profiles.map(this.mapToDomain).filter(Boolean) as UserProfileData[];
    } catch (error) {
      throw new ProfileRepositoryError(`Error finding all profiles: ${error}`);
    }
  }

  /**
   * Создать новый профиль пользователя
   * @param data - Данные для создания профиля с userId
   * @returns Созданный профиль
   * @throws при дублировании
   */
  async create(data: CreateUserProfileInput & { userId: string; theme?: string }): Promise<UserProfileData> {
    try {
      const profile = await prisma.userProfile.create({
        data: {
          user_id: data.userId,
          first_name: data.firstName,
          middle_name: data.middleName,
          last_name: data.lastName,
          phone: data.phone,
          bio: data.bio,
          theme: data.theme || 'light',
        },
      });
      return this.mapToDomainRequired(profile);
    } catch (error) {
      if ((error as { code?: string })?.code === 'P2002') {
        throw new ProfileRepositoryError(
          `Duplicate entry for profile: ${error}`
        );
      }
      throw new ProfileRepositoryError(
        `Error creating profile: ${error}`
      );
    }
  }

  /**
   * Обновить профиль пользователя
   * @param id - Уникальный идентификатор профиля
   * @param data - Данные для обновления
   * @returns Обновленный профиль
   */
  async update(id: string, data: UpdateUserProfileInput): Promise<UserProfileData> {
    try {
      const profile = await prisma.userProfile.update({
        where: { id },
        data: {
          first_name: data.firstName,
          middle_name: data.middleName,
          last_name: data.lastName,
          phone: data.phone,
          bio: data.bio,
          avatar: data.avatar,
        },
      });
      return this.mapToDomainRequired(profile);
    } catch (error) {
      if ((error as { code?: string })?.code === 'P2025') {
        throw new ProfileRepositoryError(
          `Profile not found with id: ${id} - ${error}`
        );
      }
      throw new ProfileRepositoryError(
        `Error updating profile: ${error}`
      );
    }
  }

  /**
   * Обновить тему оформления пользователя
   * @param userId - Уникальный идентификатор пользователя
   * @param theme - Новая тема оформления
   * @returns Обновленная тема
   */
  async updateTheme(userId: string, theme: Theme): Promise<Theme> {
    try {
      const profile = await prisma.userProfile.update({
        where: { user_id: userId },
        data: { theme },
      });
      return profile.theme;
    } catch (error) {
      if ((error as { code?: string })?.code === 'P2025') {
        throw new ProfileRepositoryError(
          `Profile not found with userId: ${userId} - ${error}`
        );
      }
      throw new ProfileRepositoryError(
        `Error updating theme: ${error}`
      );
    }
  }

  /**
   * Удалить профиль пользователя
   * @param id - Уникальный идентификатор профиля
   */
  async delete(id: string): Promise<void> {
    try {
      await prisma.userProfile.delete({
        where: { id },
      });
    } catch (error) {
      if ((error as { code?: string })?.code === 'P2025') {
        throw new ProfileRepositoryError(
          `Profile not found with id: ${id} - ${error}`
        );
      }
      throw new ProfileRepositoryError(
        `Error deleting profile: ${error}`
      );
    }
  }

  /**
   * Найти или создать профиль вместе с данными пользователя
   * @param userId - Уникальный идентификатор пользователя
   * @returns Агрегированный профиль пользователя
   */
  async findOrCreateWithUser(userId: string): Promise<UserProfileFull> {
    try {
      // Пробуем найти
      const existing = await prisma.userProfile.findUnique({
        where: { user_id: userId },
        include: {
          user: {
            include: {
              roles: { include: { role: { select: { name: true } } } },
            },
          },
        },
      });

      if (existing) {
        return {
          id: existing.id,
          userId: existing.user_id,
          email: existing.user.email,
          name: existing.user.name,
          roles: existing.user.roles.map(ur => ur.role.name),
          firstName: existing.first_name,
          middleName: existing.middle_name,
          lastName: existing.last_name,
          phone: existing.phone,
          avatar: existing.avatar,
          bio: existing.bio,
          theme: existing.theme,
          userCreatedAt: existing.user.createdAt,
          userUpdatedAt: existing.user.updatedAt,
          profileCreatedAt: existing.created_at,
          profileUpdatedAt: existing.updated_at,
        };
      }

      // Создаём новый профиль
      const created = await prisma.userProfile.create({
        data: {
          user_id: userId,
          first_name: null,
          last_name: null,
        },
        include: {
          user: {
            include: {
              roles: { include: { role: { select: { name: true } } } },
            },
          },
        },
      });

      return {
        id: created.id,
        userId: created.user_id,
        email: created.user.email,
        name: created.user.name,
        roles: created.user.roles.map(ur => ur.role.name),
        firstName: created.first_name,
        middleName: created.middle_name,
        lastName: created.last_name,
        phone: created.phone,
        avatar: created.avatar,
        bio: created.bio,
        theme: created.theme,
        userCreatedAt: created.user.createdAt,
        userUpdatedAt: created.user.updatedAt,
        profileCreatedAt: created.created_at,
        profileUpdatedAt: created.updated_at,
      };
    } catch (error) {
      throw new ProfileRepositoryError(
        `Error finding or creating profile with user: ${userId} - ${error}`
      );
    }
  }

  /**
   * Найти профиль вместе с данными пользователя
   * @param userId - Уникальный идентификатор пользователя
   * @returns Агрегированный профиль пользователя или null
   */
  async findWithUser(userId: string): Promise<UserProfileFull | null> {
    try {
      const profile = await prisma.userProfile.findUnique({
        where: { user_id: userId },
        include: {
          user: {
            include: {
              roles: { include: { role: { select: { name: true } } } },
            },
          },
        },
      });

      if (!profile) {
        return null;
      }

      return {
        id: profile.id,
        userId: profile.user_id,
        email: profile.user.email,
        name: profile.user.name,
        roles: profile.user.roles.map(ur => ur.role.name),
        firstName: profile.first_name,
        middleName: profile.middle_name,
        lastName: profile.last_name,
        phone: profile.phone,
        avatar: profile.avatar,
        bio: profile.bio,
        theme: profile.theme,
        userCreatedAt: profile.user.createdAt,
        userUpdatedAt: profile.user.updatedAt,
        profileCreatedAt: profile.created_at,
        profileUpdatedAt: profile.updated_at,
      };
    } catch (error) {
      throw new ProfileRepositoryError(
        `Error finding profile with user: ${userId} - ${error}`
      );
    }
  }

  /**
   * Маппинг Prisma модели на доменный тип
   */
  private mapToDomain(profile: Awaited<ReturnType<typeof prisma.userProfile.findUnique>>): UserProfileData | null {
    if (!profile) return null;

    return {
      id: profile.id,
      userId: profile.user_id,
      firstName: profile.first_name,
      middleName: profile.middle_name,
      lastName: profile.last_name,
      phone: profile.phone,
      avatar: profile.avatar,
      bio: profile.bio,
      theme: profile.theme,
      createdAt: profile.created_at,
      updatedAt: profile.updated_at,
    };
  }

  /**
   * Маппинг Prisma модели на доменный тип (гарантирует непустое значение)
   */
  private mapToDomainRequired(profile: Awaited<ReturnType<typeof prisma.userProfile.findUnique>>): UserProfileData {
    if (!profile) {
      throw new ProfileRepositoryError('Profile not found');
    }

    return {
      id: profile.id,
      userId: profile.user_id,
      firstName: profile.first_name,
      middleName: profile.middle_name,
      lastName: profile.last_name,
      phone: profile.phone,
      avatar: profile.avatar,
      bio: profile.bio,
      theme: profile.theme,
      createdAt: profile.created_at,
      updatedAt: profile.updated_at,
    };
  }
}
