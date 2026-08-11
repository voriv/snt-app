/**
 * @component Breadcrumbs (COMMS)
 * @category features/comms
 * @description Component-тесты для хлебных крошек COMMS-страниц (B-020-T5/T5b, R-15)
 * в соответствии с ожидаемыми цепочками из component-spec (раздел 3.2).
 *
 * @covers AC-R15-1..4: корректные цепочки + кликабельность родительских уровней + aria-current
 * @covers AC-R15-5: Breadcrumbs.tsx не содержит text-gray-* / focus:ring-blue-* (токены)
 * @covers AC-R15-6: hidden md:flex в nav контейнере
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Breadcrumbs } from '@/components/layouts/Breadcrumbs';

// Мок usePathname (не используется, т.к. передаём pathname напрямую)
vi.mock('next/navigation', () => ({
  usePathname: vi.fn(() => '/dashboard/comms/messages'),
}));

// Мок Next.js Link
vi.mock('next/link', () => ({
  default: ({ children, href, title }: any) => (
    <a href={href} title={title} data-href={href}>
      {children}
    </a>
  ),
}));

describe('Breadcrumbs — COMMS-маршруты (B-020-T5, R-15)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Реальные цепочки, генерируемые generateBreadcrumbs() из nav-utils (breadcrumbMap)
  const cases: Array<{ path: string; samples: string[] }> = [
    { path: '/dashboard/comms/messages', samples: ['🏠 Дашборд', '💬 Личные сообщения'] },
    { path: '/dashboard/comms/chats', samples: ['🏠 Дашборд', '💬 Групповые чаты'] },
    { path: '/dashboard/comms/messages/new', samples: ['➕ Создание'] },
    { path: '/dashboard/comms/chats/new', samples: ['➕ Создание'] },
    { path: '/dashboard/comms/chats/123', samples: ['#123'] },
    { path: '/dashboard/comms/chats/123/edit', samples: ['✏️ Редактирование'] },
  ];

  it.each(cases)('AC-R15: цепочка для path %#', ({ path, samples }) => {
    render(<Breadcrumbs pathname={path} />);
    const nav = screen.getByRole('navigation', { name: /Breadcrumb/i });
    for (const sample of samples) {
      expect(nav.textContent).toContain(sample);
    }
  });

  // AC-R15-3: родительские уровни кликабельны
  it('AC-R15-3: родительские уровни кликабельны (href)', () => {
    render(<Breadcrumbs pathname="/dashboard/comms/messages/new" />);
    expect(screen.getByRole('link', { name: /🏠 Дашборд/i })).toHaveAttribute('href', '/dashboard');
    // составной сегмент comms/messages → href /dashboard/comms
    expect(screen.getByRole('link', { name: /💬 Личные сообщения/i })).toHaveAttribute(
      'href',
      '/dashboard/comms'
    );
  });

  // AC-R15-4: последний уровень — span с aria-current
  it('AC-R15-4: последний уровень не кликабелен и имеет aria-current="page"', () => {
    render(<Breadcrumbs pathname="/dashboard/comms/messages" />);
    const nav = screen.getByRole('navigation', { name: /Breadcrumb/i });
    const current = nav.querySelector('[aria-current="page"]');
    expect(current).not.toBeNull();
    expect(current?.tagName).toBe('SPAN');
  });

  // AC-R15-5: Breadcrumbs.tsx не содержит хардкод-цветов (токены)
  it('AC-R15-5: не содержит text-gray-* / focus:ring-blue-* (CSS-токены)', () => {
    render(<Breadcrumbs pathname="/dashboard/comms/messages" />);
    const nav = screen.getByRole('navigation', { name: /Breadcrumb/i });
    const html = nav.outerHTML;
    expect(html).not.toMatch(/text-gray-/);
    expect(html).not.toMatch(/ring-blue-/);
    expect(html).toContain('var(--theme-text-secondary)');
  });

  // AC-R15-6: hidden md:flex
  it('AC-R15-6: nav контейнер имеет hidden md:flex', () => {
    render(<Breadcrumbs pathname="/dashboard/comms/messages" />);
    const nav = screen.getByRole('navigation', { name: /Breadcrumb/i });
    expect(nav.className).toContain('hidden');
    expect(nav.className).toContain('md:flex');
  });
});
