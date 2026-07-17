/**
 * @file conversations/[id]/messages/route.ts
 * @description Route handler для сообщений конкретного диалога
 */
import { NextRequest, NextResponse } from 'next/server';
import { getContainer } from '@/di/container';
import { auth } from '@/lib/auth';
import type { BaseError } from '@/shared/errors';
import { ZodError } from 'zod';

/**
 * @route GET /api/v1/conversations/:id/messages
 * @auth required
 * @description Получить все сообщения диалога
 *
 * @param id - ID диалога
 * @response 200 { success: true, data: Message[] }
 * @response 401 { success: false, error: { code: string, message: string } }
 * @response 403 { success: false, error: { code: string, message: string } }
 * @response 404 { success: false, error: { code: string, message: string } }
 *
 * @spec
 * - Требуется авторизация
 * - Пользователь должен быть участником диалога
 * - Возвращает все сообщения включая удалённые (фильтрация на уровне UI)
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

    const messages = await service.getConversationMessages(conversationId, userId);

    return NextResponse.json({ success: true, data: messages });
  } catch (error) {
    return errorResponse(error);
  }
}

export const GET = handleGet;

/**
 * @route POST /api/v1/conversations/:id/messages
 * @auth required
 * @description Отправить сообщение в диалог
 *
 * @param id - ID диалога
 * @body { content: string, replyToId?: string }
 * @response 201 { success: true, data: Message }
 * @response 400 { success: false, error: { code: string, message: string } }
 * @response 401 { success: false, error: { code: string, message: string } }
 * @response 403 { success: false, error: { code: string, message: string } }
 * @response 404 { success: false, error: { code: string, message: string } }
 *
 * @spec
 * - Требуется авторизация
 * - Пользователь должен быть участником диалога
 * - Content обязателен, максимум 4000 символов
 */
async function handlePost(
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
    const body = await request.json();
    const service = getContainer().getCommsService();

    const message = await service.sendMessage(userId, conversationId, body);

    return NextResponse.json({ success: true, data: message }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}

export const POST = handlePost;

function errorResponse(error: unknown): NextResponse {
  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Ошибка валидации данных',
        },
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
