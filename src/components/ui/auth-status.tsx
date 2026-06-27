'use client';

import React from 'react';
import { signIn, signOut, useSession } from 'next-auth/react';
import Link from 'next/link';

/**
 * Компонент индикатора статуса авторизации.
 *
 * @remarks
 * Показывает имя/роль авторизованного пользователя или кнопку "Войти" для гостей.
 * Использует next-auth для получения сессии и выхода.
 *
 * Не принимает props — получает сессию автоматически.
 */
export function AuthStatus() {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return (
      <div className="flex items-center gap-2" aria-label="Загрузка сессии">
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--color-accent)] border-t-transparent" />
      </div>
    );
  }

  if (!session?.user) {
    return (
      <button
        onClick={() => signIn()}
        aria-label="Войти"
        className="rounded-lg bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--color-accent)]/90 transition-colors"
      >
        Войти
      </button>
    );
  }

  const displayName = session.user.name || session.user.email;
  const role = session.user.role as string;

  return (
    <div className="flex items-center gap-3" aria-label="Статус авторизации">
      {/* Аватар */}
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-accent)] text-sm font-medium text-white">
        {displayName?.[0]?.toUpperCase() ?? 'U'}
      </div>

      {/* Имя и роль */}
      <div className="flex flex-col">
        <span className="text-sm font-medium text-[var(--color-text-primary)]">
          {displayName}
        </span>
        <span className="text-xs text-[var(--color-text-secondary)]">
          {role}
          {role === 'ADMIN' && (
            <span className="ml-1 rounded bg-[var(--color-accent)] px-1.5 py-0.5 text-[10px] font-bold text-white">
              Админ
            </span>
          )}
        </span>
      </div>

      {/* Кнопки действий */}
      <div className="flex items-center gap-2">
        <Link
          href={`/profile/${session.user.id}`}
          className="rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-sm hover:bg-[var(--color-bg-secondary)] transition-colors"
        >
          Профиль
        </Link>
        <button
          onClick={() => signOut({ redirect: true, callbackUrl: '/' })}
          aria-label="Выйти"
          className="rounded-lg border border-red-300 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
        >
          Выйти
        </button>
      </div>
    </div>
  );
}
