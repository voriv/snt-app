import { NextResponse } from 'next/server';
import { ServiceError } from '@/services/_lib/errors';

/**
 * Формат успешного ответа API.
 *
 * @public
 */
export interface SuccessApiResponse<T> {
  success: true;
  data: T;
}

/**
 * Формат ответа с ошибкой.
 *
 * @public
 */
export interface ErrorApiResponse {
  success: false;
  error: {
    code: string;
    message: string;
  };
}

/**
 * Универсальный ответ API.
 *
 * @public
 */
export type ApiResponse<T> = SuccessApiResponse<T> | ErrorApiResponse;

/**
 * Формирует успешный ответ API (200).
 *
 * @param data - Данные ответа
 * @param status - HTTP статус (по умолчанию 200)
 *
 * @public
 */
export function successResponse<T>(data: T, status = 200): NextResponse {
  return NextResponse.json({ success: true, data }, { status });
}

/**
 * Формирует ответ 201 Created.
 *
 * @param data - Данные для ответа
 *
 * @public
 */
export function createdResponse<T>(data: T): NextResponse {
  return NextResponse.json({ success: true, data }, { status: 201 });
}

/**
 * Формирует ответ с ошибкой API.
 *
 * @param code - Код ошибки
 * @param message - Сообщение об ошибке
 * @param status - HTTP статус
 *
 * @public
 */
export function errorResponse(
  code: string,
  message: string,
  status: number,
): NextResponse {
  return NextResponse.json(
    { success: false, error: { code, message } },
    { status },
  );
}

/**
 * Преобразует доменную ошибку сервиса в HTTP-ответ.
 *
 * @param error - Ошибка сервиса (ServiceError или иная)
 *
 * @public
 */
export function handleServiceError(error: unknown): NextResponse {
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
