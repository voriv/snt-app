/**
 * @file infrastructure/auth/auth.config.ts
 * @description Базовая конфигурация NextAuth — страницы и общие настройки
 *
 * @spec
 * - Содержит pages и общие настройки
 * - Providers экспортируются для использования в lib/auth.ts
 * - Страница входа: /login — переопределение дефолтной NextAuth страницы
 * - JWT strategy — сессии хранятся в JWT, не в БД
 * - Разделение конфигурации необходимо: auth.config.ts используется в middleware
 *   и не должен содержать ссылки на Node.js модули — bcrypt, Prisma и т.д.
 *
 * @see docs/user-stories/US-3-authentication.md — FR-2
 * @see https://next-auth.js.org/configuration/options
 */
import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { createAuthService, createRoleService } from '@/di/container';

export const authConfig = {
  pages: {
    signIn: '/login',
  },
} as const;

// Фабрика для создания авторизатора с ленивой инициализацией сервисов
function createAuthorizeFunction() {
  return async (credentials: any) => {
    if (!credentials?.email || !credentials?.password) {
      console.error('[AUTH] Missing email or password');
      return null;
    }

    try {
      // Ленивая инициализация сервисов внутри authorize — только при входе
      const authService = createAuthService();
     console.log('[AUTH] Attempting login for email:', credentials.email);
     
     const user = await authService.verifyCredentials({
       email: credentials.email as string,
       password: credentials.password as string,
     });

     console.log('[AUTH] User verified:', user.email);

     // Загрузка имён ролей пользователя (RBAC, US-8)
     const roleService = createRoleService();
     const roles = await roleService.getRoleNamesByUserId(user.id);
     console.log('[AUTH] Roles loaded for user', user.email, ':', roles);

     console.log('[AUTH] User authorized:', user.email, 'roles:', roles);
      return {
        id: user.id,
        email: user.email,
        roles,
      };
    } catch (error) {
      console.error('[AUTH] Authorization error:', error);
      console.error('[AUTH] Error stack:', error instanceof Error ? error.stack : 'No stack');
      // InvalidCredentialsError или UserInvalidDataError — не авторизован
      return null;
    }
  };
}

/**
 * Настройка NextAuth с Credentials Provider
 */
export const providers = [
  /**
   * Credentials Provider — авторизация по email и паролю
   *
   * @param credentials - Объект с полями email и password
   * @returns User объект с id, email, roles при успехе или null при ошибке
   *
   * @spec
   * - Принимает email и password из формы входа
   * - Вызывает AuthService.verifyCredentials для проверки
   * - При успехе загружает имена ролей пользователя через RoleService (RBAC, US-8)
   * - При ошибке возвращает null — NextAuth покажет CredentialsSignin
   * - Email приводится к нижнему регистру перед передачей в сервис
   *
   * @see docs/user-stories/US-3-authentication.md — FR-1
   */
  Credentials({
    credentials: {
      email: { label: 'Email', type: 'email' },
      password: { label: 'Пароль', type: 'password' },
    },
    authorize: createAuthorizeFunction(),
  }),
];

export default authConfig;
