/**
 * @file conversations/[id]/route.ts
 * @description Route handler для получения данных конкретного диалога
 */
import { NextRequest, NextResponse } from 'next/server';
import { getContainer } from '@/di/container';
import { auth } from '@/lib/auth';
import type { BaseError } from '@/shared/errors';

/**
 * @route GET /api/v1/conversations/:id
 * @auth required
 * @description Получить данные конкретного диалога
 *
 * @param id - ID диалога (личного или группового)
 * @response 200 { success: true, data: Conversation }
 * @response 401 { success: false, error: { code: string, message: string } }
 * @response 403 { success: false, error: { code: string, message: string } }
 * @response 404 { success: false, error: { code: string, message: string } }
 *
 * @spec
 * - Требуется авторизация
 * - Пользователь должен быть участником диалога
 * - Проверяет права доступа к диалогу
 */
async function handleGet(
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

    const { id: conversationId } = await params;
    const userId = session.user.id;
    const service = getContainer().getCommsService();

    // Проверить существование диалога и права доступа
    const exists = await service.isParticipant(conversationId, userId);
    if (!exists) {
      throw new Error('conversation_not_found');
    }

    const conversation = await service.findConversationById(conversationId);

    return NextResponse.json({ success: true, data: conversation });
  } catch (error) {
    return errorResponse(error);
  }
}

export const GET = handleGet;

function errorResponse(error: unknown): NextResponse {
  if (error instanceof Error && 'code' in error) {
    const baseError = error as BaseError;
    return NextResponse.json(
      { success: false, error: { code: baseError.code, message: baseError.message } },
      { status: baseError.statusCode }
    );
  }

  // Обработка ошибки "conversation not found"
  if (error instanceof Error && error.message === 'conversation_not_found') {
    return NextResponse.json(
      { success: false, error: { code: 'NOT_FOUND', message: 'Диалог не найден или у вас нет доступа' } },
      { status: 404 }
    );
  }

  console.error('Error in /api/v1/conversations/[id]:', error);
  return NextResponse.json(
    { success: false, error: { code: 'INTERNAL_ERROR', message: 'Внутренняя ошибка сервера' } },
    { status: 500 }
  );
}
