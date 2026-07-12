/**
 * @file roles/[id]/api-endpoints/[endpointId]/route.ts
 * @description Route handler для снятия API endpoint с роли (DELETE)
 */
import { NextRequest, NextResponse } from 'next/server';
import { getContainer } from '@/di/container';
import { withRoleGuard } from '@/app/api/v1/_shared/with-role-guard';
import type { BaseError } from '@/shared/errors';

type RouteContext = { params: Promise<{ id: string; endpointId: string }> };

/**
 * @route DELETE /api/v1/roles/:id/api-endpoints/:endpointId
 * @auth required
 * @role SUPER_ADMIN
 * @description Снимает API endpoint с роли
 *
 * @response 200 { success: true, data: null }
 * @response 404 { success: false, error: { code: 'NOT_FOUND', message: string } }
 *
 * @spec - Идемпотентно (составной PK)
 */
async function handleDelete(_request: NextRequest, context: RouteContext) {
  try {
    const { id, endpointId } = await context.params;
    const service = getContainer().getRoleApiEndpointService();
    await service.unassignEndpointFromRole(id, endpointId);
    return NextResponse.json({ success: true, data: null });
  } catch (error) {
    return errorResponse(error);
  }
}

// Временно отключена защита withRoleGuard — будет реализована в US-9
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
