/**
 * @file roles/[id]/users/[userId]/route.ts
 * @description Route handler для исключения пользователя из роли (DELETE)
 */
import { NextRequest, NextResponse } from 'next/server';
import { getContainer } from '@/di/container';
import { withRoleGuard } from '@/app/api/v1/_shared/with-role-guard';
import type { BaseError } from '@/shared/errors';

type RouteContext = { params: Promise<{ id: string; userId: string }> };

/**
 * @route DELETE /api/v1/roles/:id/users/:userId
 * @auth required
 * @role SUPER_ADMIN
 * @description Исключает пользователя из роли
 *
 * @response 200 { success: true, data: null }
 * @response 403 { success: false, error: { code: 'FORBIDDEN', message: string } }
 * @response 404 { success: false, error: { code: 'NOT_FOUND', message: string } }
 * @response 409 { success: false, error: { code: 'CONFLICT', message: string } }
 *
 * @spec - Идемпотентно. Защита последнего SUPER_ADMIN (LastSuperAdminError → 409)
 */
async function handleDelete(_request: NextRequest, context: RouteContext) {
  try {
    const { id, userId } = await context.params;
    const service = getContainer().getRoleService();
    await service.removeUserFromRole(id, userId);
    return NextResponse.json({ success: true, data: null });
  } catch (error) {
    return errorResponse(error);
  }
}

export const DELETE = withRoleGuard(handleDelete, {
  method: 'DELETE',
  path: '/roles/:id/users/:userId',
});

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
