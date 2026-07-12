/**
 * @file src/app/api/test-server.ts
 * @description Базовая структура API для тестов
 *
 * @spec
 * - Предоставляет единую точку входа для маршрутизации API
 * - Поддерживает GET, POST, PATCH, DELETE методы
 * - Возвращает стандартный JSON ответ
 */

import { NextRequest, NextResponse } from 'next/server';

/**
 * Стандартный ответ API
 */
export interface APIResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

/**
 * Создаёт успешный ответ
 */
export function successResponse<T>(data: T, status: number = 200): NextResponse<APIResponse<T>> {
  return NextResponse.json<APIResponse<T>>(
    { success: true, data },
    { status }
  );
}

/**
 * Создаёт ответ ошибки
 */
export function errorResponse(
  code: string,
  message: string,
  status: number = 500
): NextResponse<APIResponse<never>> {
  return NextResponse.json<APIResponse<never>>(
    { success: false, error: { code, message } },
    { status }
  );
}

/**
 * Создаёт ответ 404 Not Found
 */
export function notFoundResponse(message: string = 'Ресурс не найден'): NextResponse<APIResponse<never>> {
  return errorResponse('NOT_FOUND', message, 404);
}

/**
 * Создаёт ответ 400 Bad Request
 */
export function badRequestResponse(message: string): NextResponse<APIResponse<never>> {
  return errorResponse('BAD_REQUEST', message, 400);
}

/**
 * Создаёт ответ 401 Unauthorized
 */
export function unauthorizedResponse(message: string = 'Требуется авторизация'): NextResponse<APIResponse<never>> {
  return errorResponse('UNAUTHORIZED', message, 401);
}

/**
 * Создаёт ответ 403 Forbidden
 */
export function forbiddenResponse(message: string = 'Доступ запрещён'): NextResponse<APIResponse<never>> {
  return errorResponse('FORBIDDEN', message, 403);
}

/**
 * Создаёт ответ 409 Conflict
 */
export function conflictResponse(message: string): NextResponse<APIResponse<never>> {
  return errorResponse('CONFLICT', message, 409);
}

/**
 * Обработчик для всех методов
 */
export async function API(request: NextRequest): Promise<NextResponse<APIResponse>> {
  const path = request.nextUrl.pathname;
  const method = request.method.toUpperCase();

  // Дефолтный ответ - маршрут не найден
  return notFoundResponse(`Method ${method} для пути ${path} не найден`);
}
