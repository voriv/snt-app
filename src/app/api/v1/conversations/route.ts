/**
 * @file conversations/route.ts
 * @description Route handler для списка диалогов текущего пользователя
 */
import { NextRequest, NextResponse } from 'next/server';
import { getContainer } from '@/di/container';
import { auth } from '@/lib/auth';
import type { BaseError } from '@/shared/errors';

/**
 * @route GET /api/v1/conversations
 * @auth required
 * @description Список личных диалогов текущего пользователя с пагинацией и поиском
 *
 * @query search — поисковый запрос по имени собеседника (опционально)
 * @query limit — количество записей (default: 20, max: 100)
 * @query page — номер страницы (default: 1)
 * @response 200 { success: true, data: { items: ConversationListItem[], total: number } }
 * @response 400 { success: false, error: { code: string, message: string } }
 * @response 401 { success: false, error: { code: string, message: string } }
 *
 * @spec
 * - Требуется авторизация
 * - Возвращает только DIRECT диалоги текущего пользователя
 * - Пагинация через query параметры page/limit
 * - Поиск через query параметр search (по имени собеседника)
 */
async function handleGet(request: NextRequest) {
  try {
    // Проверка авторизации
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Необходима авторизация' } },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const service = getContainer().getCommsService();

    // Парсинг query параметров
    const query = Object.fromEntries(request.nextUrl.searchParams.entries());
    const result = await service.getUserConversations(userId, query);

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    return errorResponse(error);
  }
}

export const GET = handleGet;

/**
 * @route POST /api/v1/conversations
 * @auth required
 * @description Начать новый личный диалог с пользователем
 *
 * @body { participantId: string } — ID собеседника
 * @response 201 { success: true, data: { conversationId: string, isNew: boolean } }
 * @response 400 { success: false, error: { code: string, message: string } }
 * @response 401 { success: false, error: { code: string, message: string } }
 * @response 403 { success: false, error: { code: string, message: string } }
 * @response 409 { success: false, error: { code: string, message: string } }
 *
 * @spec
 * - Требуется авторизация
 * - Если диалог уже существует — возвращает его с isNew=false (статус 200)
 * - Если диалога нет — создаёт новый и возвращает с isNew=true (статус 201)
 * - Нельзя написать самому себе (400)
 * - Нельзя написать заблокированному пользователю (400)
 */
async function handlePost(request: NextRequest) {
  try {
    // Проверка авторизации
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Необходима авторизация' } },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const body = await request.json();
    const service = getContainer().getCommsService();

    const result = await service.startConversation(userId, body);

    const status = result.isNew ? 201 : 200;
    return NextResponse.json({ success: true, data: result }, { status });
  } catch (error) {
    return errorResponse(error);
  }
}

export const POST = handlePost;

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
