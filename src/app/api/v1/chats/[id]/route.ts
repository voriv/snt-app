/**
 * @file chats/[id]/route.ts
 * @description Route handler для управления конкретным групповым чатом
 */
import { NextRequest, NextResponse } from 'next/server';
import { getContainer } from '@/di/container';
import { auth } from '@/lib/auth';
import type { BaseError } from '@/shared/errors';

/**
 * @route PATCH /api/v1/chats/:id
 * @auth required
 * @description Обновляет информацию о групповом чате (название, описание)
 *
 * @body { name?: string, description?: string | null }
 * @response 200 { success: true, data: Conversation }
 * @response 400 { success: false, error: { code: string, message: string } }
 * @response 401 { success: false, error: { code: string, message: string } }
 * @response 403 { success: false, error: { code: string, message: string } }
 * @response 404 { success: false, error: { code: string, message: string } }
 * @response 409 { success: false, error: { code: string, message: string } }
 * @response 500 { success: false, error: { code: string, message: string } }
 *
 * @spec
 * - Требует авторизации (401 если нет сессии)
 * - Валидирует тело запроса через updateChatSchema (в сервисе)
 * - Проверяет права пользователя: только OWNER или ADMIN могут редактировать чат
 * - При дублировании названия возвращает 409
 * - Возвращает 200 с обновлённым объектом Conversation
 */
export async function PATCH(
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

    const { id } = await params;
    const body = await request.json();

    const commsService = getContainer().getCommsService();
    const data = await commsService.updateChat(session.user.id, id, body);

    return NextResponse.json({ success: true, data });
  } catch (error) {
    return errorResponse(error);
  }
}

function errorResponse(error: unknown): NextResponse {
  if (error instanceof Error && 'code' in error) {
    const baseError = error as BaseError;
    return NextResponse.json(
      { success: false, error: { code: baseError.code, message: baseError.message } },
      { status: baseError.statusCode }
    );
  }

  console.error('Error in /api/v1/chats/[id]:', error);
  return NextResponse.json(
    { success: false, error: { code: 'INTERNAL_ERROR', message: 'Внутренняя ошибка сервера' } },
    { status: 500 }
  );
}
