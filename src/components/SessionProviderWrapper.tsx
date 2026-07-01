'use client';

import { SessionProvider as NextAuthSessionProvider } from 'next-auth/react';
import type { SessionProviderProps } from 'next-auth/react';

/**
 * @component SessionProviderWrapper
 * @description Client Component wrapper для SessionProvider
 * 
 * @spec
 * - Оборачивает все дочерние компоненты в NextAuth SessionProvider
 * - Доступен для client components
 */
export function SessionProviderWrapper({ children }: SessionProviderProps) {
  return (
    <NextAuthSessionProvider>
      {children}
    </NextAuthSessionProvider>
  );
}
