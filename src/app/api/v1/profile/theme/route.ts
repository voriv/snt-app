import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { createUserProfileService } from '@/domains/userProfile/userProfile.service';
import type { BaseError } from '@/shared/errors';

const userProfileService = createUserProfileService();

/**
 * @route PATCH /api/v1/profile/theme
 * @auth required
 * @description Обновить тему оформления текущего пользователя
 *
 * @body { theme: 'light' | 'dark' | 'green' }
 * @response 200 { success: true, data: { theme: string } }
 * @response 400 { success: false, error: { code: 'THEME_INVALID', message: string } }
 * @response 401 { success: false, error: { code: 'UNAUTHORIZED', message: string } }
 * @response 404 { success: false, error: { code: 'USER_PROFILE_NOT_FOUND', message: string } }
 *
 * @spec
 * - Проверяет авторизацию через session
 * - Валидирует тему через Zod-схему
 * - Вызывает updateTheme(userId, theme)
 * - Возвращает обновленную тему
 */
export async function PATCH(request: NextRequest) {
  try {
    // Проверяем авторизацию
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Пожалуйста, авторизуйтесь для изменения темы',
          },
        },
        { status: 401 }
      );
    }

    // Парсим тело запроса
    const body = await request.json();

    // Вызываем сервис для обновления темы
    const updatedTheme = await userProfileService.updateTheme(
      session.user.id,
      body.theme
    );

    return NextResponse.json({
      success: true,
      data: { theme: updatedTheme },
    });
  } catch (error) {
    if (error instanceof Error && 'code' in error) {
      const baseError = error as BaseError;
      return NextResponse.json(
        {
          success: false,
          error: {
            code: baseError.code,
            message: baseError.message,
          },
        },
        { status: baseError.statusCode }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'UNKNOWN_ERROR',
          message: (error as Error).message || 'Unknown error',
        },
      },
      { status: 500 }
    );
  }
}
