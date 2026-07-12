/**
 * @file plot-users/users/route.ts
 * @description Route handler для получения списка пользователей (для формы PlotUserForm)
 *
 * @see docs/user-stories/US-19-1-create-plot-user-relationship.md
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/infrastructure/prisma/client';
import { auth } from '@/lib/auth';

/**
 * @route GET /api/v1/plot-users/users
 * @auth required
 * @description Возвращает список пользователей для выбора в форме связи
 *
 * @response 200 { success: true, data: { id: string, email: string, firstName?: string|null, lastName?: string|null }[] }
 * @response 401 { success: false, error: { code: 'UNAUTHORIZED', message: string } }
 */
async function handleGet() {
  try {
    // Проверка авторизации
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'Пожалуйста, авторизуйтесь' },
        },
        { status: 401 }
      );
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        profile: {
          select: {
            first_name: true,
            last_name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 100,
    });

    // Преобразуем в плоский формат
    const result = users.map(user => ({
      id: user.id,
      email: user.email,
      firstName: user.profile?.first_name ?? null,
      lastName: user.profile?.last_name ?? null,
    }));

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('PlotUsers users route error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'UNKNOWN_ERROR',
          message: 'Ошибка загрузки списка пользователей',
        },
      },
      { status: 500 }
    );
  }
}

export const GET = handleGet;
