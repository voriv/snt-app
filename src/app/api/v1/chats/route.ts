/**
 * @file chats/route.ts
 * @description Route handler для списка и создания групповых чатов
 */
import { NextRequest, NextResponse } from 'next/server';
import { getContainer } from '@/di/container';
import { auth } from '@/lib/auth';
import type { BaseError } from '@/shared/errors';

/**
 * @route GET /api/v1/chats
 * @auth required
 * @description Возвращает список групповых чатов пользователя
 *
 * @response 200 { success: true, data: { items: ChatListItem[], total: number } }
 * @response 401 { success: false, error: { code: string, message: string } }
 * @response 500 { success: false, error: { code: string, message: string } }
 *
 * @spec
 * - Требует авторизации (401 если нет сессии)
 * - Поддерживает query параметры: search, limit, page
 * - Вызывает commsService.getUserGroupChats
 * - Возвращает ChatListResponse
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Необходима авторизация' } },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const query: Record<string, string | string[] | undefined> = {};

    const search = searchParams.get('search');
    if (search) query.search = search;

    const limit = searchParams.get('limit');
    if (limit) query.limit = limit;

    const page = searchParams.get('page');
    if (page) query.page = page;

    const commsService = getContainer().getCommsService();
    const data = await commsService.getUserGroupChats(session.user.id, query);

    return NextResponse.json({ success: true, data });
  } catch (error) {
    return errorResponse(error);
  }
}

/**
 * @route POST /api/v1/chats
 * @auth required
 * @description Создаёт новый групповой чат
 *
 * @body { name: string, description?: string, participantIds: string[] }
 * @response 201 { success: true, data: Conversation }
 * @response 400 { success: false, error: { code: string, message: string } }
 * @response 401 { success: false, error: { code: string, message: string } }
 * @response 409 { success: false, error: { code: string, message: string } }
 * @response 500 { success: false, error: { code: string, message: string } }
 *
 * @spec
 * - Требует авторизации (401 если нет сессии)
 * - Валидирует тело запроса через createChatSchema (в сервисе)
 * - Проверяет уникальность названия чата
 * - Создаёт чат в транзакции: conversation + participants
 * - Создатель автоматически получает роль OWNER
 * - Возвращает 201 при успешном создании
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Необходима авторизация' } },
        { status: 401 }
      );
    }

    const body = await request.json();

    const commsService = getContainer().getCommsService();
    const data = await commsService.createChat(session.user.id, body);

    return NextResponse.json({ success: true, data }, { status: 201 });
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

  console.error('Error in /api/v1/chats:', error);
  return NextResponse.json(
    { success: false, error: { code: 'INTERNAL_ERROR', message: 'Внутренняя ошибка сервера' } },
    { status: 500 }
  );
}
