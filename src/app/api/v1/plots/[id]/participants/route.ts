/**
 * @file participants/route.ts
 * @description Route handlers для управления участниками участка (GET)
 *
 * @see docs/user-stories/US-19-2-participant-list.md — просмотр участников участка
 */
import { NextRequest, NextResponse } from 'next/server';
import { createPlotUserRoleServiceDI } from '@/di/container';
import { withRoleGuard } from '@/app/api/v1/_shared/with-role-guard';
import type { BaseError } from '@/shared/errors';
import {
  PlotUserRoleNotFoundError,
  PlotUserRoleDuplicateError,
  PlotUserRoleInvalidDataError,
} from '@/domains/plotUser/plotUser.errors';

const plotUserRoleService = createPlotUserRoleServiceDI();

/**
 * @route GET /api/v1/plots/:id/participants
 * @auth required
 * @description Возвращает список всех участников участка с фильтрацией и поиском
 *
 * @query status - Фильтр по статусу (active, pending, expired)
 * @query role - Фильтр по роли (1=owner, 2=resident, 3=representative)
 * @query search - Поисковый запрос по имени/email
 * @query page - Номер страницы (по умолчанию: 1)
 * @query limit - Количество записей на страницу (по умолчанию: 25)
 *
 * @response 200 { success: true, data: PlotUserRoleParticipant[], total: number, page: number, limit: number, totalPages: number }
 * @response 401 { success: false, error: { code: 'UNAUTHORIZED', message: string } }
 * @response 403 { success: false, error: { code: 'FORBIDDEN', message: string } }
 * @response 404 { success: false, error: { code: 'NOT_FOUND', message: string } }
 * @response 500 { success: false, error: { code: 'INTERNAL_ERROR', message: string } }
 *
 * @spec
 * - Сортировка: active → pending → expired, затем assignedAt DESC (AC-1.3)
 * - Пагинация: по умолчанию page=1, limit=25 (BR-6)
 * - Поиск: case-insensitive по firstName, lastName, email (FR-5)
 * - Фильтрация по role и status (FR-3, FR-4)
 *
 * @data-flow
 * - apiClient.get('/plots/:id/participants?status=...&role=...&search=...') → GET handler → PlotUserRoleService.findByPlot → IPlotUserRoleRepository.findByPlot
 */
async function handleGet(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  
  try {
    const { searchParams } = new URL(request.url);
    
    const status = searchParams.get('status') as 'active' | 'pending' | 'expired' | null;
    const role = searchParams.get('role');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '25', 10);

    const filter = {
      ...(status && { status }),
      ...(role && { role: parseInt(role, 10) as 1 | 2 | 3 }),
      ...(search && { search }),
      page,
      limit,
    };

    const participants = await plotUserRoleService.findByPlot(id, filter);
    
    console.log('[ParticipantsAPI] id:', id);
    console.log('[ParticipantsAPI] filter:', filter);
    console.log('[ParticipantsAPI] participants count:', participants.length);
    console.log('[ParticipantsAPI] participants:', JSON.stringify(participants, null, 2));
    
    // Получаем общее количество для пагинации (без учета пагинации, но с фильтрами)
    const totalFilter = {
      ...(status && { status }),
      ...(role && { role: parseInt(role, 10) as 1 | 2 | 3 }),
      ...(search && { search }),
    };
    
    // Для получения totalCount делаем дополнительный запрос
    // В реальной production системе можно оптимизировать через DISTINCT count
    const total = participants.length + (page * limit <= participants.length ? 0 : 0);
    
    // Получаем полное количество без пагинации
    const allParticipants = await plotUserRoleService.findByPlot(id, totalFilter);
    const totalCount = allParticipants.length;

    console.log('[ParticipantsAPI] totalCount:', totalCount);

    const response = {
      success: true,
      data: participants,
      total: totalCount,
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit),
    };

    return NextResponse.json(response);
  } catch (error) {
    return errorResponse(error);
  }
}

export const GET = withRoleGuard(handleGet, { method: 'GET', path: '/plots/:id/participants' });

/**
 * Стандартизированная обработка ошибок для GET /api/v1/plots/:id/participants
 *
 * @spec
 * - PlotUserRoleNotFoundError → 404 Not Found (участок не найден)
 * - PlotUserRoleInvalidDataError → 400 Bad Request
 * - Прочие BaseError → соответствующий HTTP-статус
 * - Неизвестные ошибки → 500 Internal Error
 */
function errorResponse(error: unknown): NextResponse {
  // 404 Not Found — участок не найден
  if (error instanceof PlotUserRoleNotFoundError) {
    return NextResponse.json(
      { success: false, error: { code: 'NOT_FOUND', message: error.message } },
      { status: 404 },
    );
  }

  // 409 Conflict — дубликат связи
  if (error instanceof PlotUserRoleDuplicateError) {
    return NextResponse.json(
      { success: false, error: { code: 'CONFLICT', message: error.message } },
      { status: 409 },
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
