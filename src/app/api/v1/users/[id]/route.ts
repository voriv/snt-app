/**
 * @file users/[id]/route.ts
 * @description Route handler для получения пользователя по ID
 */
import { NextRequest, NextResponse } from 'next/server';
import { getContainer } from '@/di/container';
import { withRoleGuard } from '@/app/api/v1/_shared/with-role-guard';
import type { BaseError } from '@/shared/errors';
import { UserNotFoundError } from '@/domains/users';

/**
 * @route GET /api/v1/users/:id
 * @auth required
 * @role SUPER_ADMIN
 * @description Получить детальную информацию о пользователе с профилем и ролями
 *
 * @param id — уникальный идентификатор пользователя
 * @response 200 { success: true, data: UserDetail }
 * @response 400 { success: false, error: { code: string, message: string } }
 * @response 403 { success: false, error: { code: string, message: string } }
 * @response 404 { success: false, error: { code: string, message: string } }
 *
 * @spec
 * - Возвращает полный объект UserDetail с профилем и ролями
 * - При отсутствии пользователя — 404
 * - Доступ только для SUPER_ADMIN
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
    const user = await service.findUserById(id);
    return NextResponse.json({ success: true, data: user });
  } catch (error) {
    if (error instanceof UserNotFoundError) {
      return NextResponse.json(
        { success: false, error: { code: error.code, message: error.message } },
        { status: error.statusCode },
      );
    }
    return errorResponse(error);
  }
}

export const GET = withRoleGuard(handleGet, { method: 'GET', path: '/users/:id' });

function errorResponse(error: unknown): NextResponse {
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
