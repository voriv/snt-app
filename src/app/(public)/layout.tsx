/**
 * @file src/app/(public)/layout.tsx
 * @layout (public)/layout
 * @description Route group layout для публичной зоны — обёртка над PublicLayout-компонентом
 *
 * @spec
 * - Server Component: импортирует и рендерит PublicLayout из src/components/layouts/
 * - Передаёт children в PublicLayout
 * - Применяется ко всем маршрутам внутри (public) route group: / и /login
 *
 * @data-flow
 * - Server Component → PublicLayout → children (landing или login page)
 */

import { PublicLayout } from '@/components/layouts';
import type { Metadata } from 'next';

/**
 * Metadata для SEO оптимизации landing page
 */
export const metadata = {
  title: 'СНТ Берёзки-НТ — Управление товариществом',
  description: 'Система управления членами СНТ Берёзки-НТ. Просмотр информации о членах, участках и платежах.',
} satisfies Metadata;

interface PublicZoneLayoutProps {
  children: React.ReactNode;
}

/**
 * Route group layout для публичной зоны
 * @param props - Props компонента
 * @returns Элемент React с PublicLayout обёрткой
 */
export default function PublicZoneLayout({ children }: PublicZoneLayoutProps) {
  return <PublicLayout>{children}</PublicLayout>;
}
