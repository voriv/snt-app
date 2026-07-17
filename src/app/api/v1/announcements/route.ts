/**
 * @file announcements/route.ts
 * @description Route handlers для объявлений (GET list, POST create)
 */
import { NextRequest, NextResponse } from 'next/server';
import { getContainer } from '@/di/container';
import { auth } from '@/lib/auth';
import type { BaseError } from '@/shared/errors';
import { AnnouncementListQuerySchema } from '@/domains/announcement/announcement.validators';

/**
 * @route GET /api/v1/announcements
 * @auth required
 * @description Возвращает пагинированный список объявлений с фильтрацией и поиском
 *
 * @response 200 { success: true, data: { items: AnnouncementWithAuthor[], total: number, page: number, limit: number, totalPages: number } }
 * @response 400 { success: false, error: { code: string, message: string } }
 * @response 401 { success: false, error: { code: string, message: string } }
 * @response 500 { success: false, error: { code: string, message: string } }
 *
 * @spec
 * - Требует авторизации (401 если нет сессии)
 * - Поддерживает query параметры: page, limit, status, search
 * - Валидирует query параметры через AnnouncementListQuerySchema
 * - Вызывает announcementService.getAnnouncementsList
 * - По умолчанию возвращает опубликованные объявления (PUBLISHED)
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

    // Собираем query параметры для валидации
    const query: Record<string, string | undefined> = {};
    const page = searchParams.get('page');
    if (page) query.page = page;
    const limit = searchParams.get('limit');
    if (limit) query.limit = limit;
    const status = searchParams.get('status');
    if (status) query.status = status;
    const search = searchParams.get('search');
    if (search) query.search = search;

    // Валидируем параметры через Zod-схему
    const validatedQuery = AnnouncementListQuerySchema.parse(query);

    const announcementService = getContainer().getAnnouncementService();
    const data = await announcementService.getAnnouncementsList(validatedQuery);

    return NextResponse.json({ success: true, data });
  } catch (error) {
    return errorResponse(error);
  }
}

/**
 * @route POST /api/v1/announcements
 * @auth required
 * @role ADMIN, MODERATOR
 * @description Создаёт новое объявление как черновик
 *
 * @body { title: string, content?: string }
 * @response 201 { success: true, data: Announcement }
 * @response 400 { success: false, error: { code: string, message: string } }
 * @response 401 { success: false, error: { code: string, message: string } }
 * @response 403 { success: false, error: { code: string, message: string } }
 * @response 500 { success: false, error: { code: string, message: string } }
 *
 * @spec
 * - Требует авторизации (401 если нет сессии)
 * - Требует роли ADMIN или MODERATOR (403 если нет прав)
 * - Валидация тела запроса через AnnouncementCreateSchema в сервисе
 * - Объявление создаётся со статусом DRAFT
 * - authorId берётся из сессии автоматически
 */
async function handlePost(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Необходима авторизация' } },
        { status: 401 }
      );
    }

    const body = await request.json();

    const announcementService = getContainer().getAnnouncementService();
    const data = await announcementService.createAnnouncement(body, session.user.id);

    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}

export { handlePost as POST };

function errorResponse(error: unknown): NextResponse {
  if (error instanceof Error && 'code' in error) {
    const baseError = error as BaseError;
    return NextResponse.json(
      { success: false, error: { code: baseError.code, message: baseError.message } },
      { status: baseError.statusCode }
    );
  }

  console.error('Error in /api/v1/announcements:', error);
  return NextResponse.json(
    { success: false, error: { code: 'INTERNAL_ERROR', message: 'Внутренняя ошибка сервера' } },
    { status: 500 }
  );
}
