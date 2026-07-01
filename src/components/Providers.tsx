'use client';

import type { ReactNode } from 'react';
import { ThemeProvider } from '@/hooks/useTheme';

/**
 * @component Providers
 * @description Клиентская обёртка для глобальных провайдеров приложения
 *
 * @spec
 * - Размещается в корневом RootLayout (Server Component)
 * - Оборачивает приложение в ThemeProvider — единый источник истины для состояния темы
 * - Все дочерние компоненты (AppLayout, ProfilePage, Navbar) получают доступ к useTheme
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
  return <ThemeProvider>{children}</ThemeProvider>;
}
