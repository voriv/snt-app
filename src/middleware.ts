/**
 * @file middleware.ts
 * @description Middleware для Next.js с защитой маршрутов дашборда и API
 *
 * @spec
 * - Публичные маршруты (не требуют авторизации):
 *   - /login, /register — страницы входа/регистрации
 *   - /api/auth/* — NextAuth endpoints (вход, callbacks, сессия)
 *   - /api/v1/auth/* — публичные auth endpoints (регистрация)
 * - Защищённые API маршруты /api/v1/*:
 *   - При отсутствии сессии → редирект на /login с сохранением callbackUrl (EC-03)
 *   - API route handlers дополнительно проверяют сессию через auth()
 * - Защищённые UI маршруты /dashboard/*:
 *   - При отсутствии сессии → редирект на /login?callbackUrl=<исходный путь>
 * - Используется getToken из next-auth/jwt (Edge Runtime совместимый)
 *   для проверки подписи JWT-токена из cookie
 *
 * @see docs/user-stories/US-05-реализация-процесса-аутентификации.md — FR-REQ-AUTH-001-04, AC-4.1, AC-4.4, EC-03
 */
import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

/**
 * Middleware с проверкой авторизации через NextAuth getToken
 *
 * @param request - Входящий HTTP-запрос (NextRequest)
 * @returns NextResponse.next() — запрос пропускается; NextResponse.redirect() — редирект на /login
 *
 * @spec
 * - getToken проверяет подпись JWT из cookie (Edge Runtime совместимый)
 * - Если токен отсутствует/невалиден → редирект на /login с callbackUrl (AC-4.1, EC-03)
 * - callbackUrl содержит исходный путь для возврата после входа (AC-4.4)
 * - Если токен валиден → запрос пропускается (AC-4.2)
 */
export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request });

  // Токен валиден — пропускаем запрос
  if (token) {
    return NextResponse.next();
  }

  // Токен отсутствует/невалиден — редирект на /login с сохранением исходного пути (EC-03)
  const loginUrl = new URL('/login', request.url);
  loginUrl.searchParams.set('callbackUrl', request.nextUrl.pathname + request.nextUrl.search);

  return NextResponse.redirect(loginUrl);
}

export const config = {
  /**
   * Matcher: защищаем /dashboard/* и /api/v1/*
   * Исключаем:
   * - /api/auth/* — NextAuth endpoints (публичные)
   * - /api/v1/auth/* — публичные auth endpoints (регистрация)
   * - _next/static, _next/image, favicon.ico — статика
   * - /login, /register — публичные страницы
   */
  matcher: [
    '/dashboard/:path*',
    '/api/v1/plots/:path*',
    '/api/v1/users/:path*',
    '/api/v1/profile/:path*',
    '/api/v1/roles/:path*',
    '/api/v1/pages/:path*',
    '/api/v1/api-endpoints/:path*',
    '/api/v1/plot-users/:path*',
  ],
};
