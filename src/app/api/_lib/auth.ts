import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { errorResponse } from './response';
import type { Session } from 'next-auth';

/**
 * Результат проверки авторизации (успех с расширенным user).
 *
 * @public
 */
interface AuthSuccessResult {
  success: true;
  session: Session;
  user: { id: string; email: string; role: string };
}

/**
 * Результат проверки авторизации (ошибка).
 *
 * @public
 */
interface AuthErrorResult {
  success: false;
  response: ReturnType<typeof errorResponse>;
}

/**
 * Результат проверки авторизации.
 *
 * @public
 */
export type AuthResult = AuthSuccessResult | AuthErrorResult;

/**
 * Проверяет, что пользователь аутентифицирован.
 *
 * @returns Сессию пользователя или ошибку 401
 *
 * @example
 * ```ts
 * const authResult = await requireAuth();
 * if (!authResult.success) return authResult.response;
 * const { user } = authResult;
 * ```
 */
export async function requireAuth(): Promise<AuthResult> {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return {
      success: false,
      response: errorResponse('UNAUTHORIZED', 'Требуется авторизация', 401),
    };
  }

  const user = {
    id: (session.user as { id: string }).id ?? '',
    email: session.user.email ?? '',
    role: (session.user as { role: string }).role ?? 'MEMBER',
  };

  return { success: true, session, user };
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

  if (authResult.user.role !== requiredRole) {
    return {
      success: false,
      response: errorResponse('FORBIDDEN', 'Недостаточно прав', 403),
    };
  }

  return authResult;
}

/**
 * Проверяет, что пользователь имеет одну из указанных ролей.
 *
 * @param requiredRoles - Массив допустимых ролей
 * @returns Сессию или ошибку 403
 */
export async function requireAnyRole(requiredRoles: string[]): Promise<AuthResult> {
  const authResult = await requireAuth();
  if (!authResult.success) return authResult;

  if (!requiredRoles.includes(authResult.user.role)) {
    return {
      success: false,
      response: errorResponse('FORBIDDEN', 'Недостаточно прав', 403),
    };
  }

  return authResult;
}
