import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import PageClient from './page.client';

/**
 * @page /login
 * @auth none
 * @description Страница входа в систему для неавторизованных пользователей
 *
 * @spec
 * - Публичная страница: не требует авторизации
 * - Проверка сессии: если пользователь уже авторизован — редирект на /dashboard
 * - Обработанные состояния: loading, error (через AuthLayout)
 * - Redirect авторизованного пользователя: при наличии валидной сессии — редирект на dashboard
 *
 * @data-flow
 * - auth() → проверка авторизации → редирект или рендер PageClient
 *
 * @see docs/user-stories/US-04-реализация-страницы-входа-login.md
 */
export default async function LoginPage() {
  // Проверка авторизации через серверную сессию
  const session = await auth();

  // Редирект авторизованного пользователя на dashboard
  if (session) {
    redirect('/dashboard');
  }

  return <PageClient />;
}
