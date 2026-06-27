import type { Member } from '@prisma/client';

/**
 * Интерфейс репозитория участника.
 *
 * @public
 */
export interface MemberRepository {
  /**
   * Находит участника по ID пользователя (userId).
   * @param userId - ID пользователя (User)
   * @returns Участник или null
   */
  findByUserId(userId: string): Promise<Member | null>;

  /**
   * Обновляет данные участника.
   * @param id - ID участника (Member)
   * @param data - Данные для обновления
   * @returns Обновлённый участник
   */
  update(id: string, data: UpdateMemberInput): Promise<Member>;
}

/**
 * Входные данные для обновления участника.
 *
 * @public
 */
export interface UpdateMemberInput {
  surname?: string;
  firstName?: string;
  patronymic?: string | null;
  address?: string | null;
}