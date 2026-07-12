/**
 * @file plot-users/connections/search/route.ts
 * @description Route handler для поиска связей пользователя по участку (US-19-3)
 *
 * @see docs/user-stories/US-19-3-user-plot-connections.md
 */
import { NextRequest, NextResponse } from 'next/server';
import { createPlotUserRoleServiceDI } from '@/di/container';
import { auth } from '@/lib/auth';
import type { BaseError } from '@/shared/errors';
import {
  PlotUserRoleNotFoundError,
  PlotUserRoleInvalidDataError,
} from '@/domains/plotUser/plotUser.errors';

/**
 * @route POST /api/v1/plot-users/connections/search
 * @auth required
 * @description Поиск связей пользователя по номеру участка или адресу
 *
 * @body { search: string }
 * @response 200 { success: true, data: PlotUserRoleConnection[] }
 * @response 401 { success: false, error: { code: 'UNAUTHORIZED', message: string } }
 * @response 400 { success: false, error: { code: 'VALIDATION_ERROR', message: string } }
 * @response 404 { success: false, error: { code: 'NOT_FOUND', message: string } }
 * @response 500 { success: false, error: { code: string, message: string } }
 *
 * @spec
 * - BR-6: userId берётся из сессии
 * - search: строка для поиска по plot_number и plot.address
 * - Case-insensitive contains
 * - Возвращает PlotUserRoleConnection с данными участка
 * - Обязательное поле search (минимум 2 символа)
 *
 * @see US-19-3 FR-5 (поиск по участку)
 * @see US-19-3 AC-5.2 (поиск по номеру)
 * @see US-19-3 AC-5.3 (поиск по адресу)
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Неавторизованный доступ' } },
        { status: 401 }
      );
    }

    // Парсим тело запроса
    let body: { search?: string };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Некорректный формат тела запроса' } },
        { status: 400 }
      );
    }

    const search = body.search;

    // Валидация: search обязателен и минимум 2 символа
    if (!search || typeof search !== 'string' || search.trim().length < 2) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Поле search обязательно и должно содержать минимум 2 символа' } },
        { status: 400 }
      );
    }

    const userId = session.user.id;
    const plotUserService = createPlotUserRoleServiceDI();
    const result = await plotUserService.searchByPlot(userId, search.trim());

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    return errorResponse(error);
  }
}

/**
 * Стандартизированная обработка ошибок для POST /api/v1/plot-users/connections/search
 *
 * @spec
 * - PlotUserRoleNotFoundError → 404 Not Found (пользователь не найден)
 * - PlotUserRoleInvalidDataError → 400 Bad Request
 * - Прочие BaseError → соответствующий HTTP-статус
 * - Неизвестные ошибки → 500 Internal Error
 */
function errorResponse(error: unknown): NextResponse {
  // 404 Not Found — пользователь не найден
  if (error instanceof PlotUserRoleNotFoundError) {
    return NextResponse.json(
      { success: false, error: { code: 'NOT_FOUND', message: error.message } },
      { status: 404 },
    );
  }

  // 400 Bad Request — ошибка валидации
  if (error instanceof PlotUserRoleInvalidDataError) {
    return NextResponse.json(
      { success: false, error: { code: 'VALIDATION_ERROR', message: error.message } },
      { status: 400 },
    );
  }

  // Zod-ошибки валидации → 400 Bad Request
  if (error instanceof Error && error.name === 'ZodError') {
    return NextResponse.json(
      { success: false, error: { code: 'VALIDATION_ERROR', message: error.message } },
      { status: 400 },
    );
  }

  // BaseError с собственным statusCode
  if (error instanceof Error && 'code' in error) {
    const baseError = error as BaseError;
    return NextResponse.json(
      { success: false, error: { code: baseError.code, message: baseError.message } },
      { status: baseError.statusCode },
    );
  }

  // 500 Internal Error — неизвестная ошибка
  return NextResponse.json(
    {
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Внутренняя ошибка сервера' },
    },
    { status: 500 },
  );
}
