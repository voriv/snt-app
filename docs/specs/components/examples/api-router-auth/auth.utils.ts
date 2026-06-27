import auth from '@/lib/auth';
import { errorResponse } from './response.utils';
import type { Session } from 'next-auth';

/**
 * Результат проверки авторизации.
 *
 * @public
 */
export type AuthResult =
  | { success: true; session: Session }
  | { success: false; response: ReturnType<typeof errorResponse> };

/**
 * Проверяет, что пользователь аутентифицирован.
 *
 * @returns Сессию или ошибку 401
 *
 * @example
 * ```ts
 * const authResult = await requireAuth();
 * if (!authResult.success) return authResult.response;
 * const { session } = authResult;
 * ```
 */
export async function requireAuth(): Promise<AuthResult> {
  const session = await auth();

  if (!session?.user) {
    return {
      success: false,
      response: errorResponse('UNAUTHORIZED', 'Требуется авторизация', 401),
    };
  }

  return { success: true, session };
}

/**
 * Проверяет, что пользователь имеет указанную роль.
 *
 * @param requiredRole - Требуемая роль (например, 'ADMIN')
 * @returns Сессию или ошибку 403
 *
 * @example
 * ```ts
 * const authResult = await requireRole('ADMIN');
 * if (!authResult.success) return authResult.response;
 * ```
 */
export async function requireRole(requiredRole: string): Promise<AuthResult> {
  const authResult = await requireAuth();
  if (!authResult.success) return authResult;

  if (authResult.session.user.role !== requiredRole) {
    return {
      success: false,
      response: errorResponse('FORBIDDEN', 'Недостаточно прав', 403),
    };
  }

  return authResult;
}