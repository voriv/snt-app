/**
 * @file conversations/route.ts
 * @description Route handler для списка диалогов текущего пользователя
 */
import { NextRequest, NextResponse } from 'next/server';
import { getContainer } from '@/di/container';
import { auth } from '@/lib/auth';
import type { BaseError } from '@/shared/errors';
import { ConversationAlreadyExistsError } from '@/domains/comms/comms.errors';
import { ZodError } from 'zod';

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
 * @response 201 { success: true, data: { conversationId: string, isNew: true } }
 * @response 400 { success: false, error: { code: string, message: string } }
 * @response 401 { success: false, error: { code: string, message: string } }
 * @response 403 { success: false, error: { code: string, message: string } }
 * @response 409 { success: false, error: { code: 'CONVERSATION_ALREADY_EXISTS', message: string }, data: { conversationId: string, isNew: false } }
 *
 * @spec
 * - Требуется авторизация
 * - Если диалога нет — создаёт новый и возвращает 201 с isNew=true
 * - Если диалог уже существует — возвращает 409 с conversationId и isNew=false
 *   (B-029: ConversationAlreadyExistsError обрабатывается ДО generic errorResponse)
 * - Race condition (P2002 на pair_key) также приводит к 409 (через DuplicateConversationError
 *   → ConversationAlreadyExistsError в service-слое)
 * - Нельзя написать самому себе (400)
 * - Нельзя написать заблокированному пользователю (400)
 *
 * @covers AC-01 (REQ-COMMS-004) — создание нового диалога → 201
 * @covers AC-02 (REQ-COMMS-004) — существующий диалог → 409 с conversationId
 * @covers AC-03 (REQ-COMMS-004) — race condition → 409 (через service)
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

    // B-029: Новый диалог создан — всегда 201 с isNew=true
    return NextResponse.json(
      { success: true, data: { conversationId: result.conversationId, isNew: true } },
      { status: 201 }
    );
  } catch (error) {
    // ⚠️ P2-3: Специфическая обработка ConversationAlreadyExistsError ДО generic errorResponse().
    // Service-слой бросает ConversationAlreadyExistsError (как при обнаружении существующего
    // диалога, так и при race condition — DuplicateConversationError → ConversationAlreadyExistsError).
    // Возвращаем 409 с conversationId для редиректа клиента.
    if (error instanceof ConversationAlreadyExistsError) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'CONVERSATION_ALREADY_EXISTS', message: error.message },
          data: { conversationId: error.conversationId, isNew: false },
        },
        { status: 409 }
      );
    }
    // Generic обработка всех остальных ошибок
    return errorResponse(error);
  }
}

export const POST = handlePost;

function errorResponse(error: unknown): NextResponse {
  // B-030: ZodError (пустой/отсутствующий participantId) → 400, а не 500.
  // ZodError не является BaseError (нет code/statusCode) → без этой ветки
  // он попадал бы в generic-обработчик как UNKNOWN_ERROR со статусом 500.
  if (error instanceof ZodError) {
    return NextResponse.json(
      { success: false, error: { code: 'VALIDATION_ERROR', message: 'Некорректные данные запроса' } },
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
    { success: false, error: { code: 'INTERNAL_ERROR', message: 'Внутренняя ошибка сервера' } },
    { status: 500 }
  );
}
