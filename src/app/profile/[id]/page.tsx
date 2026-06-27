'use client';

import React, { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { ProfileForm, ProfileData } from '@/components/ui/profile-form';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { AuthStatus } from '@/components/ui/auth-status';

/**
 * Страница профиля пользователя.
 * 
 * @remarks
 * Отображает профиль пользователя с возможностью редактирования.
 * Проверяет авторизацию и перенаправляет на страницу логина при отсутствии сессии.
 */
export default function ProfilePage() {
  const router = useRouter();
  const params = useParams();
  const userId = params?.id as string;
  const { data: session, status } = useSession();
  const [mode, setMode] = useState<'view' | 'edit'>('view');
  const [isSaving, setIsSaving] = useState(false);

  // Проверка авторизации
  React.useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login?callbackUrl=/profile/' + userId);
    }
  }, [status, router, userId]);

  // Загрузка пользователя в сессию
  React.useEffect(() => {
    if (session?.user?.id && userId && session.user.id !== userId) {
      // Если пользователь пытается открыть чужой профиль - перенаправляем на свой
      router.push('/profile/' + session.user.id);
    }
  }, [session, userId, router]);

  const handleSave = () => {
    setIsSaving(false);
    setMode('view');
  };

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--color-accent)] border-t-transparent" />
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return null;
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg-secondary)] p-4">
      {/* Header */}
      <header className="mb-8 flex items-center justify-between border-b border-[var(--color-border)] pb-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/')}
            className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
            aria-label="На главную"
          >
            ← Назад
          </button>
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">
            Профиль пользователя
          </h1>
        </div>

        <div className="flex items-center gap-4">
          <ThemeToggle />
          <AuthStatus />
        </div>
      </header>

      {/* Profile Form */}
      <ProfileForm
        userId={userId}
        mode={mode}
        onSave={handleSave}
      />
    </div>
  );
}
