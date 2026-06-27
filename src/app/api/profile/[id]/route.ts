import { NextRequest } from 'next/server';
import { requireAuth } from '@/app/api/_lib/auth';
import { successResponse, handleServiceError } from '@/app/api/_lib/response';
import { createProfileService } from '@/services/profile-service';

/**
 * GET /api/profile/:id — Получение профиля пользователя по ID.
 *
 * @remarks Требует авторизации. Возвращает профиль любого авторизованного пользователя.
 * @response 200 - Профиль найден
 * @response 401 - Требуется авторизация
 * @response 404 - Профиль не найден
 * @public
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const authResult = await requireAuth();
    if (!authResult.success) {
      return authResult.response;
    }

    const { id } = await params;

    const profileService = createProfileService();
    const profile = await profileService.getProfile(id);

    return successResponse(profile, 200);
  } catch (error) {
    return handleServiceError(error);
  }
}

/**
 * PATCH /api/profile/:id — Обновление профиля пользователя.
 *
 * @remarks Требует авторизации. Обновляет только владелец профиля или ADMIN.
 * @response 200 - Профиль обновлён
 * @response 400 - Ошибка валидации
 * @response 401 - Требуется авторизация
 * @response 403 - Доступ запрещён
 * @response 404 - Профиль не найден
 * @public
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const authResult = await requireAuth();
    if (!authResult.success) {
      return authResult.response;
    }

    const { id } = await params;
    const body = await request.json();

    const profileService = createProfileService();
    const profile = await profileService.updateProfile(
      authResult.user.id,
      id,
      body,
    );

    return successResponse(profile, 200);
  } catch (error) {
    return handleServiceError(error);
  }
}
