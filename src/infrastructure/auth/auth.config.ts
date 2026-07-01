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
    async authorize(credentials) {
      if (!credentials?.email || !credentials?.password) {
        return null;
      }

      try {
        const authService = createAuthService();
        const user = await authService.verifyCredentials({
          email: credentials.email as string,
          password: credentials.password as string,
        });

        // Загрузка имён ролей пользователя (RBAC, US-8)
        const roleService = createRoleService();
        const roles = await roleService.getRoleNamesByUserId(user.id);

        return {
          id: user.id,
          email: user.email,
          roles,
        };
      } catch {
        // InvalidCredentialsError или UserInvalidDataError — не авторизован
        return null;
      }
    },
  }),
];

export default authConfig;
