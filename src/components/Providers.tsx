'use client';

import type { ReactNode } from 'react';
import { SessionProvider } from 'next-auth/react';
import { ThemeProvider } from '@/hooks/useTheme';

/**
 * @component Providers
 * @description Клиентская обёртка для глобальных провайдеров приложения
 *
 * @spec
 * - Размещается в корневом RootLayout (Server Component)
 * - Оборачивает приложение в SessionProvider — источник сессий NextAuth
 * - Оборачивает приложение в ThemeProvider — единый источник истины для темы
 * - Все дочерние компоненты (AppLayout, ProfilePage, Navbar) получают доступ к useTheme и useSession
 *
 * @example
 * ```tsx
 * // src/app/layout.tsx
 * <html lang="ru">
 *   <body>
 *     <Providers>{children}</Providers>
 *   </body>
 * </html>
 * ```
 */
export function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider>{children}</ThemeProvider>
    </SessionProvider>
  );
}
