import { NextRequest } from 'next/server';
import { successResponse, errorResponse, handleServiceError } from '@/app/api/_lib/response';

/**
 * POST /api/auth/refresh — Обновление access и refresh токенов.
 *
 * @remarks Публичный endpoint. Обновляет access и refresh токены с ротацией.
 * @body refreshToken - Refresh token для обновления
 * @response 200 - Токены обновлены
 * @response 400 - Нет refreshToken в теле
 * @response 401 - Невалидный refresh token
 * @public
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body?.refreshToken) {
      return errorResponse('VALIDATION_ERROR', 'Refresh token обязателен', 400);
    }

    // TODO: Реализовать логику обновления токенов
    // Пока возвращаем заглушку
    return errorResponse('NOT_IMPLEMENTED', 'Endpoint в разработке', 501);
  } catch (error) {
    return handleServiceError(error);
  }
}
