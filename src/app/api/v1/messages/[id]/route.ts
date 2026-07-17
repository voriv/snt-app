/**
 * @file messages/[id]/route.ts
 * @description Route handler для операций с отдельным сообщением
 */
import { NextRequest, NextResponse } from 'next/server';
import { getContainer } from '@/di/container';
import { auth } from '@/lib/auth';
import type { BaseError } from '@/shared/errors';

/**
 * @route DELETE /api/v1/messages/:id
 * @auth required
 * @description Удалить сообщение (soft delete)
 *
 * @param id - ID сообщения
 * @response 200 { success: true }
 * @response 400 { success: false, error: { code: string, message: string } }
 * @response 401 { success: false, error: { code: string, message: string } }
 * @response 403 { success: false, error: { code: string, message: string } }
 * @response 404 { success: false, error: { code: string, message: string } }
 *
 * @spec
 * - Требуется авторизация
 * - Можно удалить только своё сообщение
 * - Выполняется мягкое удаление (isDeleted=true)
 */
async function handleDelete(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Необходима авторизация' } },
        { status: 401 }
      );
    }

    const { id: messageId } = await params;
    const userId = session.user.id;
    const service = getContainer().getCommsService();

    await service.deleteMessage(userId, messageId);

    return NextResponse.json({ success: true });
  } catch (error) {
    return errorResponse(error);
  }
}

export const DELETE = handleDelete;

function errorResponse(error: unknown): NextResponse {
  if (error instanceof Error && 'code' in error) {
    const baseError = error as BaseError;
    return NextResponse.json(
      { success: false, error: { code: baseError.code, message: baseError.message } },
      { status: baseError.statusCode }
    );
  }
  return NextResponse.json(
    { success: false, error: { code: 'UNKNOWN_ERROR', message: (error as Error).message || 'Unknown error' } },
    { status: 500 }
  );
}
