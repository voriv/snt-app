/**
 * @file pages/[id]/route.ts
 * @description Route handlers для управления отдельной страницей (PATCH, DELETE)
 */
import { NextRequest, NextResponse } from 'next/server';
import { getContainer } from '@/di/container';
import { withRoleGuard } from '@/app/api/v1/_shared/with-role-guard';
import type { BaseError } from '@/shared/errors';

type RouteContext = { params: Promise<{ id: string }> };

/**
 * @route PATCH /api/v1/pages/:id
 * @auth required
 * @role SUPER_ADMIN
 * @description Обновляет страницу
 *
 * @body UpdatePageInput { path?, title?, groupName?, sortOrder?, isActive? }
 * @response 200 { success: true, data: Page }
 * @response 400 { success: false, error: { code: 'VALIDATION_ERROR', message: string } }
 * @response 404 { success: false, error: { code: 'NOT_FOUND', message: string } }
 * @response 409 { success: false, error: { code: 'CONFLICT', message: string } }
 */
async function handlePatch(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const service = getContainer().getPageService();
    const page = await service.update(id, body);
    return NextResponse.json({ success: true, data: page });
  } catch (error) {
    return errorResponse(error);
  }
}

/**
 * @route DELETE /api/v1/pages/:id
 * @auth required
 * @role SUPER_ADMIN
 * @description Удаляет страницу
 *
 * @response 200 { success: true, data: null }
 * @response 404 { success: false, error: { code: 'NOT_FOUND', message: string } }
 *
 * @spec - Каскадно удаляются role_pages (БД CASCADE)
 */
async function handleDelete(_request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const service = getContainer().getPageService();
    await service.delete(id);
    return NextResponse.json({ success: true, data: null });
  } catch (error) {
    return errorResponse(error);
  }
}

export const PATCH = withRoleGuard(handlePatch, { method: 'PATCH', path: '/pages/:id' });
export const DELETE = withRoleGuard(handleDelete, { method: 'DELETE', path: '/pages/:id' });

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
