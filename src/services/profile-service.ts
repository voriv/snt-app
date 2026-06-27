import { prisma } from '@/lib/prisma';
import {
  ValidationError,
  NotFoundError,
  ForbiddenError,
} from './_lib/errors';
import { z } from 'zod';

// ========================
// Types
// ========================

/**
 * Данные участника СНТ.
 *
 * @public
 */
export interface MemberDetail {
  surname: string;
  firstName: string;
  patronymic: string | null;
  address: string | null;
  snn: string | null;
}

/**
 * Профиль пользователя с данными участника.
 *
 * @public
 */
export interface ProfileDetail {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  avatarUrl: string | null;
  role: string;
  isActive: boolean;
  member: MemberDetail | null;
}

/**
 * Входные данные для обновления профиля.
 *
 * @public
 */
export interface UpdateProfileInput {
  name?: string;
  phone?: string;
  avatarUrl?: string;
  surname?: string;
  firstName?: string;
  patronymic?: string;
  address?: string;
}

// ========================
// Zod Schemas
// ========================

/**
 * Zod схема для валидации входных данных обновления профиля.
 *
 * @public
 */
export const updateProfileSchema = z
  .object({
    name: z.string().max(100).optional(),
    phone: z.string().regex(/^\+7\d{10}$/).optional().or(z.literal('')),
    avatarUrl: z.string().url().optional().or(z.literal('')),
    surname: z.string().max(100).optional(),
    firstName: z.string().max(100).optional(),
    patronymic: z.string().max(100).optional(),
    address: z.string().max(300).optional(),
  })
  .strict();

/**
 * Zod схема для валидации URL аватара.
 *
 * @public
 */
export const updateAvatarUrlSchema = z
  .object({
    avatarUrl: z.string().url().min(1),
  })
  .strict();

// ========================
// Service
// ========================

/**
 * Сервис управления профилем пользователя.
 *
 * @remarks
 * Обеспечивает получение, обновление данных профиля и управление аватаром.
 * Сервис сам создаёт необходимые зависимости (через Prisma) внутри методов.
 * API route вызывает только этот сервис, передавая currentUserId для проверки прав.
 */
export class ProfileService {
  /**
   * Получает данные профиля пользователя по ID, включая данные участника (Member).
   *
   * @param userId - ID пользователя
   * @returns Данные профиля с информацией об участнике
   * @throws NotFoundError если пользователь не найден
   */
  async getProfile(userId: string): Promise<ProfileDetail> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        member: true,
      },
    });

    if (!user) {
      throw new NotFoundError('User', userId);
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone,
      avatarUrl: user.avatarUrl,
      role: user.role,
      isActive: user.isActive,
      member: user.member
        ? {
            surname: user.member.surname,
            firstName: user.member.firstName,
            patronymic: user.member.patronymic,
            address: user.member.address,
            snn: user.member.snn,
          }
        : null,
    };
  }

  /**
   * Обновляет данные профиля пользователя.
   * Поддерживает обновление полей User и Member.
   *
   * @param currentUserId - ID текущего пользователя (для проверки прав)
   * @param targetUserId - ID пользователя, чей профиль обновляется
   * @param input - Данные для обновления
   * @returns Обновлённые данные профиля
   * @throws ValidationError если входные данные невалидны
   * @throws NotFoundError если пользователь не найден
   * @throws ForbiddenError если пользователь не владелец и не ADMIN
   */
  async updateProfile(
    currentUserId: string,
    targetUserId: string,
    input: UpdateProfileInput,
  ): Promise<ProfileDetail> {
    // BL-002: owner-or-admin
    if (currentUserId !== targetUserId) {
      const currentUser = await prisma.user.findUnique({
        where: { id: currentUserId },
      });

      if (!currentUser || currentUser.role !== 'ADMIN') {
        throw new ForbiddenError();
      }
    }

    const validated = updateProfileSchema.parse(input);

    const user = await prisma.user.findUnique({
      where: { id: targetUserId },
    });

    if (!user) {
      throw new NotFoundError('User', targetUserId);
    }

    const userUpdate: {
      name?: string | null;
      phone?: string | null;
      avatarUrl?: string | null;
    } = {};

    if (validated.name !== undefined) userUpdate.name = validated.name || null;
    if (validated.phone !== undefined) userUpdate.phone = validated.phone || null;
    if (validated.avatarUrl !== undefined)
      userUpdate.avatarUrl = validated.avatarUrl || null;

    await prisma.user.update({
      where: { id: targetUserId },
      data: userUpdate,
    });

    // BL-003: member-optional
    const memberFields: {
      surname?: string;
      firstName?: string;
      patronymic?: string | null;
      address?: string | null;
    } = {};

    if (validated.surname !== undefined) memberFields.surname = validated.surname;
    if (validated.firstName !== undefined)
      memberFields.firstName = validated.firstName;
    if (validated.patronymic !== undefined)
      memberFields.patronymic = validated.patronymic ?? null;
    if (validated.address !== undefined) memberFields.address = validated.address ?? null;

    if (Object.keys(memberFields).length > 0) {
      const member = await prisma.member.findUnique({
        where: { userId: targetUserId },
      });

      if (member) {
        await prisma.member.update({
          where: { id: member.id },
          data: memberFields,
        });
      }
      // BL-003: если Member не существует — пропускаем, не ошибка
    }

    return this.getProfile(targetUserId);
  }

  /**
   * Обновляет только URL аватара пользователя.
   *
   * @param currentUserId - ID текущего пользователя (для проверки прав)
   * @param targetUserId - ID пользователя, аватар которого обновляется
   * @param avatarUrl - Новый URL аватара
   * @returns Обновлённые данные профиля
   * @throws ValidationError если URL невалиден
   * @throws NotFoundError если пользователь не найден
   */
  async updateAvatarUrl(
    currentUserId: string,
    targetUserId: string,
    avatarUrl: string,
  ): Promise<ProfileDetail> {
    // BL-002: owner-or-admin
    if (currentUserId !== targetUserId) {
      const currentUser = await prisma.user.findUnique({
        where: { id: currentUserId },
      });

      if (!currentUser || currentUser.role !== 'ADMIN') {
        throw new ForbiddenError();
      }
    }

    const validated = updateAvatarUrlSchema.parse({ avatarUrl });

    const user = await prisma.user.findUnique({
      where: { id: targetUserId },
    });

    if (!user) {
      throw new NotFoundError('User', targetUserId);
    }

    await prisma.user.update({
      where: { id: targetUserId },
      data: { avatarUrl: validated.avatarUrl },
    });

    return this.getProfile(targetUserId);
  }
}

/**
 * Factory функция для создания экземпляра ProfileService.
 *
 * @returns Экземпляр ProfileService
 *
 * @public
 */
export function createProfileService(): ProfileService {
  return new ProfileService();
}
