/**
 * @file members/route.ts
 * @description Route handlers для управления членами СНТ (GET list, POST create)
 *
 * @see docs/user-stories/US-8-roles-management.md — API для управления членами
 */
import { NextRequest, NextResponse } from 'next/server';
import { createMemberService } from '@/di/container';
import { withRoleGuard } from '@/app/api/v1/_shared/with-role-guard';
import type { BaseError } from '@/shared/errors';

const memberService = createMemberService();

/**
 * @route GET /api/v1/members
 * @auth required
 * @role ADMIN, MANAGER
 * @description Возвращает список всех членов СНТ
 *
 * @response 200 { success: true, data: Member[] }
 * @response 401 { success: false, error: { code: 'UNAUTHORIZED', message: string } }
 * @response 403 { success: false, error: { code: 'FORBIDDEN', message: string } }
 * @response 500 { success: false, error: { code: string, message: string } }
 *
 * @spec - Возвращает всех членов, включая неактивных
 */
async function handleGet() {
  try {
    const members = await memberService.findAll();
    return NextResponse.json({
      success: true,
      data: members,
    });
  } catch (error) {
    return errorResponse(error);
  }
}

/**
 * @route POST /api/v1/members
 * @auth required
 * @role ADMIN, MANAGER
 * @description Создаёт нового члена СНТ
 *
 * @body CreateMemberInput { firstName, lastName, [birthDate?, phone?, email?, plotId?] }
 * @response 201 { success: true, data: Member }
 * @response 400 { success: false, error: { code: 'VALIDATION_ERROR', message: string } }
 * @response 401 { success: false, error: { code: 'UNAUTHORIZED', message: string } }
 * @response 403 { success: false, error: { code: 'FORBIDDEN', message: string } }
 * @response 409 { success: false, error: { code: 'CONFLICT', message: string } }
 *
 * @spec
 * - Валидация тела запроса через Zod в сервисе
 * - При дублировании email → 409 Conflict
 */
async function handlePost(request: NextRequest) {
  try {
    const body = await request.json();
    const member = await memberService.create(body);
    return NextResponse.json(
      {
        success: true,
        data: member,
      },
      { status: 201 },
    );
  } catch (error) {
    return errorResponse(error);
  }
}

export const GET = withRoleGuard(handleGet, { method: 'GET', path: '/members' });
export const POST = withRoleGuard(handlePost, { method: 'POST', path: '/members' });

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
