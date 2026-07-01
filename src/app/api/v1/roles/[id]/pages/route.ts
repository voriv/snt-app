/**
 * @file roles/[id]/pages/route.ts
 * @description Route handlers для управления страницами роли (GET list, POST assign)
 */
import { NextRequest, NextResponse } from 'next/server';
import { getContainer } from '@/di/container';
import { withRoleGuard } from '@/app/api/v1/_shared/with-role-guard';
import type { BaseError } from '@/shared/errors';

type RouteContext = { params: Promise<{ id: string }> };

/**
 * @route GET /api/v1/roles/:id/pages
 * @auth required
 * @role SUPER_ADMIN
 * @description Возвращает страницы, назначенные роли
 *
 * @response 200 { success: true, data: Page[] }
 */
async function handleGet(_request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const service = getContainer().getRoleService();
    const pages = await service.getRolePages(id);
    return NextResponse.json({ success: true, data: pages });
  } catch (error) {
    return errorResponse(error);
  }
}

/**
 * @route POST /api/v1/roles/:id/pages
 * @auth required
 * @role SUPER_ADMIN
 * @description Назначает странице роли
 *
 * @body { pageId: string }
 * @response 201 { success: true, data: null }
 * @response 404 { success: false, error: { code: 'NOT_FOUND', message: string } }
 *
 * @spec - Идемпотентно (составной PK)
 */
async function handlePost(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const { pageId } = await request.json();
    const service = getContainer().getRoleService();
    await service.assignPageToRole(id, pageId);
    return NextResponse.json({ success: true, data: null }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}

export const GET = withRoleGuard(handleGet, { method: 'GET', path: '/roles/:id/pages' });
export const POST = withRoleGuard(handlePost, { method: 'POST', path: '/roles/:id/pages' });

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
