'use client';

import React from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

// ================================
// SVG Icon components
// ================================

/**
 * Simple home icon SVG component.
 * @public
 */
function IconHome({ className }: { className?: string }): React.ReactElement {
  return (
    <svg
      className={cn('w-5 h-5', className)}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}

/**
 * Simple map icon SVG component.
 * @public
 */
function IconMap({ className }: { className?: string }): React.ReactElement {
  return (
    <svg
      className={cn('w-5 h-5', className)}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
      <line x1="8" y1="2" x2="8" y2="18" />
      <line x1="16" y1="6" x2="16" y2="22" />
    </svg>
  );
}

/**
 * Simple search icon SVG component.
 * @public
 */
function IconSearch({ className }: { className?: string }): React.ReactElement {
  return (
    <svg
      className={cn('w-5 h-5', className)}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

/**
 * Simple newspaper (news) icon SVG component.
 * @public
 */
function IconNews({ className }: { className?: string }): React.ReactElement {
  return (
    <svg
      className={cn('w-5 h-5', className)}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2" />
      <path d="M18 14h-8" />
      <path d="M15 18h-5" />
      <path d="M10 6h8v4h-8V6Z" />
    </svg>
  );
}

/**
 * Simple document icon SVG component.
 * @public
 */
function IconDocument({ className }: { className?: string }): React.ReactElement {
  return (
    <svg
      className={cn('w-5 h-5', className)}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  );
}

/**
 * Simple alert (info) icon SVG component.
 * @public
 */
function IconAlert({ className }: { className?: string }): React.ReactElement {
  return (
    <svg
      className={cn('w-5 h-5', className)}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}

/**
 * Simple coins icon SVG component.
 * @public
 */
function IconCoins({ className }: { className?: string }): React.ReactElement {
  return (
    <svg
      className={cn('w-5 h-5', className)}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="8" cy="8" r="6" />
      <circle cx="18" cy="16" r="6" />
      <path d="M14 12l-4-4" />
      <path d="M6 10l-2-2" />
    </svg>
  );
}

/**
 * Simple menu icon SVG component for toggle button.
 * @public
 */
function IconMenu({ className }: { className?: string }): React.ReactElement {
  return (
    <svg
      className={cn('w-5 h-5', className)}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  );
}

/**
 * Simple user icon SVG component.
 * @public
 */
function IconUser({ className }: { className?: string }): React.ReactElement {
  return (
    <svg
      className={cn('w-5 h-5', className)}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

// ================================
// Types and interfaces
// ================================

/**
 * Interface for a single navigation item.
 *
 * @public
 */
export interface SidebarNavItem {
  /** Display label */
  label: string;
  /** Navigation href */
  href: string;
  /** Icon component */
  icon: React.ComponentType<{ className?: string }>;
}

/**
 * Interface for a navigation group (section).
 *
 * @public
 */
export interface SidebarNavGroup {
  /** Section title */
  title: string;
  /** List of items in this section */
  items: SidebarNavItem[];
}

/**
 * Static navigation data for the sidebar.
 *
 * @public
 */
export const SIDEBAR_NAV_DATA: SidebarNavGroup[] = [
  {
    title: 'Мои участки',
    items: [
      {
        label: 'Информация',
        href: '/my-plots/info',
        icon: IconHome,
      },
      {
        label: 'Взносы',
        href: '/my-plots/contributions',
        icon: IconCoins,
      },
    ],
  },
  {
    title: 'Все участки',
    items: [
      {
        label: 'Карты участков',
        href: '/all-plots/map',
        icon: IconMap,
      },
      {
        label: 'Поиск участка',
        href: '/all-plots/search',
        icon: IconSearch,
      },
    ],
  },
  {
    title: 'Информация и документы',
    items: [
      {
        label: 'Новости',
        href: '/info/news',
        icon: IconNews,
      },
      {
        label: 'Документы СНТ',
        href: '/info/documents',
        icon: IconDocument,
      },
      {
        label: 'Важная информация',
        href: '/info/important',
        icon: IconAlert,
      },
    ],
  },
  {
    title: 'Настройки',
    items: [
      {
        label: 'Мой Профиль',
        href: '/profile',
        icon: IconUser,
      },
    ],
  },
];

// ================================
// Hooks
// ================================

/**
 * Gets the current pathname from the URL.
 * Returns '/' as default for server-side rendering.
 *
 * @returns Current pathname string
 */
function useCurrentPathname(): string {
  const [pathname, setPathname] = React.useState<string>('/');

  React.useEffect(() => {
    setPathname(window.location.pathname);
  }, []);

  return pathname;
}

// ================================
// Helper functions
// ================================

/**
 * Returns an array of active path prefixes from the given pathname.
 * Used for highlighting active menu items and their parent sections.
 *
 * @param pathname - Current pathname
 * @returns Array of active prefix strings
 */
function getActivePrefixes(pathname: string): string[] {
  if (!pathname) return [];
  const prefixes: string[] = [];
  const parts = pathname.split('/').filter(Boolean);
  let current = '';
  for (const part of parts) {
    current += `/${part}`;
    prefixes.push(current);
  }
  return prefixes;
}

/**
 * Checks if a navigation item is active based on current pathname.
 *
 * @param itemHref - Navigation item href
 * @param pathname - Current pathname
 * @param activePrefixes - Array of active path prefixes
 * @returns True if the item is active
 */
function isItemActive(
  itemHref: string,
  pathname: string,
  activePrefixes: string[],
): boolean {
  return itemHref === pathname || activePrefixes.includes(itemHref);
}

/**
 * Checks if a navigation group has any active items.
 *
 * @param group - Navigation group
 * @param pathname - Current pathname
 * @param activePrefixes - Array of active path prefixes
 * @returns True if any item in the group is active
 */
function isGroupActive(
  group: SidebarNavGroup,
  pathname: string,
  activePrefixes: string[],
): boolean {
  return group.items.some((item) =>
    isItemActive(item.href, pathname, activePrefixes),
  );
}

// ================================
// Components
// ================================

/**
 * Props for SidebarNavItem component.
 *
 * @public
 */
export interface SidebarNavItemProps {
  /** Navigation item data */
  item: SidebarNavItem;
  /** Current pathname for active state */
  pathname: string;
  /** Active prefix paths */
  activePrefixes: string[];
  /** Whether sidebar is collapsed */
  collapsed: boolean;
}

/**
 * Sidebar navigation item component.
 * Renders a single clickable navigation link with icon and label.
 *
 * @param props - Component props
 *
 * @example
 * ```tsx
 * <SidebarNavItem item={item} pathname="/my-plots/info" collapsed={false} />
 * ```
 */
export function SidebarNavItem({
  item,
  pathname,
  activePrefixes,
  collapsed,
}: SidebarNavItemProps): React.ReactElement {
  const isActive = isItemActive(item.href, pathname, activePrefixes);
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      className={cn(
        'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
        isActive
          ? 'bg-[var(--color-accent)]/10 text-[var(--color-accent)] font-medium'
          : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-secondary)] hover:text-[var(--color-text-primary)]',
        collapsed && 'justify-center px-0',
      )}
      aria-current={isActive ? 'page' : undefined}
      title={collapsed ? item.label : undefined}
    >
      <Icon
        className={cn(
          'shrink-0',
          isActive
            ? 'text-[var(--color-accent)]'
            : 'text-[var(--color-text-secondary)]',
        )}
      />
      {!collapsed && <span>{item.label}</span>}
    </Link>
  );
}

/**
 * Props for SidebarNavGroup component.
 *
 * @public
 */
export interface SidebarNavGroupProps {
  /** Navigation group data */
  group: SidebarNavGroup;
  /** Current pathname for active state */
  pathname: string;
  /** Active prefix paths */
  activePrefixes: string[];
  /** Whether sidebar is collapsed */
  collapsed: boolean;
}

/**
 * Sidebar navigation group component.
 * Renders a section title and its list of navigation items.
 *
 * @param props - Component props
 *
 * @example
 * ```tsx
 * <SidebarNavGroup group={groupData} pathname="/my-plots/info" collapsed={false} />
 * ```
 */
export function SidebarNavGroup({
  group,
  pathname,
  activePrefixes,
  collapsed,
}: SidebarNavGroupProps): React.ReactElement {
  const groupActive = isGroupActive(group, pathname, activePrefixes);

  return (
    <div className="space-y-1">
      {!collapsed && (
        <div className="px-3 py-2 text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">
          {group.title}
        </div>
      )}
      <div className={cn('space-y-1', collapsed && 'flex flex-col items-center gap-y-1')}>
        {group.items.map((item) => (
          <SidebarNavItem
            key={item.href}
            item={item}
            pathname={pathname}
            activePrefixes={activePrefixes}
            collapsed={collapsed}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * Props for SidebarNav component.
 *
 * @public
 */
export interface SidebarNavProps {
  /** Optional current pathname (uses window.location.pathname if not provided) */
  currentPath?: string;
  /** Whether the sidebar is collapsed */
  collapsed?: boolean;
  /** Callback when collapse state changes */
  onCollapseChange?: (collapsed: boolean) => void;
}

/**
 * SidebarNav component — main navigation panel for authorized users.
 * Displays grouped navigation items with active state highlighting.
 * Supports collapsed/expanded states.
 *
 * @param props - Component props
 *
 * @example
 * ```tsx
 * <SidebarNav currentPath="/my-plots/info" />
 * ```
 */
export function SidebarNav({
  currentPath,
  collapsed: collapsedProp = false,
  onCollapseChange,
}: SidebarNavProps): React.ReactElement {
  const pathname = currentPath ?? useCurrentPathname();
  const [collapsed, setCollapsed] = React.useState(collapsedProp);
  const activePrefixes = getActivePrefixes(pathname);

  const handleCollapseToggle = React.useCallback(() => {
    const newCollapsed = !collapsed;
    setCollapsed(newCollapsed);
    onCollapseChange?.(newCollapsed);
  }, [collapsed, onCollapseChange]);

  return (
    <nav
      aria-label="Главная навигация"
      className={cn(
        'flex h-full flex-col bg-[var(--color-bg-primary)] border-r border-[var(--color-border)] transition-all duration-300',
        collapsed ? 'w-16' : 'w-64',
      )}
    >
      {/* Collapse toggle button */}
      <button
        onClick={handleCollapseToggle}
        aria-expanded={!collapsed}
        aria-label={collapsed ? 'Развернуть боковое меню' : 'Свернуть боковое меню'}
        className={cn(
          'flex h-12 w-full items-center justify-center border-b border-[var(--color-border)] transition-colors hover:bg-[var(--color-bg-secondary)]',
          collapsed ? 'px-0' : 'px-3',
        )}
      >
        <IconMenu className="text-[var(--color-text-secondary)]" />
      </button>

      {/* Home link */}
      <div className="px-2 pt-2">
        <Link
          href="/"
          className={cn(
            'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
            pathname === '/'
              ? 'bg-[var(--color-accent)]/10 text-[var(--color-accent)] font-medium'
              : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-secondary)] hover:text-[var(--color-text-primary)]',
            collapsed && 'justify-center px-0',
          )}
          aria-current={pathname === '/' ? 'page' : undefined}
          title={collapsed ? 'В начало' : undefined}
        >
          <IconHome
            className={cn(
              'w-5 h-5 shrink-0',
              pathname === '/'
                ? 'text-[var(--color-accent)]'
                : 'text-[var(--color-text-secondary)]',
            )}
          />
          {!collapsed && <span>В начало</span>}
        </Link>
      </div>

      {/* Navigation items */}
      <div className="flex flex-col flex-1 gap-y-1 px-2 py-4 overflow-y-auto">
        {SIDEBAR_NAV_DATA.map((group) => (
          <SidebarNavGroup
            key={group.title}
            group={group}
            pathname={pathname}
            activePrefixes={activePrefixes}
            collapsed={collapsed}
          />
        ))}
      </div>
    </nav>
  );
}

/**
 * Props for AuthenticatedLayout component.
 *
 * @public
 */
export interface AuthenticatedLayoutProps {
  /** Child components to render in the main content area */
  children: React.ReactNode;
}

/**
 * AuthenticatedLayout component — wraps page content with sidebar navigation.
 * Shows the sidebar only for authorized users.
 * Uses the SessionProvider context from next-auth to check authentication status.
 *
 * @param props - Component props
 *
 * @example
 * ```tsx
 * <AuthenticatedLayout>
 *   <h1>Hello</h1>
 * </AuthenticatedLayout>
 * ```
 */
export function AuthenticatedLayout({
  children,
}: AuthenticatedLayoutProps): React.ReactElement {
  const { data: session, status } = useSession();
  const isAuthenticated = session?.user !== undefined;

  // Show loading state while checking session
  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div
          className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--color-accent)] border-t-transparent"
          aria-label="Загрузка"
        />
      </div>
    );
  }

  // If not authenticated, render children without sidebar
  if (!isAuthenticated) {
    return <>{children}</>;
  }

  return (
    <div className="flex h-screen w-full">
      <SidebarNav />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
