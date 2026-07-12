/**
 * @file plots/[id]/route.ts
 * @description Route handlers для управления отдельным земельным участком (GET, PATCH, DELETE)
 *
 * @see docs/user-stories/US-15-plot-editing.md — редактирование участка
 * @see docs/user-stories/US-18-plot-card.md — карточка участка (GET /:id)
 */
import { NextRequest, NextResponse } from 'next/server';
import { createPlotService } from '@/di/container';
import { withRoleGuard } from '@/app/api/v1/_shared/with-role-guard';
import type { BaseError } from '@/shared/errors';
import {
  PlotNotFoundError,
  PlotDuplicateError,
  PlotInvalidDataError,
} from '@/domains/plot/plot.errors';

const plotService = createPlotService();

/**
 * @route GET /api/v1/plots/:id
 * @auth required
 * @role ADMIN, MANAGER
 * @description Возвращает участок по уникальному идентификатору
 *
 * @param id - ID участка (из URL params)
 *
 * @response 200 { success: true, data: Plot }
 * @response 401 { success: false, error: { code: 'UNAUTHORIZED', message: string } }
 * @response 403 { success: false, error: { code: 'FORBIDDEN', message: string } }
 * @response 404 { success: false, error: { code: 'NOT_FOUND', message: string } }
 * @response 500 { success: false, error: { code: 'INTERNAL_ERROR', message: string } }
 *
 * @spec
 * - Возвращает полный объект Plot с полями: id, plotNumber, cadastralNumber, area, address, note, createdAt, updatedAt
 * - При отсутствии участка → 404 Not Found
 *
 * @data-flow
 * - apiClient.get('/plots/:id') → GET handler → PlotService.findById → IPlotRepository.findById
 */
async function handleGet(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    const plot = await plotService.findById(id);
    return NextResponse.json({
      success: true,
      data: plot,
    });
  } catch (error) {
    return errorResponse(error);
  }
}

/**
 * @route PATCH /api/v1/plots/:id
 * @auth required
 * @role ADMIN, MANAGER
 * @description Обновляет данные существующего участка
 *
 * @param id - ID участка (из URL params)
 * @body UpdatePlotData { [cadastralNumber?], area?, [address?], [note?] }
 *
 * @response 200 { success: true, data: Plot }
 * @response 400 { success: false, error: { code: 'VALIDATION_ERROR', message: string } }
 * @response 401 { success: false, error: { code: 'UNAUTHORIZED', message: string } }
 * @response 403 { success: false, error: { code: 'FORBIDDEN', message: string } }
 * @response 404 { success: false, error: { code: 'NOT_FOUND', message: string } }
 * @response 409 { success: false, error: { code: 'CONFLICT', message: string } }
 * @response 500 { success: false, error: { code: 'INTERNAL_ERROR', message: string } }
 *
 * @spec
 * - plotNumber не может быть изменён (BR-1) — поле игнорируется в теле запроса
 * - Валидация тела запроса через Zod-схему updatePlotSchema в сервисе
 * - При дубликате cadastralNumber → 409 Conflict (BR-2)
 * - При отсутствии участка → 404 Not Found
 * - При ошибке валидации → 400 Bad Request (BR-3, BR-4)
 *
 * @data-flow
 * - apiClient.patch('/plots/:id', body) → PATCH handler → PlotService.update → IPlotRepository.update
 *
 * @see docs/user-stories/US-15-plot-editing.md — AC-2.1 (PATCH-запрос)
 */
async function handlePatch(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    const body = await request.json();
    const plot = await plotService.update(id, body);
    return NextResponse.json({
      success: true,
      data: plot,
    });
  } catch (error) {
    return errorResponse(error);
  }
}

/**
 * @route DELETE /api/v1/plots/:id
 * @auth required
 * @description Удаляет участок по идентификатору
 *
 * @param id - ID участка (из URL params)
 *
 * @response 204 No content
 * @response 401 { success: false, error: { code: 'UNAUTHORIZED', message: string } }
 * @response 403 { success: false, error: { code: 'FORBIDDEN', message: string } }
 * @response 404 { success: false, error: { code: 'NOT_FOUND', message: string } }
 * @response 500 { success: false, error: { code: 'INTERNAL_ERROR', message: string } }
 *
 * @spec
 * - Удаление участка (US-16)
 * - Требует авторизации и прав на удаление участков
 * - При отсутствии участка → 404 Not Found
 * - Возвращает 204 No Content при успешном удалении
 *
 * @data-flow
 * - apiClient.delete('/plots/:id') → DELETE handler → PlotService.delete → IPlotRepository.delete
 *
 * @see docs/user-stories/US-16-plot-deletion.md — AC-3.1, AC-3.2
 */
async function handleDelete(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    await plotService.delete(id);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return errorResponse(error);
  }
}

export const GET = withRoleGuard(handleGet, { method: 'GET', path: '/plots/:id' });
export const PATCH = withRoleGuard(handlePatch, { method: 'PATCH', path: '/plots/:id' });
export const DELETE = withRoleGuard(handleDelete, { method: 'DELETE', path: '/plots/:id' });

/**
 * Стандартизированная обработка ошибок для GET/PATCH/DELETE /api/v1/plots/:id
 *
 * @spec
 * - PlotNotFoundError → 404 Not Found
 * - PlotDuplicateError → 409 Conflict (дубликат cadastralNumber)
 * - PlotInvalidDataError → 400 Bad Request (ошибка валидации)
 * - Прочие BaseError → соответствующий HTTP-статус
 * - Неизвестные ошибки → 500 Internal Error
 *
 * @see docs/user-stories/US-15-plot-editing.md — раздел «Обработка ошибок»
 */
function errorResponse(error: unknown): NextResponse {
  // 404 Not Found — участок не найден
  if (error instanceof PlotNotFoundError) {
    return NextResponse.json(
      { success: false, error: { code: 'NOT_FOUND', message: 'Участок не найден' } },
      { status: 404 },
    );
  }

  // 409 Conflict — дубликат кадастрового номера (BR-2)
  if (error instanceof PlotDuplicateError) {
    return NextResponse.json(
      { success: false, error: { code: 'CONFLICT', message: error.message } },
      { status: 409 },
    );
  }

  // 400 Bad Request — ошибка валидации (BR-3, BR-4)
  if (error instanceof PlotInvalidDataError) {
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
