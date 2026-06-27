import { NextResponse } from 'next/server';
import { ServiceError } from '@/services/_lib/errors';

/**
 * Формат успешного ответа API.
 *
 * @public
 */
interface SuccessApiResponse<T> {
  success: true;
  data: T;
}

/**
 * Формат ответа с ошибкой.
 *
 * @public
 */
interface ErrorApiResponse {
  success: false;
  error: {
    code: string;
    message: string;
  };
}

/**
 * Формирует успешный ответ API (200).
 *
 * @param data - Данные ответа
 * @param status - HTTP статус (по умолчанию 200)
 */
export function successResponse<T>(data: T, status = 200): NextResponse<SuccessApiResponse<T>> {
  return NextResponse.json({ success: true, data }, { status });
}

/**
 * Формирует ответ с ошибкой API.
 *
 * @param code - Код ошибки
 * @param message - Сообщение об ошибке
 * @param status - HTTP статус
 */
export function errorResponse(
  code: string,
  message: string,
  status: number,
): NextResponse<ErrorApiResponse> {
  return NextResponse.json(
    { success: false, error: { code, message } },
    { status },
  );
}

/**
 * Преобразует доменную ошибку сервиса в HTTP-ответ.
 *
 * @param error - Ошибка сервиса (ServiceError или иная)
 */
export function handleServiceError(error: unknown): NextResponse<ErrorApiResponse> {
  if (error instanceof ServiceError) {
    const statusMap: Record<string, number> = {
      VALIDATION_ERROR: 400,
      NOT_FOUND: 404,
      CONFLICT: 409,
      BUSINESS_RULE_ERROR: 422,
      FORBIDDEN: 403,
    };
    const status = statusMap[error.errorCode] ?? 500;
    return errorResponse(error.errorCode, error.message, status);
  }

  return errorResponse('INTERNAL_ERROR', 'Внутренняя ошибка сервера', 500);
}