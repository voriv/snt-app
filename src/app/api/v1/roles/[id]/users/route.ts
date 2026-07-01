/**
 * @file roles/[id]/users/route.ts
 * @description Route handlers для управления участниками роли (GET list, POST add)
 */
import { NextRequest, NextResponse } from 'next/server';
import { getContainer } from '@/di/container';
import { withRoleGuard } from '@/app/api/v1/_shared/with-role-guard';
import type { BaseError } from '@/shared/errors';

type RouteContext = { params: Promise<{ id: string }> };

/**
 * @route GET /api/v1/roles/:id/users
 * @auth required
 * @role SUPER_ADMIN
 * @description Возвращает участников роли
 *
 * @response 200 { success: true, data: UserData[] }
 * @response 404 { success: false, error: { code: 'NOT_FOUND', message: string } }
 */
async function handleGet(_request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const service = getContainer().getRoleService();
    const users = await service.getRoleUsers(id);
    return NextResponse.json({ success: true, data: users });
  } catch (error) {
    return errorResponse(error);
  }
}

/**
 * @route POST /api/v1/roles/:id/users
 * @auth required
 * @role SUPER_ADMIN
 * @description Добавляет пользователя в роль
 *
 * @body { userId: string }
 * @response 201 { success: true, data: null }
 * @response 400 { success: false, error: { code: 'VALIDATION_ERROR', message: string } }
 * @response 404 { success: false, error: { code: 'NOT_FOUND', message: string } }
 *
 * @spec - Идемпотентно (составной PK)
 */
async function handlePost(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const { userId } = await request.json();
    const service = getContainer().getRoleService();
    await service.addUserToRole(id, userId);
    return NextResponse.json({ success: true, data: null }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}

export const GET = withRoleGuard(handleGet, { method: 'GET', path: '/roles/:id/users' });
export const POST = withRoleGuard(handlePost, { method: 'POST', path: '/roles/:id/users' });

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
