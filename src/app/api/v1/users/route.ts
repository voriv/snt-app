/**
 * @file users/route.ts
 * @description Route handler для списка пользователей
 */
import { NextRequest, NextResponse } from 'next/server';
import { getContainer } from '@/di/container';
import { withRoleGuard } from '@/app/api/v1/_shared/with-role-guard';
import type { BaseError } from '@/shared/errors';

/**
 * @route GET /api/v1/users
 * @auth required
 * @role SUPER_ADMIN
 * @description Список пользователей с пагинацией, поиском и сортировкой
 *
 * @query page — номер страницы (default: 1)
 * @query limit — количество записей (default: 25, max: 100)
 * @query q — текст поиска по email, firstName, lastName (опционально)
 * @query sort — поле сортировки: email, firstName, lastName, createdAt (default: createdAt)
 * @query order — направление сортировки: asc, desc (default: desc)
 * @response 200 { success: true, data: { items: UserListItem[], total: number, page: number, limit: number } }
 * @response 400 { success: false, error: { code: string, message: string } }
 * @response 403 { success: false, error: { code: string, message: string } }
 *
 * @spec
 * - Пагинация через query параметры page/limit
 * - Поиск через query параметр q (по email, firstName, lastName)
 * - Сортировка через query параметры sort/order
 * - Доступ только для SUPER_ADMIN
 */
async function handleGet(request: NextRequest) {
  try {
    const service = getContainer().getUsersService();
    const query = Object.fromEntries(request.nextUrl.searchParams.entries());
    const result = await service.findAllUsers(query);
    return NextResponse.json({ success: true, data: result });
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
