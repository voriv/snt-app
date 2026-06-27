import { NextRequest } from 'next/server';
import { requireAuth } from '@/app/api/_lib/auth';
import { successResponse, handleServiceError } from '@/app/api/_lib/response';

/**
 * POST /api/auth/logout — Выход из системы.
 *
 * @remarks Отзывает сессию и очищает cookie. Требует авторизации.
 * @response 200 - Успешный выход
 * @response 401 - Требуется авторизация
 * @public
 */
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth();
    if (!authResult.success) {
      return authResult.response;
    }

    // Очистка cookie сессии
    const response = successResponse({ message: 'Успешный выход из системы' }, 200);
    response.cookies.set('next-auth.session-token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0, //立即过期
      path: '/',
    });

    return response;
  } catch (error) {
    return handleServiceError(error);
  }
}
