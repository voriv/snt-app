/**
 * @file pages/route.ts
 * @description Route handlers для управления реестром страниц (GET list, POST create)
 */
import { NextRequest, NextResponse } from 'next/server';
import { getContainer } from '@/di/container';
import { withRoleGuard } from '@/app/api/v1/_shared/with-role-guard';
import type { BaseError } from '@/shared/errors';

/**
 * @route GET /api/v1/pages
 * @auth required
 * @role SUPER_ADMIN
 * @description Возвращает список всех страниц реестра
 *
 * @response 200 { success: true, data: Page[] }
 * @response 403 { success: false, error: { code: 'FORBIDDEN', message: string } }
 *
 * @spec - Возвращает все страницы реестра, включая неактивные
 */
async function handleGet() {
  try {
    const service = getContainer().getPageService();
    const pages = await service.findAll();
    return NextResponse.json({ success: true, data: pages });
  } catch (error) {
    return errorResponse(error);
  }
}

/**
 * @route POST /api/v1/pages
 * @auth required
 * @role SUPER_ADMIN
 * @description Создаёт новую страницу
 *
 * @body CreatePageInput { path, title, groupName?, sortOrder?, isActive? }
 * @response 201 { success: true, data: Page }
 * @response 400 { success: false, error: { code: 'VALIDATION_ERROR', message: string } }
 * @response 409 { success: false, error: { code: 'CONFLICT', message: string } }
 *
 * @spec - path уникальный, начинается с /. При дублировании → 409 Conflict
 */
async function handlePost(request: NextRequest) {
  try {
    const body = await request.json();
    const service = getContainer().getPageService();
    const page = await service.create(body);
    return NextResponse.json({ success: true, data: page }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}

export const GET = withRoleGuard(handleGet, { method: 'GET', path: '/pages' });
export const POST = withRoleGuard(handlePost, { method: 'POST', path: '/pages' });

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
