/**
 * @file plot-users/route.ts
 * @description Route handlers для управления связями пользователей с участками (GET list, POST create)
 *
 * @see docs/user-stories/US-19-1-create-plot-user-relationship.md
 */
import { NextRequest, NextResponse } from 'next/server';
import { createPlotUserRoleServiceDI } from '@/di/container';
import { withRoleGuard } from '@/app/api/v1/_shared/with-role-guard';
import type { BaseError } from '@/shared/errors';
import { PlotUserRoleDuplicateError, PlotUserRoleInvalidDataError } from '@/domains/plotUser/plotUser.errors';
import { auth } from '@/lib/auth';

const plotUserService = createPlotUserRoleServiceDI();

/**
 * @route GET /api/v1/plot-users
 * @auth required
 * @role ADMIN, MANAGER
 * @description Возвращает список всех связей пользователей с участками
 *
 * @response 200 { success: true, data: PlotUserRole[], total: number, page: number, limit: number, totalPages: number }
 * @response 401 { success: false, error: { code: 'UNAUTHORIZED', message: string } }
 * @response 403 { success: false, error: { code: 'FORBIDDEN', message: string } }
 * @response 500 { success: false, error: { code: string, message: string } }
 *
 * @spec - Поддерживает фильтрацию через query params: userId, plotId, role, status
 * - Поддерживает пагинацию: page, limit
 * - По умолчанию: page=1, limit=20
 */
async function handleGet(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const filters = {
      userId: searchParams.get('userId') || undefined,
      plotId: searchParams.get('plotId') || undefined,
      role: searchParams.get('role') ? parseInt(searchParams.get('role')!) as 1 | 2 | 3 : undefined,
      status: searchParams.get('status') as 'active' | 'pending' | 'expired' | undefined,
      page: searchParams.get('page') ? parseInt(searchParams.get('page')!) : undefined,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined,
    };

    const result = await plotUserService.findWithPagination(filters);

    return NextResponse.json({
      success: true,
      data: result.data,
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
    });
  } catch (error) {
    return errorResponse(error);
  }
}

/**
 * @route POST /api/v1/plot-users
 * @auth required
 * @role ADMIN, MANAGER
 * @description Создаёт новую связь пользователя с участком
 *
 * @body CreatePlotUserRoleInput { userId, plotId, role, [status?, comment?, expiresAt?] }
 * @response 201 { success: true, data: PlotUserRole }
 * @response 400 { success: false, error: { code: 'VALIDATION_ERROR', message: string } }
 * @response 401 { success: false, error: { code: 'UNAUTHORIZED', message: string } }
 * @response 403 { success: false, error: { code: 'FORBIDDEN', message: string } }
 * @response 409 { success: false, error: { code: 'CONFLICT', message: string } }
 *
 * @spec
 * - BR-1: проверяет существование пользователя и участка
 * - BR-3: проверяет отсутствие активной дублирующей связи
 * - BR-5: создаёт запись в истории
 */
async function handlePost(request: NextRequest) {
  try {
    // Получаем userId из сессии для записи в историю
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Неавторизованный доступ' } },
        { status: 401 }
      );
    }

    const body = await request.json();
    const changedBy = session.user.id;

    const result = await plotUserService.create(
      {
        userId: body.userId,
        plotId: body.plotId,
        role: body.role,
        status: body.status || 'active',
        comment: body.comment || null,
        expiresAt: body.expiresAt || null,
      },
      changedBy
    );

    return NextResponse.json(
      {
        success: true,
        data: result,
      },
      { status: 201 }
    );
  } catch (error) {
    return errorResponse(error);
  }
}

export const GET = withRoleGuard(handleGet, { method: 'GET', path: '/plot-users' });
export const POST = withRoleGuard(handlePost, { method: 'POST', path: '/plot-users' });

/**
 * Стандартизированная обработка ошибок
 */
function errorResponse(error: unknown): NextResponse {
  // Обработка дубликатов (409 Conflict)
  if (error instanceof PlotUserRoleDuplicateError) {
    return NextResponse.json(
      { success: false, error: { code: 'CONFLICT', message: error.message } },
      { status: 409 }
    );
  }

  // Обработка валидации (400 Bad Request)
  if (error instanceof PlotUserRoleInvalidDataError) {
    return NextResponse.json(
      { success: false, error: { code: 'VALIDATION_ERROR', message: error.message } },
      { status: 400 }
    );
  }

  if (error instanceof Error && 'code' in error) {
    const baseError = error as BaseError;
    return NextResponse.json(
      { success: false, error: { code: baseError.code, message: baseError.message } },
      { status: baseError.statusCode }
    );
  }

  console.error('PlotUsers route error:', error);
  return NextResponse.json(
    { success: false, error: { code: 'UNKNOWN_ERROR', message: (error as Error).message || 'Unknown error' } },
    { status: 500 }
  );
}
