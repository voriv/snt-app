/**
 * @file users/search/route.ts
 * @description API endpoint для поиска пользователей по имени/email
 */
import { NextRequest, NextResponse } from 'next/server';
import { getContainer } from '@/di/container';
import { auth } from '@/lib/auth';
import type { BaseError } from '@/shared/errors';

/**
 * @route GET /api/v1/users/search
 * @auth required
 * @description Поиск пользователей по имени или email
 *
 * @query q — поисковый запрос (минимум 2 символа)
 * @query limit — количество записей (default: 20, max: 100)
 * @response 200 { success: true, data: UserSearchResult[] }
 * @response 400 { success: false, error: { code: string, message: string } }
 * @response 401 { success: false, error: { code: string, message: string } }
 *
 * @spec
 * - Требуется авторизация
 * - Поисковый запрос минимум 2 символа
 * - Исключает текущего пользователя из результатов
 * - Учитывает limit и max limit 100
 * - Результаты отсортированы по имени
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
    const service = getContainer().getUsersService();

    // Парсинг query параметров
    const query = request.nextUrl.searchParams.get('q');
    const limitParam = request.nextUrl.searchParams.get('limit');

    // Валидация поискового запроса
    if (!query || query.length < 2) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_QUERY', message: 'Поисковый запрос должен содержать минимум 2 символа' } },
        { status: 400 }
      );
    }

    const limit = limitParam
      ? Math.min(Math.max(Number(limitParam), 1), 100)
      : 20;

    const result = await service.searchUsers(query, userId, limit);

    return NextResponse.json({ success: true, data: result });
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
  return NextResponse.json(
    { success: false, error: { code: 'UNKNOWN_ERROR', message: (error as Error).message || 'Unknown error' } },
    { status: 500 }
  );
}
