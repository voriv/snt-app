/**
 * @file src/app/api/v1/profile/theme/route.ts
 * @description API endpoint для смены темы оформления пользователя
 *
 * @spec
 * - PATCH /api/v1/profile/theme: accessType=owner
 * - withRoleGuard обрабатывает авторизацию
 *
 * @see src/domains/roles/access.service.ts
 * @see src/app/api/v1/_shared/with-role-guard.ts
 */
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { createUserProfileService } from '@/domains/userProfile/userProfile.service';
import { withRoleGuard } from '@/app/api/v1/_shared/with-role-guard';

const userProfileService = createUserProfileService();

async function handleUpdateTheme(request: NextRequest) {
  const session = await auth();
  const userId = session?.user?.id!;
  const body = await request.json();
  const updatedTheme = await userProfileService.updateTheme(userId, body.theme);
  return NextResponse.json({
    success: true,
    data: { theme: updatedTheme },
  });
}

/**
 * @route PATCH /api/v1/profile/theme
 * @auth required
 * @description Обновить тему оформления текущего пользователя
 *
 * @body { theme: 'light' | 'dark' | 'green' }
 * @response 200 { success: true, data: { theme: string } }
 * @response 400 { success: false, error: { code: 'THEME_INVALID', message: string } }
 * @response 401 { success: false, error: { code: 'UNAUTHORIZED', message: string } }
 * @response 404 { success: false, error: { code: 'USER_PROFILE_NOT_FOUND', message: string } }
 *
 * @spec
 * - accessType=owner через сессию
 * - Проверяет авторизацию через session
 * - Валидирует тему через Zod-схему
 * - Вызывает updateTheme(userId, theme)
 * - Возвращает обновленную тему
 */
export const PATCH = withRoleGuard(handleUpdateTheme, { method: 'PATCH', path: '/profile/theme' });
