/**
 * @file announcements/[id]/route.ts
 * @description Route handler для получения деталей одного объявления
 */
import { NextRequest, NextResponse } from 'next/server';
import { getContainer } from '@/di/container';
import { auth } from '@/lib/auth';
import type { BaseError } from '@/shared/errors';
import { AnnouncementNotFoundError } from '@/domains/announcement/announcement.errors';

/**
 * @route GET /api/v1/announcements/:id
 * @auth required
 * @description Возвращает детали объявления по ID (с увеличением счётчика просмотров)
 *
 * @response 200 { success: true, data: AnnouncementWithAuthor }
 * @response 401 { success: false, error: { code: string, message: string } }
 * @response 404 { success: false, error: { code: string, message: string } }
 * @response 500 { success: false, error: { code: string, message: string } }
 *
 * @spec
 * - Требует авторизации (401 если нет сессии)
 * - Извлекает id из URL параметров
 * - Вызывает announcementService.getAnnouncementById
 * - При успехе возвращается полное объявление с данными автора
 */
export async function GET(
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

    const announcementService = getContainer().getAnnouncementService();
    const data = await announcementService.getAnnouncementById(id);

    return NextResponse.json({ success: true, data });
  } catch (error) {
    if (error instanceof AnnouncementNotFoundError) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'ANNOUNCEMENT_NOT_FOUND', message: error.message },
        },
        { status: 404 }
      );
    }

    if (error instanceof Error && 'code' in error) {
      const baseError = error as BaseError;
      return NextResponse.json(
        { success: false, error: { code: baseError.code, message: baseError.message } },
        { status: baseError.statusCode }
      );
    }

    console.error('Error in /api/v1/announcements/[id]:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Внутренняя ошибка сервера' } },
      { status: 500 }
    );
  }
}
