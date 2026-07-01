/**
 * @file users/route.ts
 * @description Route handler для поиска пользователей (UserSearch при добавлении участников в роль)
 */
import { NextRequest, NextResponse } from 'next/server';
import { getContainer } from '@/di/container';
import { withRoleGuard } from '@/app/api/v1/_shared/with-role-guard';
import type { BaseError } from '@/shared/errors';

/**
 * @route GET /api/v1/users?q=<query>
 * @auth required
 * @role SUPER_ADMIN
 * @description Поиск пользователей по email или имени для добавления в роль
 *
 * @query q — строка поиска (минимум 2 символа)
 * @response 200 { success: true, data: UserData[] }
 * @response 400 { success: false, error: { code: 'VALIDATION_ERROR', message: string } }
 *
 * @spec - Поиск по частичному совпадению email или name, case-insensitive, максимум 20 результатов
 */
async function handleGet(request: NextRequest) {
  try {
    const q = request.nextUrl.searchParams.get('q') ?? '';
    if (q.trim().length < 2) {
      return NextResponse.json({ success: true, data: [] });
    }
    const service = getContainer().getRoleService();
    const users = await service.searchUsers(q);
    return NextResponse.json({ success: true, data: users });
  } catch (error) {
    return errorResponse(error);
  }
}

export const GET = withRoleGuard(handleGet, { method: 'GET', path: '/users' });

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
