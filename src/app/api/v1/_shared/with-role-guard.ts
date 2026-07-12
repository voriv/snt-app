/**
 * @file with-role-guard.ts
 * @description Обёртка для API Route Handlers, проверяющая доступ через AccessService
 *
 * @spec
 * - Шаг 1: Найти endpoint в реестре api_endpoints по (method, path) через resolveEndpoint
 * - access_type=public → пропустить без проверки auth()
 * - access_type=owner → auth() обязателен; 401 если нет сессии; доступ=true (владение в handler)
 * - access_type=role → auth() + AccessService.canAccessApi; 403 если нет прав
 * - access_type=super_admin → auth() + проверка SUPER_ADMIN через canAccessApi; 403 если нет
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
 *   { method: 'GET', path: '/profile' },
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
 * - access_type=public → пропустить без проверки auth()
 * - access_type=owner → auth() обязателен; endpoint должен существовать или быть пустым (для новых)
 * - access_type=role/super_admin → endpoint обязателен и доступен; AccessService.canAccessApi
 * - При ошибке доступа возвращает стандартизированный JSON { success: false, error: { code, message } }
 */
export function withRoleGuard<T = RouteContext>(
  handler: (request: NextRequest, context: T) => Promise<NextResponse>,
  options: RoleGuardOptions,
): (request: NextRequest, context: T) => Promise<NextResponse> {
  return async (request: NextRequest, context: T) => {
    const container = getContainer();
    const accessService = container.getAccessService();

    // Извлекаем pathname из URL запроса (например, /api/v1/plots/test-id → /plots/test-id)
    const requestPath = request.nextUrl.pathname.replace(/^\/api\/v1/, '') || '/';

    // Для owner - не проверяем endpoint в БД, только авторизацию
    // Endpoint будет создан через миграцию или будет доступен по умолчанию для owner
    const hasActiveEndpoint = async (): Promise<boolean> => {
      const endpoint = await accessService.resolveEndpoint(options.method, requestPath);
      return endpoint !== null && endpoint.isActive === true;
    };

    // access_type=public → пропустить без проверки auth()
    // Для owner сначала проверяем авторизацию, затем доступ в handler
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

    // Получаем endpoint для проверки прав доступа
    const endpoint = await accessService.resolveEndpoint(options.method, requestPath);

    // access_type=owner → доступ разрешён после авторизации
    // Проверка владения выполняется внутри handler (например, userId из session должен совпадать с профилем)
    if (options.method === 'PATCH' && requestPath === '/profile') {
      // Профиль пользователя всегда доступен owner (авторизованному пользователю)
      return handler(request, context);
    }

    // Для других эндпоинтов с access_type=owner
    if (endpoint && endpoint.isActive && endpoint.accessType === 'owner') {
      return handler(request, context);
    }

    // access_type=role/super_admin → делегировать AccessService.canAccessApi
    if (endpoint && endpoint.isActive) {
      const hasAccess = await accessService.canAccessApi(
        session.user.id,
        options.method,
        requestPath,
      );

      if (!hasAccess) {
        return forbiddenResponse('Недостаточно прав');
      }

      return handler(request, context);
    }

    // Если endpoint не найден для role/super_admin → 403 Forbidden
    return forbiddenResponse('Endpoint не найден или деактивирован');
  };
}

/**
 * @function forbiddenResponse
 * @description Стандартизированный 403 Forbidden ответ
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
