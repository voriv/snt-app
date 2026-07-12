/**
 * @file plots/route.ts
 * @description Route handlers для управления земельными участками (GET list, POST create)
 *
 * @see docs/user-stories/US-13-plot-list.md — API для просмотра списка участков
 * @see docs/user-stories/US-14-plot-registration.md — API для создания участков
 */
import { NextRequest, NextResponse } from 'next/server';
import { getContainer } from '@/di/container';
import { withRoleGuard } from '@/app/api/v1/_shared/with-role-guard';
import type { BaseError } from '@/shared/errors';
import { PlotDuplicateError } from '@/domains/plot/plot.errors';

/**
 * @route GET /api/v1/plots
 * @auth required
 * @role ADMIN, MANAGER
 * @description Возвращает список всех земельных участков
 *
 * @response 200 { success: true, data: Plot[] }
 * @response 401 { success: false, error: { code: 'UNAUTHORIZED', message: string } }
 * @response 403 { success: false, error: { code: 'FORBIDDEN', message: string } }
 * @response 500 { success: false, error: { code: string, message: string } }
 *
 * @spec - Без пагинации в текущей реализации (MVP)
 * - Возвращает все участки, отсортированные по plotNumber ASC
 */
async function handleGet() {
  try {
    const container = getContainer();
    const plotService = container.getPlotService();
    const plots = await plotService.findAll();
    return NextResponse.json({
      success: true,
      data: plots,
    });
  } catch (error) {
    return errorResponse(error);
  }
}

/**
 * @route POST /api/v1/plots
 * @auth required
 * @role ADMIN, MANAGER
 * @description Создаёт новый земельный участок
 *
 * @body CreatePlotData { plotNumber, [cadastralNumber?, area, address?, note?] }
 * @response 201 { success: true, data: Plot }
 * @response 400 { success: false, error: { code: 'VALIDATION_ERROR', message: string } }
 * @response 401 { success: false, error: { code: 'UNAUTHORIZED', message: string } }
 * @response 403 { success: false, error: { code: 'FORBIDDEN', message: string } }
 * @response 409 { success: false, error: { code: 'CONFLICT', message: string } }
 *
 * @spec
 * - Валидация тела запроса через Zod в сервисе
 * - При дублировании plotNumber → 409 Conflict
 * - При дублировании cadastralNumber → 409 Conflict
 */
async function handlePost(request: NextRequest) {
  try {
    const container = getContainer();
    const plotService = container.getPlotService();
    const body = await request.json();
    const plot = await plotService.create(body);
    return NextResponse.json(
      {
        success: true,
        data: plot,
      },
      { status: 201 },
    );
  } catch (error) {
    return errorResponse(error);
  }
}

export const GET = withRoleGuard(handleGet, { method: 'GET', path: '/plots' });
export const POST = withRoleGuard(handlePost, { method: 'POST', path: '/plots' });

/**
 * Стандартизированная обработка ошибок
 */
function errorResponse(error: unknown): NextResponse {
  // Обработка дубликатов (409 Conflict)
  if (error instanceof PlotDuplicateError) {
    return NextResponse.json(
      { success: false, error: { code: 'CONFLICT', message: error.message } },
      { status: 409 },
    );
  }

  if (error instanceof Error && 'code' in error) {
    const baseError = error as BaseError;
    return NextResponse.json(
      { success: false, error: { code: baseError.code, message: baseError.message } },
      { status: baseError.statusCode },
    );
  }
  return NextResponse.json(
    { success: false, error: { code: 'UNKNOWN_ERROR', message: (error as Error).message || 'Unknown error' } },
    { status: 500 },
  );
}
