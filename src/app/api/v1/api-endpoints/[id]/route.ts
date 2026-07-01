/**
 * @file api-endpoints/[id]/route.ts
 * @description Route handlers для управления отдельным API endpoint (PATCH, DELETE)
 */
import { NextRequest, NextResponse } from 'next/server';
import { getContainer } from '@/di/container';
import { withRoleGuard } from '@/app/api/v1/_shared/with-role-guard';
import type { BaseError } from '@/shared/errors';

type RouteContext = { params: Promise<{ id: string }> };

/**
 * @route PATCH /api/v1/api-endpoints/:id
 * @auth required
 * @role SUPER_ADMIN
 * @description Обновляет API endpoint
 *
 * @body UpdateApiEndpointInput { method?, path?, description?, accessType?, isActive? }
 * @response 200 { success: true, data: ApiEndpoint }
 * @response 400 { success: false, error: { code: 'VALIDATION_ERROR', message: string } }
 * @response 404 { success: false, error: { code: 'NOT_FOUND', message: string } }
 * @response 409 { success: false, error: { code: 'CONFLICT', message: string } }
 */
async function handlePatch(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const service = getContainer().getApiEndpointService();
    const endpoint = await service.update(id, body);
    return NextResponse.json({ success: true, data: endpoint });
  } catch (error) {
    return errorResponse(error);
  }
}

/**
 * @route DELETE /api/v1/api-endpoints/:id
 * @auth required
 * @role SUPER_ADMIN
 * @description Удаляет API endpoint
 *
 * @response 200 { success: true, data: null }
 * @response 404 { success: false, error: { code: 'NOT_FOUND', message: string } }
 *
 * @spec - Каскадно удаляются role_api_endpoints (БД CASCADE)
 */
async function handleDelete(_request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const service = getContainer().getApiEndpointService();
    await service.delete(id);
    return NextResponse.json({ success: true, data: null });
  } catch (error) {
    return errorResponse(error);
  }
}

export const PATCH = withRoleGuard(handlePatch, { method: 'PATCH', path: '/api-endpoints/:id' });
export const DELETE = withRoleGuard(handleDelete, { method: 'DELETE', path: '/api-endpoints/:id' });

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
