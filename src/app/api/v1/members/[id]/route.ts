/**
 * @file members/[id]/route.ts
 * @description Route handlers для управления отдельным членом СНТ (GET, PUT)
 *
 * @see docs/user-stories/US-8-roles-management.md — API для управления членами
 */
import { NextRequest, NextResponse } from 'next/server';
import { createMemberService } from '@/di/container';
import { withRoleGuard } from '@/app/api/v1/_shared/with-role-guard';
import type { BaseError } from '@/shared/errors';

const memberService = createMemberService();

/**
 * @route GET /api/v1/members/:id
 * @auth required
 * @role ADMIN, MANAGER
 * @description Возвращает члена СНТ по ID
 *
 * @response 200 { success: true, data: Member }
 * @response 401 { success: false, error: { code: 'UNAUTHORIZED', message: string } }
 * @response 403 { success: false, error: { code: 'FORBIDDEN', message: string } }
 * @response 404 { success: false, error: { code: 'NOT_FOUND', message: string } }
 * @response 500 { success: false, error: { code: string, message: string } }
 */
async function handleGet(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const member = await memberService.findById(id);
    return NextResponse.json({
      success: true,
      data: member,
    });
  } catch (error) {
    return errorResponse(error);
  }
}

/**
 * @route PUT /api/v1/members/:id
 * @auth required
 * @role ADMIN, MANAGER
 * @description Обновляет члена СНТ
 *
 * @body UpdateMemberInput { firstName?, lastName?, birthDate?, phone?, email?, plotId? }
 * @response 200 { success: true, data: Member }
 * @response 400 { success: false, error: { code: 'VALIDATION_ERROR', message: string } }
 * @response 401 { success: false, error: { code: 'UNAUTHORIZED', message: string } }
 * @response 403 { success: false, error: { code: 'FORBIDDEN', message: string } }
 * @response 404 { success: false, error: { code: 'NOT_FOUND', message: string } }
 * @response 409 { success: false, error: { code: 'CONFLICT', message: string } }
 *
 * @spec - Валидация тела запроса через Zod в сервисе
 * @spec - При дублировании email → 409 Conflict
 */
async function handlePut(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const member = await memberService.update(id, body);
    return NextResponse.json({
      success: true,
      data: member,
    });
  } catch (error) {
    return errorResponse(error);
  }
}

export const GET = withRoleGuard(handleGet, { method: 'GET', path: '/members/:id' });
export const PUT = withRoleGuard(handlePut, { method: 'PUT', path: '/members/:id' });

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
