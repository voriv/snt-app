import { prisma } from '@/infrastructure/prisma/client';
import type { IMemberRepository } from './member.repository.interface';
import type { CreateMemberData, UpdateMemberData, Member } from './member.types';

export class MemberRepository implements IMemberRepository {
  async findById(id: string): Promise<Member | null> {
    const user = await prisma.member.findUnique({
      where: { id },
    });
    if (!user) return null;

    return {
      id: user.id,
      userId: user.user_id,
      firstName: user.first_name,
      lastName: user.last_name,
      birthDate: user.birth_date,
      phone: user.phone,
      email: user.email,
      isActive: user.is_active,
      note: user.note,
      createdAt: user.created_at,
      updatedAt: user.updated_at,
    };
  }

  async findAll(): Promise<Member[]> {
    const users = await prisma.member.findMany();
    return users.map((user: any) => ({
      id: user.id,
      userId: user.user_id,
      firstName: user.first_name,
      lastName: user.last_name,
      birthDate: user.birth_date,
      phone: user.phone,
      email: user.email,
      isActive: user.is_active,
      note: user.note,
      createdAt: user.created_at,
      updatedAt: user.updated_at,
    }));
  }

  async create(data: CreateMemberData): Promise<Member> {
    const result = await prisma.member.create({
      data: {
        user_id: data.userId,
        first_name: data.firstName,
        last_name: data.lastName,
        birth_date: data.birthDate ? new Date(data.birthDate) : null,
        phone: data.phone || null,
        email: data.email || null,
        note: data.note || null,
        is_active: true,
      },
      include: {
        user: false,
      },
    });

    return {
      id: result.id,
      userId: result.user_id,
      firstName: result.first_name,
      lastName: result.last_name,
      birthDate: result.birth_date,
      phone: result.phone,
      email: result.email,
      isActive: result.is_active,
      note: result.note,
      createdAt: result.created_at,
      updatedAt: result.updated_at,
    };
  }

  async update(id: string, data: UpdateMemberData): Promise<Member> {
    const updateData: Record<string, unknown> = {};

    if (data.firstName !== undefined) updateData.first_name = data.firstName;
    if (data.lastName !== undefined) updateData.last_name = data.lastName;
    if (data.birthDate !== undefined) updateData.birth_date = new Date(data.birthDate);
    if (data.phone !== undefined) updateData.phone = data.phone;
    if (data.email !== undefined) updateData.email = data.email;
    if (data.isActive !== undefined) updateData.is_active = data.isActive;
    if (data.note !== undefined) updateData.note = data.note;

    const result = await prisma.member.update({
      where: { id },
      data: updateData,
      include: {
        user: false,
      },
    });

    return {
      id: result.id,
      userId: result.user_id,
      firstName: result.first_name,
      lastName: result.last_name,
      birthDate: result.birth_date,
      phone: result.phone,
      email: result.email,
      isActive: result.is_active,
      note: result.note,
      createdAt: result.created_at,
      updatedAt: result.updated_at,
    };
  }

  async delete(id: string): Promise<void> {
    await prisma.member.delete({
      where: { id },
    });
  }
}
