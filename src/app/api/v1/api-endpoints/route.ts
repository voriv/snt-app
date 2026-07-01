/**
 * @file api-endpoints/route.ts
 * @description Route handlers для управления реестром API endpoints (GET list, POST create)
 */
import { NextRequest, NextResponse } from 'next/server';
import { getContainer } from '@/di/container';
import { withRoleGuard } from '@/app/api/v1/_shared/with-role-guard';
import type { BaseError } from '@/shared/errors';

/**
 * @route GET /api/v1/api-endpoints
 * @auth required
 * @role SUPER_ADMIN
 * @description Возвращает список всех API endpoints реестра
 *
 * @response 200 { success: true, data: ApiEndpoint[] }
 */
async function handleGet() {
  try {
    const service = getContainer().getApiEndpointService();
    const endpoints = await service.findAll();
    return NextResponse.json({ success: true, data: endpoints });
  } catch (error) {
    return errorResponse(error);
  }
}

/**
 * @route POST /api/v1/api-endpoints
 * @auth required
 * @role SUPER_ADMIN
 * @description Создаёт новый API endpoint
 *
 * @body CreateApiEndpointInput { method, path, description?, accessType?, isActive? }
 * @response 201 { success: true, data: ApiEndpoint }
 * @response 400 { success: false, error: { code: 'VALIDATION_ERROR', message: string } }
 * @response 409 { success: false, error: { code: 'CONFLICT', message: string } }
 *
 * @spec - Уникальная комбинация (method, path). При дублировании → 409 Conflict
 */
async function handlePost(request: NextRequest) {
  try {
    const body = await request.json();
    const service = getContainer().getApiEndpointService();
    const endpoint = await service.create(body);
    return NextResponse.json({ success: true, data: endpoint }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}

export const GET = withRoleGuard(handleGet, { method: 'GET', path: '/api-endpoints' });
export const POST = withRoleGuard(handlePost, { method: 'POST', path: '/api-endpoints' });

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
