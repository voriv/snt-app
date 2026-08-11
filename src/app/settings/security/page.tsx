/**
 * @page /settings/security
 * @auth required - useSession() check
 * @description Страница управления безопасностью учётной записи (Client Component)
 *
 * @spec
 * - Использует 'use client' directive
 * - Использует useSession() для проверки авторизации
 * - При отсутствии сессии — редирект на /login?callbackUrl=/settings/security
 * - Заголовок: "Безопасность"
 * - Подзаголовок: "Управление паролем и безопасностью учётной записи"
 * - Карточка (max-w-lg, по центру, padding space-8) с ChangePasswordForm
 * - Хлебные крошки: Главная → Безопасность
 * - При успехе смены пароля: редирект на /dashboard/profile
 *
 * @data-flow
 * - useSession() → session
 * - status === 'unauthenticated' → router.replace('/login?callbackUrl=...')
 * - ChangePasswordForm onSuccess → router.push('/dashboard/profile')
 *
 * @covers AC-9.7 — отображение формы смены пароля на странице
 * @covers AC-9.11 — защита маршрута (редирект неавторизованного пользователя)
 * @covers AC-9.13 — навигация к странице смены пароля (целевая страница)
 *
 * @see docs/specs/auth/change-password-component-spec.md — секция 3.5 (Page)
 * @see docs/design/layouts/settings-security/layout.md — UI-макет
 * @see docs/plans/B-015-change-password-plan.md — задача US-12-T11
 */
'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Card, CardHeader, CardTitle, CardBody } from '@/components/ui/Card';
import { ChangePasswordForm } from '@/components/features/auth/ChangePasswordForm';

const LOGIN_CALLBACK_URL = '/settings/security';

export default function SecurityPage(): React.JSX.Element {
  const { status } = useSession();
  const router = useRouter();

  // AC-9.11: Защита маршрута — редирект неавторизованного пользователя
  useEffect(() => {
    if (status === 'unauthenticated') {
      const timer = setTimeout(() => {
        router.replace(`/login?callbackUrl=${encodeURIComponent(LOGIN_CALLBACK_URL)}`);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [status, router]);

  // Состояние загрузки сессии или ожидание редиректа
  if (status === 'loading' || status === 'unauthenticated') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <svg
          className="animate-spin h-8 w-8 text-indigo-600"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      </div>
    );
  }

  /**
   * Обработчик успешной смены пароля.
   * AC-9.8: редирект на страницу профиля после успеха.
   */
  const handleSuccess = (): void => {
    router.push('/dashboard/profile');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-lg mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Хлебные крошки: Главная → Безопасность */}
        <nav
          aria-label="Breadcrumb"
          className="text-xs text-gray-500"
        >
          <ol className="flex items-center gap-1">
            <li className="flex items-center gap-1">
              <Link
                href="/dashboard"
                className="hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
              >
                Главная
              </Link>
              <span className="text-gray-400 select-none" aria-hidden="true">
                ›
              </span>
            </li>
            <li>
              <span
                aria-current="page"
                className="text-gray-900 font-medium"
              >
                Безопасность
              </span>
            </li>
          </ol>
        </nav>

        {/* Карточка формы смены пароля */}
        <Card>
          <CardHeader>
            <CardTitle>Безопасность</CardTitle>
            <p className="mt-1 text-sm text-gray-500">
              Управление паролем и безопасностью учётной записи
            </p>
          </CardHeader>
          <CardBody>
            <ChangePasswordForm onSuccess={handleSuccess} />
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
