import { NextRequest } from 'next/server';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { createdResponse, errorResponse, handleServiceError } from '@/app/api/_lib/response';
import { ConflictError } from '@/services/_lib/errors';

const registerSchema = z.object({
  email: z.string().email('Неверный формат email'),
  password: z.string().min(6, 'Пароль должен содержать минимум 6 символов'),
});

/**
 * POST /api/auth/register — Регистрация нового пользователя.
 *
 * @remarks Публичный endpoint. Создаёт пользователя с ролью GUEST и автоматически активирует аккаунт.
 * @body email - Email пользователя
 * @body password - Пароль (мин. 6 символов)
 * @response 201 - Пользователь успешно зарегистрирован
 * @response 400 - Ошибка валидации
 * @response 409 - Email уже существует
 * @public
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const validated = registerSchema.safeParse(body);
    if (!validated.success) {
      return errorResponse(
        'VALIDATION_ERROR',
        validated.error.issues[0]?.message ?? 'Ошибка валидации',
        400,
      );
    }

    const { email, password } = validated.data;

    const prisma = new PrismaClient();
    try {
      const existingUser = await prisma.user.findUnique({
        where: { email },
        select: { id: true },
      });

      if (existingUser) {
        return errorResponse('CONFLICT', 'Пользователь с таким email уже существует', 409);
      }

      const bcrypt = await import('bcryptjs');
      const passwordHash = await bcrypt.hash(password, 12);

      const user = await prisma.user.create({
        data: {
          email,
          passwordHash,
          role: 'GUEST',
          isActive: true,
        },
        select: {
          id: true,
          email: true,
          role: true,
        },
      });

      return createdResponse({ user });
    } finally {
      await prisma.$disconnect();
    }
  } catch (error) {
    return handleServiceError(error);
  }
}
