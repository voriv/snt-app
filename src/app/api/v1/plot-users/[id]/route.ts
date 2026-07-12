/**
 * @file plot-users/[id]/route.ts
 * @description Route handlers для управления связями пользователей с участками (GET detail, PATCH update, DELETE)
 *
 * @see docs/user-stories/US-19-1-create-plot-user-relationship.md
 * @see docs/user-stories/US-19-4-update-plot-user-relationship.md
 * @see docs/user-stories/US-19-5-delete-plot-user-relationship.md
 */
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { createPlotUserRoleServiceDI } from '@/di/container';
import { withRoleGuard } from '@/app/api/v1/_shared/with-role-guard';
import type { BaseError } from '@/shared/errors';
import {
  PlotUserRoleNotFoundError,
  PlotUserRoleInvalidDataError,
} from '@/domains/plotUser/plotUser.errors';

const plotUserService = createPlotUserRoleServiceDI();

async function handleGet(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const result = await plotUserService.findById(id, true);
  return NextResponse.json({
    success: true,
    data: result,
  });
}

async function handlePatch(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const session = await auth();
  const changedBy = session?.user?.id!;
  const result = await plotUserService.update(
    id,
    {
      role: body.role,
      status: body.status,
      comment: body.comment,
      expiresAt: body.expiresAt,
    },
    changedBy
  );
  return NextResponse.json({
    success: true,
    data: result,
  });
}

async function handleDelete(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();
  const changedBy = session?.user?.id!;
  const result = await plotUserService.deactivate(id, changedBy);
  return NextResponse.json({
    success: true,
    data: result,
  });
}

export const GET = withRoleGuard(handleGet, { method: 'GET', path: '/plot-users/:id' });
export const PATCH = withRoleGuard(handlePatch, { method: 'PATCH', path: '/plot-users/:id' });
export const DELETE = withRoleGuard(handleDelete, { method: 'DELETE', path: '/plot-users/:id' });

/**
 * Стандартизированная обработка ошибок
 */
function errorResponse(error: unknown): NextResponse {
  if (error instanceof PlotUserRoleNotFoundError) {
    return NextResponse.json(
      { success: false, error: { code: 'NOT_FOUND', message: error.message } },
      { status: 404 }
    );
  }

  if (error instanceof PlotUserRoleInvalidDataError) {
    return NextResponse.json(
      {
        success: false,
        error: { code: 'VALIDATION_ERROR', message: error.message },
      },
      { status: 400 }
    );
  }

  if (error instanceof Error && 'code' in error) {
    const baseError = error as BaseError;
    return NextResponse.json(
      {
        success: false,
        error: { code: baseError.code, message: baseError.message },
      },
      { status: baseError.statusCode }
    );
  }

  console.error('PlotUser [id] route error:', error);
  return NextResponse.json(
    {
      success: false,
      error: {
        code: 'UNKNOWN_ERROR',
        message: (error as Error).message || 'Unknown error',
      },
    },
    { status: 500 }
  );
}
