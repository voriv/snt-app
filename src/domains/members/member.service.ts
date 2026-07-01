import type { IMemberRepository } from './member.repository.interface';
import { MemberRepository } from './member.repository.prisma';
import { MemberNotFoundError, MemberInvalidDataError } from './member.errors';
import { createMemberSchema, updateMemberSchema } from './member.validators';
import type { Member, CreateMemberData, UpdateMemberData } from './member.types';

export class MemberService {
  constructor(private readonly repository: IMemberRepository = new MemberRepository()) {}

  async findById(id: string): Promise<Member> {
    const member = await this.repository.findById(id);
    if (!member) {
      throw new MemberNotFoundError(id);
    }
    return member;
  }

  async findAll(): Promise<Member[]> {
    return this.repository.findAll();
  }

  async create(data: unknown): Promise<Member> {
    try {
      const validated = createMemberSchema.parse(data);
      return this.repository.create(validated as CreateMemberData);
    } catch (error) {
      if (error instanceof Error) {
        throw new MemberInvalidDataError(error.message);
      }
      throw new MemberInvalidDataError('Validation failed');
    }
  }

  async update(id: string, data: unknown): Promise<Member> {
    try {
      const validated = updateMemberSchema.parse(data);
      return this.repository.update(id, validated as UpdateMemberData);
    } catch (error) {
      if (error instanceof Error) {
        throw new MemberInvalidDataError(error.message);
      }
      throw new MemberInvalidDataError('Validation failed');
    }
  }

  async delete(id: string): Promise<void> {
    const member = await this.repository.findById(id);
    if (!member) {
      throw new MemberNotFoundError(id);
    }
    await this.repository.delete(id);
  }
}
