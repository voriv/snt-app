import { prisma } from '@/lib/prisma';
import type {
  UpdateMemberInput,
  MemberRepository as MemberRepositoryInterface,
} from './member-repository.interface';
import type { Member } from '@prisma/client';
import { RepositoryError, NotFoundError } from './_lib/errors';

/**
 * Реализация репозитория участника через Prisma.
 *
 * @public
 */
export class MemberRepository implements MemberRepositoryInterface {
  async findByUserId(userId: string): Promise<Member | null> {
    try {
      const member = await prisma.member.findUnique({
        where: { userId },
      });
      return member;
    } catch (error) {
      throw new RepositoryError('Failed to fetch member by userId', String(error));
    }
  }

  async update(id: string, data: UpdateMemberInput): Promise<Member> {
    try {
      const member = await prisma.member.update({
        where: { id },
        data,
      });
      return member;
    } catch (error) {
      if (this.isPrismaNotFoundError(error)) {
        throw new NotFoundError('Member', id);
      }
      throw new RepositoryError('Failed to update member', String(error));
    }
  }

  /** Проверяет, является ли ошибка Prisma P2025 (Record not found). */
  private isPrismaNotFoundError(error: unknown): boolean {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error as { code: string }).code === 'P2025'
    );
  }
}