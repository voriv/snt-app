/**
 * @file src/app/api/v1/profile/route.ts
 * @description API endpoints для профиля пользователя с ролевой защитой
 *
 * @spec
 * - GET /api/v1/profile: accessType=owner
 * - PATCH /api/v1/profile, PUT /api/v1/profile: accessType=owner
 * - POST/DELETE /api/v1/profile/avatar: вынесены в src/app/api/v1/profile/avatar/route.ts
 * - withRoleGuard обрабатывает авторизацию и проверку владения
 *
 * @see src/domains/roles/access.service.ts
 * @see src/app/api/v1/_shared/with-role-guard.ts
 */
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { createUserProfileService } from '@/domains/userProfile/userProfile.service';
import { withRoleGuard } from '@/app/api/v1/_shared/with-role-guard';

const userProfileService = createUserProfileService();

/**
 * @route GET /api/v1/profile
 * @auth required
 * @description Получить профиль текущего авторизованного пользователя
 *
 * @response 200 { success: true, data: UserProfileFull }
 * @response 401 { success: false, error: { code: 'UNAUTHORIZED', message: string } }
 * @response 404 { success: false, error: { code: 'USER_PROFILE_NOT_FOUND', message: string } }
 *
 * @spec
 * - accessType=owner через withRoleGuard
 * - Проверяет авторизацию через session
 * - Вызывает getUserProfile(userId)
 * - Возвращает полный профиль
 */
async function handleGet(request: NextRequest) {
  const session = await auth();
  const userId = session?.user?.id!;
  const profile = await userProfileService.getUserProfile(userId);
  return NextResponse.json({
    success: true,
    data: profile,
  });
}

export const GET = withRoleGuard(handleGet, { method: 'GET', path: '/profile' });

/**
 * Обработчик обновления профиля (переиспользуется для PATCH и PUT)
 */
async function handleUpdateProfile(request: NextRequest) {
  const session = await auth();
  const user = session?.user;

  if (!user?.id) {
    throw new Error('UNAUTHORIZED');
  }

  const body = await request.json();
  const updatedProfile = await userProfileService.updateUserProfile(user.id, body);
  return NextResponse.json({
    success: true,
    data: updatedProfile,
  });
}

/**
 * @route PATCH /api/v1/profile
 * @auth required
 * @description Обновить профиль текущего авторизованного пользователя
 *
 * @body UpdateUserProfileInput
 * @response 200 { success: true, data: UserProfileFull }
 * @response 400 { success: false, error: { code: 'VALIDATION_ERROR', message: string } }
 * @response 401 { success: false, error: { code: 'UNAUTHORIZED', message: string } }
 * @response 404 { success: false, error: { code: 'USER_PROFILE_NOT_FOUND', message: string } }
 *
 * @spec
 * - accessType=owner через withRoleGuard
 * - Проверяет авторизацию через session
 * - Валидирует входные данные через Zod
 * - Вызывает updateUserProfile(userId, data)
 * - Возвращает обновленный профиль
 */
export const PATCH = withRoleGuard(handleUpdateProfile, { method: 'PATCH', path: '/profile' });

/**
 * @route PUT /api/v1/profile
 * @auth required
 * @description Обновить профиль текущего авторизованного пользователя (REST стандарт)
 *
 * @body UpdateUserProfileInput
 * @response 200 { success: true, data: UserProfileFull }
 * @response 400 { success: false, error: { code: 'VALIDATION_ERROR', message: string } }
 * @response 401 { success: false, error: { code: 'UNAUTHORIZED', message: string } }
 * @response 404 { success: false, error: { code: 'USER_PROFILE_NOT_FOUND', message: string } }
 *
 * @spec
 * - Полностью эквивалентен PATCH — для совместимости с REST-клиентами
 */
export const PUT = withRoleGuard(handleUpdateProfile, { method: 'PUT', path: '/profile' });
