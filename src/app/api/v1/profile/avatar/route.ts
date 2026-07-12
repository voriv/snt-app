/**
 * @file src/app/api/v1/profile/avatar/route.ts
 * @description API endpoints для управления аватаром пользователя
 *
 * @spec
 * - POST /api/v1/profile/avatar: accessType=owner — загрузка аватара
 * - DELETE /api/v1/profile/avatar: accessType=owner — удаление аватара
 * - withRoleGuard обрабатывает авторизацию и проверку владения
 *
 * @see src/domains/roles/access.service.ts
 * @see src/app/api/v1/_shared/with-role-guard.ts
 */
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { createUserProfileService } from '@/domains/userProfile/userProfile.service';
import type { BaseError } from '@/shared/errors';
import { withRoleGuard } from '@/app/api/v1/_shared/with-role-guard';

const userProfileService = createUserProfileService();

/**
 * @route POST /api/v1/profile/avatar
 * @auth required
 * @description Загрузить аватар пользователя
 *
 * @body multipart/form-data (field: avatar)
 * @response 200 { success: true, data: { avatarUrl: string } }
 * @response 400 { success: false, error: { code: 'MISSING_FILE', message: string } }
 * @response 401 { success: false, error: { code: 'UNAUTHORIZED', message: string } }
 * @response 403 { success: false, error: { code: 'FORBIDDEN', message: string } }
 * @response 413 { success: false, error: { code: 'FILE_TOO_LARGE', message: string } }
 * @response 415 { success: false, error: { code: 'UNSUPPORTED_FILE_TYPE', message: string } }
 *
 * @spec
 * - accessType=owner через withRoleGuard
 * - Обрабатывает multipart/form-data запрос
 * - Валидирует размер и тип файла
 * - Вызывает uploadAvatar(userId, file)
 * - Возвращает URL загруженного аватара
 */
async function handleUploadAvatar(request: NextRequest) {
  try {
    // Получаем файл из multipart form data
    const formData = await request.formData();
    const file = formData.get('avatar') as File | null;

    if (!file) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'MISSING_FILE',
            message: 'Файл аватара не предоставлен',
          },
        },
        { status: 400 }
      );
    }

    // Получаем userId из сессии
    const session = await auth();
    const userId = session?.user?.id!;

    // Convert File to Buffer for processing
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Вызываем сервис для загрузки аватара
    const result = await userProfileService.uploadAvatar(
      userId,
      {
        size: file.size,
        mimetype: file.type,
        buffer,
      }
    );

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    if (error instanceof Error && 'code' in error) {
      const baseError = error as BaseError;
      return NextResponse.json(
        {
          success: false,
          error: {
            code: baseError.code,
            message: baseError.message,
          },
        },
        { status: baseError.statusCode }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'UNKNOWN_ERROR',
          message: (error as Error).message || 'Unknown error',
        },
      },
      { status: 500 }
    );
  }
}

export const POST = withRoleGuard(handleUploadAvatar, {
  method: 'POST',
  path: '/profile/avatar',
});

/**
 * @route DELETE /api/v1/profile/avatar
 * @auth required
 * @description Удалить аватар пользователя
 *
 * @response 200 { success: true, data: { avatarUrl: null } }
 * @response 401 { success: false, error: { code: 'UNAUTHORIZED', message: string } }
 * @response 403 { success: false, error: { code: 'FORBIDDEN', message: string } }
 * @response 404 { success: false, error: { code: 'USER_PROFILE_NOT_FOUND', message: string } }
 *
 * @spec
 * - accessType=owner через withRoleGuard
 * - Проверяет авторизацию через session
 * - Вызывает deleteAvatar(userId)
 * - Возвращает подтверждение удаления
 */
async function handleDeleteAvatar() {
  try {
    const session = await auth();
    const userId = session?.user?.id!;

    // Вызываем сервис для удаления аватара
    await userProfileService.deleteAvatar(userId);

    return NextResponse.json({
      success: true,
      data: { avatarUrl: null },
    });
  } catch (error) {
    if (error instanceof Error && 'code' in error) {
      const baseError = error as BaseError;
      return NextResponse.json(
        {
          success: false,
          error: {
            code: baseError.code,
            message: baseError.message,
          },
        },
        { status: baseError.statusCode }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'UNKNOWN_ERROR',
          message: (error as Error).message || 'Unknown error',
        },
      },
      { status: 500 }
    );
  }
}

export const DELETE = withRoleGuard(handleDeleteAvatar, {
  method: 'DELETE',
  path: '/profile/avatar',
});
