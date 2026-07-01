/**
 * @file with-role-guard.ts
 * @description Обёртка для API Route Handlers, проверяющая доступ через AccessService
 *
 * @spec
 * - Шаг 1: Найти endpoint в реестре по (method, path) через matchPath
 * - Если endpoint не найден или is_active=false → 403 Forbidden
 * - access_type=public → пропустить без проверки auth()
 * - access_type=owner → auth() обязателен; 401 если нет сессии; доступ=true (владение в handler)
 * - access_type=role → auth() + AccessService.canAccessApi(userId, method, path); 403 если нет прав
 * - access_type=super_admin → auth() + проверка роли SUPER_ADMIN; 403 если нет
 * - При отсутствии сессии на защищаемом endpoint → 401 Unauthorized
 * - При отсутствии прав → 403 Forbidden с сообщением «Недостаточно прав»
 *
 * @see docs/user-stories/US-8-roles-management.md — FR-15, FR-17
 * @see src/domains/roles/access.service.ts — AccessService
 * @see src/shared/utils/path-matcher.ts — matchPath
 */
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getContainer } from '@/di/container';
import type { HttpMethod } from '@/domains/roles';

/**
 * @function withRoleGuard
 * @description Обёртка для API Route Handlers, проверяющая доступ через AccessService
 *
 * @param handler - Исходный route handler (GET/POST/PATCH/PUT/DELETE)
 * @param options - Конфигурация guard: { method, path } — для поиска endpoint в реестре api_endpoints
 * @returns Защищённый route handler
 *
 * @spec
 * - Получает AccessService через DI-контейнер
 * - Вызывает auth() для проверки сессии (кроме access_type=public)
 * - Делегирует проверку прав AccessService.canAccessApi
 * - При ошибке доступа возвращает стандартизированный JSON { success: false, error: { code, message } }
 *
 * @example
 * ```typescript
 * export const GET = withRoleGuard(
 *   async () => { /* handler logic *\/ },
 *   { method: 'GET', path: '/members' },
 * );
 * ```
 */
export interface RoleGuardOptions {
  /** HTTP-метод endpoint для поиска в реестре api_endpoints */
  method: HttpMethod;
  /** Путь endpoint (без /api/v1) для поиска в реестре */
  path: string;
}

type RouteContext = { params: Promise<Record<string, string>> };

/**
 * @function withRoleGuard
 * @description Обёртка для API Route Handlers, проверяющая доступ через AccessService
 *
 * @param handler - Исходный route handler (GET/POST/PATCH/PUT/DELETE)
 * @param options - Конфигурация guard: { method, path } — для поиска endpoint в реестре api_endpoints
 * @returns Защищённый route handler
 *
 * @spec
 * - Получает AccessService через DI-контейнер
 * - Шаг 1: Находит endpoint в реестре api_endpoints по (method, path) через resolveEndpoint
 * - Если endpoint не найден или is_active=false → 403 Forbidden
 * - access_type=public → пропустить без проверки auth()
 * - access_type=owner → auth() обязателен; 401 если нет сессии; доступ=true (владение в handler)
 * - access_type=role → auth() + AccessService.canAccessApi; 403 если нет прав
 * - access_type=super_admin → auth() + проверка SUPER_ADMIN через canAccessApi; 403 если нет
 * - При ошибке доступа возвращает стандартизированный JSON { success: false, error: { code, message } }
 */
export function withRoleGuard<T = RouteContext>(
  handler: (request: NextRequest, context: T) => Promise<NextResponse>,
  options: RoleGuardOptions,
): (request: NextRequest, context: T) => Promise<NextResponse> {
  return async (request: NextRequest, context: T) => {
    const container = getContainer();
    const accessService = container.getAccessService();

    // Шаг 1: Найти endpoint в реестре api_endpoints по (method, path)
    const endpoint = await accessService.resolveEndpoint(options.method, options.path);

    // Если endpoint не найден или is_active=false → 403 Forbidden
    if (!endpoint || !endpoint.isActive) {
      return forbiddenResponse('Endpoint не найден или деактивирован');
    }

    // access_type=public → пропустить без проверки auth()
    if (endpoint.accessType === 'public') {
      return handler(request, context);
    }

    // auth() обязателен для owner/role/super_admin
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Пожалуйста, авторизуйтесь',
          },
        },
        { status: 401 },
      );
    }

    // access_type=owner → доступ=true (владение проверяется в handler)
    if (endpoint.accessType === 'owner') {
      return handler(request, context);
    }

    // access_type=role/super_admin → делегировать AccessService.canAccessApi
    const hasAccess = await accessService.canAccessApi(
      session.user.id,
      options.method,
      options.path,
    );

    if (!hasAccess) {
      return forbiddenResponse('Недостаточно прав');
    }

    return handler(request, context);
  };
}

/**
 * Стандартизированный 403 Forbidden ответ
 */
function forbiddenResponse(message: string): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error: {
        code: 'FORBIDDEN',
        message,
      },
    },
    { status: 403 },
  );
}
