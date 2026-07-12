/**
 * @file plot-users/connections/route.ts
 * @description Route handlers для просмотра связей пользователя с участками (US-19-3)
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
import type { PlotUserRoleConnectionFilter } from '@/domains/plotUser/plotUser.types';

/**
 * @route GET /api/v1/plot-users/connections
 * @auth required
 * @description Возвращает список всех связей текущего пользователя с участками
 *
 * @query status=active|pending|expired&role=1|2|3&search=query&page=1&limit=25
 * @response 200 { success: true, data: PlotUserRoleConnection[] }
 * @response 401 { success: false, error: { code: 'UNAUTHORIZED', message: string } }
 * @response 404 { success: false, error: { code: 'NOT_FOUND', message: string } }
 * @response 500 { success: false, error: { code: string, message: string } }
 *
 * @spec
 * - BR-6: userId берётся из сессии (текущий пользователь)
 * - Фильтры: role, status, search передаются через query params
 * - Пагинация: page, limit (по умолчанию 1, 25)
 * - Сортировка: active → pending → expired, затем assignedAt DESC (AC-1.3)
 *
 * @see US-19-3 FR-1 (список связей)
 * @see US-19-3 FR-3 (фильтр по роли)
 * @see US-19-3 FR-4 (фильтр по статусу)
 * @see US-19-3 FR-5 (поиск)
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Неавторизованный доступ' } },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const userId = session.user.id;

    const filters: PlotUserRoleConnectionFilter = {};

    const roleParam = searchParams.get('role');
    if (roleParam) {
      const parsed = parseInt(roleParam, 10);
      if ([1, 2, 3].includes(parsed)) {
        filters.role = parsed as 1 | 2 | 3;
      }
    }

    const statusParam = searchParams.get('status');
    if (['active', 'pending', 'expired'].includes(statusParam ?? '')) {
      filters.status = statusParam as 'active' | 'pending' | 'expired';
    }

    const searchParam = searchParams.get('search');
    if (searchParam) {
      filters.search = searchParam;
    }

    const page = searchParams.get('page');
    if (page) {
      const parsed = parseInt(page, 10);
      if (!isNaN(parsed) && parsed > 0) {
        filters.page = parsed;
      }
    }

    const limit = searchParams.get('limit');
    if (limit) {
      const parsed = parseInt(limit, 10);
      if (!isNaN(parsed) && parsed > 0) {
        filters.limit = parsed;
      }
    }

    const plotUserService = createPlotUserRoleServiceDI();
    const result = await plotUserService.findByUser(userId, filters);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    return errorResponse(error);
  }
}

/**
 * Стандартизированная обработка ошибок для GET /api/v1/plot-users/connections
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
