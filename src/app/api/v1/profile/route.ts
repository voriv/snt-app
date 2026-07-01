import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { createUserProfileService } from '@/domains/userProfile/userProfile.service';
import type { BaseError } from '@/shared/errors';

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
 * - Проверяет авторизацию через session
 * - Вызывает getUserProfile(userId)
 * - Возвращает полный профиль
 */
export async function GET() {
  try {
    // Проверяем авторизацию
    const session = await auth();
    if (!session?.user?.id) {
      console.error('[Profile API] No session or user id. Session:', JSON.stringify(session));
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Пожалуйста, авторизуйтесь для просмотра профиля',
          },
        },
        { status: 401 }
      );
    }

    console.log('[Profile API] Fetching profile for userId:', session.user.id);

    // Получаем профиль пользователя
    const profile = await userProfileService.getUserProfile(session.user.id);

    console.log('[Profile API] Profile fetched successfully:', profile?.id);

    return NextResponse.json({
      success: true,
      data: profile,
    });
  } catch (error) {
    console.error('[Profile API] Error fetching profile:', error);
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

/**
 * Обработчик обновления профиля (переиспользуется для PATCH и PUT)
 */
async function handleUpdateProfile(request: NextRequest) {
  try {
    // Проверяем авторизацию
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Пожалуйста, авторизуйтесь для обновления профиля',
          },
        },
        { status: 401 }
      );
    }

    // Парсим тело запроса
    const body = await request.json();

    // Вызываем сервис для обновления профиля
    const updatedProfile = await userProfileService.updateUserProfile(
      session.user.id,
      body
    );

    return NextResponse.json({
      success: true,
      data: updatedProfile,
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
 * - Проверяет авторизацию через session
 * - Валидирует входные данные через Zod
 * - Вызывает updateUserProfile(userId, data)
 * - Возвращает обновленный профиль
 */
export async function PATCH(request: NextRequest) {
  return handleUpdateProfile(request);
}

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
export async function PUT(request: NextRequest) {
  return handleUpdateProfile(request);
}

/**
 * @route POST /api/v1/profile/avatar
 * @auth required
 * @description Загрузить аватар пользователя
 *
 * @body multipart/form-data (file: image)
 * @response 200 { success: true, data: { avatarUrl: string } }
 * @response 401 { success: false, error: { code: 'UNAUTHORIZED', message: string } }
 * @response 413 { success: false, error: { code: 'FILE_TOO_LARGE', message: string } }
 * @response 415 { success: false, error: { code: 'UNSUPPORTED_FILE_TYPE', message: string } }
 *
 * @spec
 * - Проверяет авторизацию через session
 * - Обрабатывает multipart/form-data запрос
 * - Валидирует размер и тип файла
 * - Вызывает uploadAvatar(userId, file)
 * - Возвращает URL загруженного аватара
 */
export async function POST(request: NextRequest) {
  try {
    // Проверяем авторизацию
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Пожалуйста, авторизуйтесь для загрузки аватара',
          },
        },
        { status: 401 }
      );
    }

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

    // Convert File to Buffer for processing
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Вызываем сервис для загрузки аватара
    const result = await userProfileService.uploadAvatar(
      session.user.id,
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

/**
 * @route DELETE /api/v1/profile/avatar
 * @auth required
 * @description Удалить аватар пользователя
 *
 * @response 200 { success: true, data: { avatarUrl: null } }
 * @response 401 { success: false, error: { code: 'UNAUTHORIZED', message: string } }
 * @response 404 { success: false, error: { code: 'USER_PROFILE_NOT_FOUND', message: string } }
 *
 * @spec
 * - Проверяет авторизацию через session
 * - Вызывает deleteAvatar(userId)
 * - Возвращает подтверждение удаления
 */
export async function DELETE() {
  try {
    // Проверяем авторизацию
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Пожалуйста, авторизуйтесь для удаления аватара',
          },
        },
        { status: 401 }
      );
    }

    // Вызываем сервис для удаления аватара
    await userProfileService.deleteAvatar(session.user.id);

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
