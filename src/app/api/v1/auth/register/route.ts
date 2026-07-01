/**
 * @route POST /api/v1/auth/register
 * @auth none
 * @description Регистрация нового пользователя в системе
 *
 * @body RegisterData — { email, password, confirmPassword }
 * @response 201 { success: true, data: UserData }
 * @response 400 { success: false, error: { code: string, message: string } }
 * @response 409 { success: false, error: { code: string, message: string } }
 * @response 500 { success: false, error: { code: string, message: string } }
 *
 * @spec
 * - Валидация тела запроса через Zod в сервисе
 * - При дублировании email возвращает 409 с UserDuplicateError
 * - При невалидных данных возвращает 400 с UserInvalidDataError
 * - Пароль НЕ возвращается в ответе — UserData не содержит password
 * - Внутренняя ошибка сервера — 500 с общим сообщением
 *
 * @see docs/user-stories/US-2-registration.md — FR-4, FR-5, таблица ошибок
 */
import { NextRequest, NextResponse } from 'next/server';
import { createAuthService } from '@/di/container';
import type { BaseError } from '@/shared/errors';

export async function POST(request: NextRequest) {
  const authService = createAuthService();

  try {
    const body = await request.json();
    const user = await authService.registerUser(body);

    return NextResponse.json(
      {
        success: true,
        data: user,
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: (error as BaseError).code || 'UNKNOWN_ERROR',
          message: (error as Error).message || 'Ошибка при регистрации',
        },
      },
      { status: (error as BaseError).statusCode || 500 }
    );
  }
}
