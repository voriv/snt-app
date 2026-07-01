import type { Member, CreateMemberData, UpdateMemberData } from './member.types';

export interface IMemberRepository {
  findById(id: string): Promise<Member | null>;
  findAll(): Promise<Member[]>;
  create(data: CreateMemberData): Promise<Member>;
  update(id: string, data: UpdateMemberData): Promise<Member>;
  delete(id: string): Promise<void>;
}
