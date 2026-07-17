/**
 * @file users/[id]/connections/route.ts
 * @description Route handler для получения связей пользователя с участками
 */
import { NextRequest, NextResponse } from 'next/server';
import { getContainer } from '@/di/container';
import { withRoleGuard } from '@/app/api/v1/_shared/with-role-guard';
import type { BaseError } from '@/shared/errors';
import { UserNotFoundError } from '@/domains/users';

/**
 * @route GET /api/v1/users/:id/connections
 * @auth required
 * @role SUPER_ADMIN
 * @description Получить список связей пользователя с участками
 *
 * @param id — уникальный идентификатор пользователя
 * @response 200 { success: true, data: UserPlotConnection[] }
 * @response 400 { success: false, error: { code: string, message: string } }
 * @response 403 { success: false, error: { code: string, message: string } }
 * @response 404 { success: false, error: { code: string, message: string } }
 *
 * @spec
 * - Возвращает массив UserPlotConnection с данными участков
 * - При отсутствии пользователя — 404
 * - При отсутствии связей — пустой массив
 * - Доступ только для SUPER_ADMIN
 *
 * @see US-20-04
 */
async function handleGet(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'ID пользователя не указан' } },
        { status: 400 },
      );
    }
    const service = getContainer().getUsersService();
    const connections = await service.findUserPlotConnections(id);
    return NextResponse.json({ success: true, data: connections });
  } catch (error) {
    if (error instanceof UserNotFoundError) {
      return NextResponse.json(
        { success: false, error: { code: error.code, message: error.message } },
        { status: error.statusCode },
      );
    }
    if (error instanceof Error && 'code' in error) {
      const baseError = error as unknown as BaseError;
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
}

export const GET = withRoleGuard(handleGet, { method: 'GET', path: '/users/:id/connections' });
