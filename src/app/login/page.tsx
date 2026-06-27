'use client';

import React, { Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { LoginForm } from '@/components/forms/login-form';

/**
 * Компонент, использующий useSearchParams
 */
function LoginContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const callbackUrl = searchParams.get('callbackUrl') || '/';

  const handleSuccess = () => {
    router.push(callbackUrl);
    router.refresh();
  };

  return (
    <div className="flex min-h-screen items-center justify-center">
      <LoginForm onSuccess={handleSuccess} />
    </div>
  );
}

/**
 * Страница логина.
 * 
 * @remarks
 * Использует Suspense для обработки useSearchParams.
 */
export default function LoginPage() {
  return (
    <Suspense fallback={<div>Загрузка...</div>}>
      <LoginContent />
    </Suspense>
  );
}
