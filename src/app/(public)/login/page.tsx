'use client';

import { useSearchParams } from 'next/navigation';
import LoginFormDataComponent from './page.client';

/**
 * @page /login
 * @description Страница входа в систему для авторизованных пользователей
 *
 * @spec
 * - Client Component: использует useSearchParams для чтения URL параметров
 * - Извлекает callbackUrl и registered из URL search parameters
 * - Передает данные в LoginFormDataComponent
 * - Поддержка callbackUrl: после успешной авторизации перенаправление на исходную страницу
 * - Поддержка flash-сообщения: отображение при registered=true query параметре
 *
 * @data-flow
 * - URL with search params (callbackUrl, registered) → useSearchParams() → LoginFormDataComponent
 *
 * @see docs/user-stories/US-3-authentication.md
 */
export default function LoginPage() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams?.get('callbackUrl') || '/dashboard';
  const isRegistered = searchParams?.get('registered') === 'true';

  return (
    <LoginFormDataComponent callbackUrl={callbackUrl} isRegistered={isRegistered} />
  );
}
