/**
 * @file roles/[id]/route.ts
 * @description Route handlers для управления отдельной ролью (GET, PATCH, DELETE)
 */
import { NextRequest, NextResponse } from 'next/server';
import { getContainer } from '@/di/container';
import { withRoleGuard } from '@/app/api/v1/_shared/with-role-guard';
import type { BaseError } from '@/shared/errors';

type RouteContext = { params: Promise<{ id: string }> };

/**
 * @route GET /api/v1/roles/:id
 * @auth required
 * @role SUPER_ADMIN
 * @description Возвращает роль по ID
 *
 * @response 200 { success: true, data: Role }
 * @response 404 { success: false, error: { code: 'NOT_FOUND', message: string } }
 *
 * @spec - При отсутствии роли → 404 RoleNotFoundError
 */
async function handleGet(_request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const service = getContainer().getRoleService();
    const role = await service.findById(id);
    return NextResponse.json({ success: true, data: role });
  } catch (error) {
    return errorResponse(error);
  }
}

/**
 * @route PATCH /api/v1/roles/:id
 * @auth required
 * @role SUPER_ADMIN
 * @description Обновляет роль
 *
 * @body UpdateRoleInput { name?: string, description?: string }
 * @response 200 { success: true, data: Role }
 * @response 400 { success: false, error: { code: 'VALIDATION_ERROR', message: string } }
 * @response 403 { success: false, error: { code: 'FORBIDDEN', message: string } }
 * @response 404 { success: false, error: { code: 'NOT_FOUND', message: string } }
 * @response 409 { success: false, error: { code: 'CONFLICT', message: string } }
 *
 * @spec - Для системных ролей name игнорируется (RoleSystemProtectedError → 403)
 */
async function handlePatch(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const service = getContainer().getRoleService();
    const role = await service.update(id, body);
    return NextResponse.json({ success: true, data: role });
  } catch (error) {
    return errorResponse(error);
  }
}

/**
 * @route DELETE /api/v1/roles/:id
 * @auth required
 * @role SUPER_ADMIN
 * @description Удаляет роль
 *
 * @response 200 { success: true, data: null }
 * @response 403 { success: false, error: { code: 'FORBIDDEN', message: string } }
 * @response 404 { success: false, error: { code: 'NOT_FOUND', message: string } }
 * @response 409 { success: false, error: { code: 'CONFLICT', message: string } }
 *
 * @spec - Только несистемные роли (RoleSystemProtectedError → 403). Защита последнего SUPER_ADMIN (LastSuperAdminError → 409)
 */
async function handleDelete(_request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const service = getContainer().getRoleService();
    await service.delete(id);
    return NextResponse.json({ success: true, data: null });
  } catch (error) {
    return errorResponse(error);
  }
}

// Временно отключена защита withRoleGuard — будет реализована в US-9
export const GET = handleGet;
export const PATCH = handlePatch;
export const DELETE = handleDelete;

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
