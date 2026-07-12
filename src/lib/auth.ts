/**
 * @file lib/auth.ts
 * @description NextAuth конфигурация с Credentials Provider и JWT/Session callbacks
 * @module @/lib/auth
 *
 * @spec
 * - Использует NextAuth.js v4 для аутентификации
 * - NextAuthHandler - обёртка handleAuth для обработки всех запросов (GET/POST)
 * - Credentials Provider вызывает AuthService.verifyCredentials для проверки email/пароля
 * - JWT callback добавляет id и roles (массив имён ролей RBAC, US-8) в токен
 * - Session callback передаёт id и roles из токена в объект сессии
 * - Расширение типов NextAuth находится в next-auth.d.ts (единый источник)
 *
 * @see docs/user-stories/US-3-authentication.md — FR-2
 * @see docs/user-stories/US-8-roles-management.md — RBAC, роли в сессии
 */
import NextAuth, { type NextAuthOptions } from 'next-auth';
import { getServerSession } from 'next-auth/next';
import { authConfig, providers } from '@/infrastructure/auth/auth.config';

/**
 * Настройка NextAuth с Credentials Provider
 */
const authOptions: NextAuthOptions = {
  ...authConfig,
  providers,
  callbacks: {
    /**
     * JWT callback — добавляет id и roles в токен
     *
     * @param token - Текущий JWT-токен
     * @param user - Объект пользователя из authorize()
     * @returns Обогащённый JWT-токен
     *
     * @spec
     * - При первом входе — user не null — добавляет user.id и user.roles в token
     * - При последующих запросах — user null — token уже содержит данные
     * - Токен содержит минимальный набор: id, email, roles
     *
     * @see docs/user-stories/US-3-authentication.md — FR-10, BR-7
     */
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id as string;
        token.roles = (user.roles ?? []) as string[];
      }
      return token;
    },
    /**
     * Session callback — передаёт данные из JWT в объект сессии
     *
     * @param session - Объект сессии NextAuth
     * @param token - JWT-токен с данными пользователя
     * @returns Обогащённый объект сессии
     *
     * @spec
     * - Передаёт id и roles из token в session.user
     * - Используется на клиенте через useSession и на сервере через auth
     * - Сессия содержит: user.id, user.email, user.roles
     *
     * @see docs/user-stories/US-3-authentication.md — FR-10, AC-12
     */
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.roles = (token.roles ?? []) as string[];
      }
      return session;
    },
  },
  /**
   * Session strategy — JWT с сроком жизни 24 часа (OQ-5).
   *
   * @spec
   * - strategy: jwt — сессия хранится в подписанном JWT-cookie, не в БД
   * - maxAge: 86400 секунд (24 часа) — баланс безопасности и UX
   * - Session обновляется только при повторном входе (logout + login).
   *   При изменении ролей в БД старая сессия остаётся валидной до истечения maxAge.
   *   Для немедленного применения смены ролей требуется logout + повторный вход (OQ-4).
   *
   * @see docs/user-stories/US-05-реализация-процесса-аутентификации.md — OQ-4, OQ-5, EC-13
   */
  session: {
    strategy: 'jwt' as const,
    maxAge: 24 * 60 * 60, // 24 часа
  },
};

// Инициализация NextAuth — NextAuth() возвращает handleAuth обёртку
// handleAuth сам обрабатывает GET и POST запросы на основе path и method
export const NextAuthHandler = NextAuth(authOptions);

/**
 * Получить текущую сессию сервера
 * @returns Объект сессии или null
 * @see docs/user-stories/US-8-roles-management.md — FR-17
 */
export async function auth() {
  return getServerSession(authOptions);
}

// Экспорт только authOptions для использования в других файлах
export { authOptions };
