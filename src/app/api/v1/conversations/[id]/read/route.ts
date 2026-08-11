/**
 * @file conversations/[id]/read/route.ts
 * @description Route handler для отметки личного диалога (DIRECT) как прочитанного
 *
 * @route PATCH /api/v1/conversations/:id/read
 * @auth required
 * @response 200 { success: true }
 * @response 400 { success: false, error: { code: string, message: string } }
 * @response 401 { success: false, error: { code: string, message: string } }
 * @response 404 { success: false, error: { code: string, message: string } }
 *
 * @covers AC-1, AC-4 (US-39-01)
 * @see component-spec.md → 3.2.2
 *
 * @spec
 * - Авторизация через auth()
 * - Пользователь должен быть участником диалога
 * - Делегирует в CommsService.markConversationAsRead(conversationId, userId)
 * - Идемпотентно: повторный вызов не вызывает ошибку (AC-4)
 */
import { NextRequest, NextResponse } from 'next/server';
import { getContainer } from '@/di/container';
import { auth } from '@/lib/auth';
import type { BaseError } from '@/shared/errors';
import { ZodError } from 'zod';

/**
 * PATCH /api/v1/conversations/:id/read
 *
 * Отмечает все сообщения в личном диалоге как прочитанные.
 * Обновляет lastReadAt текущего пользователя.
 *
 * @param id - ID диалога
 * @returns JSON response с флагом успеха
 */
export async function PATCH(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Авторизация
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Необходима авторизация' } },
        { status: 401 }
      );
    }

    const { id: conversationId } = await params;
    const userId = session.user.id;

    // 2. Вызов service через DI-контейнер
    const service = getContainer().getCommsService();
    await service.markConversationAsRead(conversationId, userId);

    // 3. Успешный ответ
    return NextResponse.json({ success: true });
  } catch (error) {
    return errorResponse(error);
  }
}

/**
 * Обработка ошибок: ZodError → 400, BaseError → соответствующий статус, прочее → 500
 */
function errorResponse(error: unknown): NextResponse {
  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Некорректный ID диалога' },
      },
      { status: 400 }
    );
  }

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
