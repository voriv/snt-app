import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Маршруты, не требующие авторизации (публичные).
 */
const publicRoutes = [
  '/login',
  '/register',
  '/api/auth/',
  '/api/public/',
];

/**
 * Маршруты, требующие авторизации.
 */
const protectedRoutes = [
  '/profile',
  '/api/profile/',
];

/**
 * Next.js Middleware для авторизации и редиректов.
 *
 * @remarks
 * Выполняется на сервере перед каждым запросом.
 * - Перенаправляет неавторизованных пользователей на страницу логина
 * - Перенаправляет авторизованных пользователей со страниц логина на главную
 * - Позволяет доступ к публичным маршрутам без проверки сессии
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Проверка на публичные маршруты
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route));
  
  // Если это публичный маршрут и пользователь авторизован — редирект на главную
  if (isPublicRoute && pathname === '/login') {
    const sessionToken = request.cookies.get('next-auth.session-token')?.value;
    
    if (sessionToken) {
      const loginResponse = NextResponse.redirect(new URL('/', request.url));
      loginResponse.cookies.set('next-auth.redirect-to', '/login', { path: '/' });
      return loginResponse;
    }
  }
  
  // Для защищённых маршрутов проверяем сессию
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));
  
  if (isProtectedRoute) {
    const sessionToken = request.cookies.get('next-auth.session-token')?.value;
    
    if (!sessionToken) {
      // Редирект на страницу логина с сохранением целевого URL
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }
  
  return NextResponse.next();
}

/**
 * Matcher для определения, какие маршруты обрабатывать middleware.
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
