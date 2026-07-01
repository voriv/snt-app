/**
 * @file roles/[id]/api-endpoints/route.ts
 * @description Route handlers для управления API endpoints роли (GET list, POST assign)
 */
import { NextRequest, NextResponse } from 'next/server';
import { getContainer } from '@/di/container';
import { withRoleGuard } from '@/app/api/v1/_shared/with-role-guard';
import type { BaseError } from '@/shared/errors';

type RouteContext = { params: Promise<{ id: string }> };

/**
 * @route GET /api/v1/roles/:id/api-endpoints
 * @auth required
 * @role SUPER_ADMIN
 * @description Возвращает API endpoints, назначенные роли
 *
 * @response 200 { success: true, data: ApiEndpoint[] }
 */
async function handleGet(_request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const service = getContainer().getRoleApiEndpointService();
    const endpoints = await service.getRoleEndpoints(id);
    return NextResponse.json({ success: true, data: endpoints });
  } catch (error) {
    return errorResponse(error);
  }
}

/**
 * @route POST /api/v1/roles/:id/api-endpoints
 * @auth required
 * @role SUPER_ADMIN
 * @description Назначает API endpoint роли
 *
 * @body { apiEndpointId: string }
 * @response 201 { success: true, data: null }
 * @response 404 { success: false, error: { code: 'NOT_FOUND', message: string } }
 *
 * @spec - Идемпотентно (составной PK)
 */
async function handlePost(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const { apiEndpointId } = await request.json();
    const service = getContainer().getRoleApiEndpointService();
    await service.assignEndpointToRole(id, apiEndpointId);
    return NextResponse.json({ success: true, data: null }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}

export const GET = withRoleGuard(handleGet, { method: 'GET', path: '/roles/:id/api-endpoints' });
export const POST = withRoleGuard(handlePost, { method: 'POST', path: '/roles/:id/api-endpoints' });

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
