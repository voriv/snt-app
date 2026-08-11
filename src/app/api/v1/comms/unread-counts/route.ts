/**
 * @file comms/unread-counts/route.ts
 * @description Route handler для счётчиков непрочитанных сообщений по вкладкам "Общение"
 *
 * @route GET /api/v1/comms/unread-counts
 * @auth required
 * @response 200 { success: true, data: { messages: number, chats: number } }
 * @response 401 { success: false, error: { code: string, message: string } }
 * @response 500 { success: false, error: "Не удалось загрузить счётчики" }
 *
 * @covers AC-6 (US-21-37): API /api/v1/comms/unread-counts
 * @see component-spec.md → 3.2.1
 *
 * @spec
 * - Авторизация через auth()
 * - Вызывает CommsService.getUnreadCounts(userId)
 * - Возвращает { success, data: { messages, chats } }
 * - Обработка ошибок: HTTP 500 с { success: false, error: "Не удалось загрузить счётчики" }
 */
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getContainer } from '@/di/container';

/**
 * GET /api/v1/comms/unread-counts
 *
 * Возвращает счётчики непрочитанных сообщений:
 * - `messages` — сумма непрочитанных во всех личных диалогах (DIRECT)
 * - `chats` — сумма непрочитанных во всех групповых чатах (GROUP)
 *
 * @returns JSON response with unread counts
 */
export async function GET() {
  try {
    // 1. Авторизация
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'Необходима авторизация' },
        },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // 2. Вызов service через DI-контейнер
    const service = getContainer().getCommsService();
    const counts = await service.getUnreadCounts(userId);

    // 3. Стандартизированный ответ
    return NextResponse.json({ success: true, data: counts });
  } catch {
    // 4. Обработка ошибок БД/сервиса
    return NextResponse.json(
      { success: false, error: 'Не удалось загрузить счётчики' },
      { status: 500 }
    );
  }
}
