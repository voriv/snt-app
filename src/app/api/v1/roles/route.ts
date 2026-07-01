/**
 * @file roles/route.ts
 * @description Route handlers для управления ролями (GET list, POST create)
 *
 * @see docs/user-stories/US-8-roles-management.md — FR-2, FR-3, API
 */
import { NextRequest, NextResponse } from 'next/server';
import { getContainer } from '@/di/container';
import { withRoleGuard } from '@/app/api/v1/_shared/with-role-guard';
import type { BaseError } from '@/shared/errors';

/**
 * @route GET /api/v1/roles
 * @auth required
 * @role SUPER_ADMIN
 * @description Возвращает список всех ролей
 *
 * @response 200 { success: true, data: Role[] }
 * @response 401 { success: false, error: { code: 'UNAUTHORIZED', message: string } }
 * @response 403 { success: false, error: { code: 'FORBIDDEN', message: string } }
 * @response 500 { success: false, error: { code: string, message: string } }
 *
 * @spec
 * - Доступ только для SUPER_ADMIN (через withRoleGuard)
 * - Возвращает все роли, включая системные
 * - Без пагинации
 */
async function handleGet() {
  try {
    const service = getContainer().getRoleService();
    const roles = await service.findAll();
    return NextResponse.json({ success: true, data: roles });
  } catch (error) {
    return errorResponse(error);
  }
}

/**
 * @route POST /api/v1/roles
 * @auth required
 * @role SUPER_ADMIN
 * @description Создаёт новую роль
 *
 * @body CreateRoleInput { name: string, description?: string }
 * @response 201 { success: true, data: Role }
 * @response 400 { success: false, error: { code: 'VALIDATION_ERROR', message: string } }
 * @response 401 { success: false, error: { code: 'UNAUTHORIZED', message: string } }
 * @response 403 { success: false, error: { code: 'FORBIDDEN', message: string } }
 * @response 409 { success: false, error: { code: 'CONFLICT', message: string } }
 *
 * @spec
 * - is_system всегда false при создании через API
 * - Валидация через createRoleSchema в сервисе
 * - При дублировании имени → 409 Conflict
 */
async function handlePost(request: NextRequest) {
  try {
    const body = await request.json();
    const service = getContainer().getRoleService();
    const role = await service.create(body);
    return NextResponse.json({ success: true, data: role }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}

export const GET = withRoleGuard(handleGet, { method: 'GET', path: '/roles' });
export const POST = withRoleGuard(handlePost, { method: 'POST', path: '/roles' });

/**
 * Стандартизированная обработка ошибок
 */
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
