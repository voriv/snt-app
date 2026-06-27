'use client';

import React from 'react';
import { SessionProvider } from 'next-auth/react';
import type { Session } from 'next-auth';

/**
 * Пропсы для SessionWrapper компонента.
 *
 * @public
 */
interface SessionWrapperProps {
  /** Дочерние компоненты */
  children: React.ReactNode;
  /** Опциональная сессия, передаваемая в NextAuth */
  session?: Session | null;
}

/**
 * Wrapper для предоставления сессии через NextAuth.
 *
 * @remarks
 * Оборачивает приложение в SessionProvider из next-auth/react.
 * Позволяет использовать хуки useSession(), signIn(), signOut()
 * во всех дочерних компонентах.
 *
 * @param props - Пропсы компонента
 *
 * @example
 * ```tsx
 * // В layout.tsx
 * <SessionWrapper>
 *   {children}
 * </SessionWrapper>
 * ```
 */
export function SessionWrapper({ children, session }: SessionWrapperProps) {
  return (
    <SessionProvider session={session} refetchInterval={0}>
      {children}
    </SessionProvider>
  );
}
