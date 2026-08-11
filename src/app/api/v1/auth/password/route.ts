/**
 * @file src/app/api/v1/auth/password/route.ts
 * @description API endpoint для активной смены пароля текущим авторизованным пользователем
 *
 * @route PUT /api/v1/auth/password
 * @auth required (NextAuth session)
 * @spec docs/specs/auth/change-password-component-spec.md — секция 3.2.1
 *
 * @body { currentPassword: string, newPassword: string, confirmPasswordNew: string }
 * @response 200 { success: true, message: "Пароль успешно изменён" }
 * @response 400 { success: false, error: { code: string, message: string } }
 * @response 401 { success: false, error: { code: string, message: string } }
 * @response 422 { success: false, error: { code: string, message: string, fields: ZodIssue[] } }
 * @response 500 { success: false, error: { code: string, message: string } }
 *
 * @covers AC-9.1
 * @covers AC-9.2
 * @covers AC-9.3
 * @covers AC-9.4
 * @covers AC-9.5
 * @covers EC-11
 *
 * @see docs/requirements/REQ-AUTH-001.md — FR-09, BR-08..BR-12
 * @see docs/user-stories/US-12-активная-смена-пароля-пользователем.md
 * @see docs/plans/B-015-change-password-plan.md — задача T7
 */
import { NextRequest, NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { auth } from '@/lib/auth';
import { createAuthService } from '@/di/container';
import { InvalidCurrentPasswordError, NewPasswordMatchesCurrentError } from '@/domains/auth/auth.errors';
import { BaseError } from '@/shared/errors';

/**
 * @route PUT /api/v1/auth/password
 * @description Сменить пароль текущего пользователя
 *
 * @spec
 * - Шаг 1: auth() из @/lib/auth → если нет сессии → 401 Unauthorized
 * - Шаг 2: Извлечь email из session.user.email
 * - Шаг 3: request.json() → body
 * - Шаг 4: createAuthService().changePassword(email, body)
 * - Шаг 5: Ответ 200 { success: true, message }
 * - Шаг 6: Обработка ошибок:
 *   - InvalidCurrentPasswordError → 401 (по алгоритму задачи)
 *   - NewPasswordMatchesCurrentError → 400
 *   - ZodError → 422 с field errors
 *   - Прочие → 500
 */
export async function PUT(request: NextRequest) {
  const authService = createAuthService();

  // Шаг 1: Получение сессии
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Unauthorized',
        },
      },
      { status: 401 }
    );
  }

  try {
    // Шаг 3: Чтение тела запроса
    const body = await request.json();

    // Шаг 4: Вызов сервиса смены пароля
    await authService.changePassword(session.user.email, body);

    // Шаг 5: Успешный ответ
    return NextResponse.json(
      {
        success: true,
        message: 'Пароль успешно изменён',
      },
      { status: 200 }
    );
  } catch (error) {
    // Неверный текущий пароль
    if (error instanceof InvalidCurrentPasswordError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: error.code,
            message: 'Неверный текущий пароль',
          },
        },
        { status: 401 }
      );
    }

    // Новый пароль совпадает с текущим
    if (error instanceof NewPasswordMatchesCurrentError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: error.code,
            message: 'Новый пароль не может совпадать с текущим',
          },
        },
        { status: 400 }
      );
    }

    // Ошибка валидации Zod
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Ошибка валидации данных',
            fields: error.issues,
          },
        },
        { status: 422 }
      );
    }

    // Доменные ошибки с собственной statusCode (UserInvalidDataError и т.д.)
    if (error instanceof BaseError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: error.code,
            message: error.message,
          },
        },
        { status: error.statusCode }
      );
    }

    // Прочие ошибки → 500
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Ошибка сервера',
        },
      },
      { status: 500 }
    );
  }
}
