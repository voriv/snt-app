/**
 * @file participants/[participantId]/route.ts
 * @description API endpoint для удаления участника из участка (DELETE)
 *
 * @see docs/user-stories/US-19-5-delete-plot-user-relationship.md — удаление связи пользователь-участок
 */
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { createPlotUserRoleServiceDI } from '@/di/container';
import { withRoleGuard } from '@/app/api/v1/_shared/with-role-guard';
import type { BaseError } from '@/shared/errors';
import {
  PlotUserRoleNotFoundError,
  PlotUserRoleInvalidDataError,
} from '@/domains/plotUser/plotUser.errors';

const plotUserRoleService = createPlotUserRoleServiceDI();

/**
 * @route DELETE /api/v1/plots/:id/participants/:participantId
 * @auth required
 * @role ADMIN, SUPER_ADMIN
 * @description Удаляет связь пользователя с участком (физическое удаление)
 *
 * @path id - Уникальный идентификатор участка
 * @path participantId - Уникальный идентификатор связи (PlotUserRole)
 *
 * @response 200 { success: true, data: PlotUserRole }
 * @response 401 { success: false, error: { code: 'UNAUTHORIZED', message: string } }
 * @response 403 { success: false, error: { code: 'FORBIDDEN', message: string } }
 * @response 404 { success: false, error: { code: 'NOT_FOUND', message: string } }
 * @response 500 { success: false, error: { code: 'INTERNAL_ERROR', message: string } }
 *
 * @spec
 * - Физическое удаление записи из БД (не soft delete)
 * - Требует роли ADMIN или SUPER_ADMIN
 * - participantId должен указывать на существующую связь
 *
 * @data-flow
 * - apiClient.delete('/plots/:id/participants/:participantId') → DELETE handler → PlotUserRoleService.delete → IPlotUserRoleRepository.delete
 */
async function handleDelete(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; participantId: string }> }
) {
  const { participantId } = await params;
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, error: { code: 'UNAUTHORIZED', message: 'Требуется авторизация' } },
      { status: 401 }
    );
  }

  try {
    const changedBy = session.user.id;
    const result = await plotUserRoleService.delete(participantId, changedBy);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    return errorResponse(error);
  }
}

export const DELETE = withRoleGuard(handleDelete, {
  method: 'DELETE',
  path: '/plots/:id/participants/:participantId',
});

/**
 * Стандартизированная обработка ошибок для DELETE /api/v1/plots/:id/participants/:participantId
 *
 * @spec
 * - PlotUserRoleNotFoundError → 404 Not Found (связь не найдена)
 * - PlotUserRoleInvalidDataError → 400 Bad Request (ошибка валидации)
 * - Прочие BaseError → соответствующий HTTP-статус
 * - Неизвестные ошибки → 500 Internal Error
 */
function errorResponse(error: unknown): NextResponse {
  // 404 Not Found — связь не найдена
  if (error instanceof PlotUserRoleNotFoundError) {
    return NextResponse.json(
      { success: false, error: { code: 'NOT_FOUND', message: error.message } },
      { status: 404 }
    );
  }

  // 400 Bad Request — ошибка валидации
  if (error instanceof PlotUserRoleInvalidDataError) {
    return NextResponse.json(
      { success: false, error: { code: 'VALIDATION_ERROR', message: error.message } },
      { status: 400 }
    );
  }

  // BaseError с собственным statusCode
  if (error instanceof Error && 'code' in error) {
    const baseError = error as BaseError;
    return NextResponse.json(
      { success: false, error: { code: baseError.code, message: baseError.message } },
      { status: baseError.statusCode }
    );
  }

  // 500 Internal Error — неизвестная ошибка
  return NextResponse.json(
    {
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Внутренняя ошибка сервера' },
    },
    { status: 500 }
  );
}
