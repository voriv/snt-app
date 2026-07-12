'use client';

import { useSearchParams } from 'next/navigation';
import { AuthLayout } from '@/components/layouts';
import { LoginForm } from '@/components/features/auth';

/**
 * @description Клиентская обёртка страницы входа
 *
 * Извлекает параметры из URL и передаёт их в LoginForm
 * Использует AuthLayout для оформления страницы входа
 *
 * @spec
 * - Извлекает callbackUrl из URL search parameters
 * - Проверяет параметр registered для отображения сообщения
 * - Рендерит LoginForm внутри AuthLayout
 */
export default function LoginPageClient() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';
  const isRegistered = searchParams.get('registered') === 'true';

  return (
    <AuthLayout>
      <LoginForm callbackUrl={callbackUrl} showRegistrationMessage={isRegistered} />
    </AuthLayout>
  );
}
