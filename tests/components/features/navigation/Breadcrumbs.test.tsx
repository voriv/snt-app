/**
 * @component Breadcrumbs
 * @category navigation
 * @description Component-тесты для хлебных крошек (Breadcrumbs).
 *
 * @covers AC-NAV-06-1 — Breadcrumbs на страницах
 * @covers AC-NAV-06-2 — Авто-генерация по пути
 * @covers AC-NAV-06-3 — Кликабельные ссылки
 * @covers AC-NAV-06-4 — Последний уровень не кликабелен
 * @covers AC-NAV-06-5 — Разделитель между уровнями
 * @covers AC-NAV-06-6 — Максимальная глубина
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Breadcrumbs } from '@/components/layouts/Breadcrumbs';

// Мокируем usePathname
vi.mock('next/navigation', () => ({
  usePathname: vi.fn(() => '/dashboard/plots'),
}));

// Мокируем Next.js Link
vi.mock('next/link', () => ({
  default: ({ children, href, className, title }: any) => (
    <a href={href} className={className} title={title} data-href={href}>
      {children}
    </a>
  ),
}));

describe('Breadcrumbs (US-NAV-06)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ========================================
  // Базовый рендеринг
  // ========================================
  describe('Базовый рендеринг', () => {
    it('should render breadcrumbs with correct aria-label', () => {
      render(<Breadcrumbs pathname="/dashboard/plots" />);

      const nav = screen.getByRole('navigation', { name: /Breadcrumb/i });
      expect(nav).toBeInTheDocument();
    });

    it('should render breadcrumb items for /dashboard/plots', () => {
      render(<Breadcrumbs pathname="/dashboard/plots" />);

      expect(screen.getByText('🏠 Дашборд')).toBeInTheDocument();
      expect(screen.getByText('📋 Участки')).toBeInTheDocument();
    });

    it('should return null for empty pathname', () => {
      const { container } = render(<Breadcrumbs pathname="" />);
      expect(container.firstChild).toBeNull();
    });
  });

  // ========================================
  // Кликабельные ссылки (AC-NAV-06-3)
  // ========================================
  describe('Кликабельные ссылки', () => {
    it('should render non-current items as links', () => {
      render(<Breadcrumbs pathname="/dashboard/plots/123" />);

      const dashboardLink = screen.getByRole('link', { name: /🏠 Дашборд/i });
      expect(dashboardLink).toHaveAttribute('href', '/dashboard');
    });

    it('should have correct href for intermediate items', () => {
      render(<Breadcrumbs pathname="/dashboard/plots/123" />);

      const plotsLink = screen.getByRole('link', { name: /📋 Участки/i });
      expect(plotsLink).toHaveAttribute('href', '/dashboard/plots');
    });
  });

  // ========================================
  // aria-current на последнем элементе (AC-NAV-06-4)
  // ========================================
  describe('Последний элемент (aria-current)', () => {
    it('should set aria-current="page" on the last item', () => {
      render(<Breadcrumbs pathname="/dashboard/plots" />);

      // The last item should have aria-current="page"
      const nav = screen.getByRole('navigation', { name: /Breadcrumb/i });
      const ariaCurrent = nav.querySelector('[aria-current="page"]');
      expect(ariaCurrent).not.toBeNull();
      expect(ariaCurrent?.textContent).toContain('Участки');
    });

    it('should not render last item as a link', () => {
      render(<Breadcrumbs pathname="/dashboard/plots" />);

      // The last breadcrumb should be a <span>, not a <Link>
      const nav = screen.getByRole('navigation', { name: /Breadcrumb/i });
      const currentSpan = nav.querySelector('[aria-current="page"]');
      expect(currentSpan).not.toBeNull();
      expect(currentSpan?.tagName).toBe('SPAN');
    });
  });

  // ========================================
  // Разделитель (AC-NAV-06-5)
  // ========================================
  describe('Разделитель', () => {
    it('should render default separator (›)', () => {
      render(<Breadcrumbs pathname="/dashboard/plots" />);

      // Check for separator text
      const separators = screen.getAllByText('›');
      expect(separators.length).toBeGreaterThanOrEqual(1);
    });

    it('should render custom separator when provided', () => {
      render(<Breadcrumbs pathname="/dashboard/plots" separator="/" />);

      // Custom separator should be present
      const customSeparator = screen.getAllByText('/');
      expect(customSeparator.length).toBeGreaterThanOrEqual(1);
    });
  });

  // ========================================
  // Числовые ID (AC-NAV-06-2)
  // ========================================
  describe('Числовые ID как #N', () => {
    it('should format numeric segment as #N', () => {
      render(<Breadcrumbs pathname="/dashboard/plots/123" />);

      // The breadcrumb should contain "#123"
      const nav = screen.getByRole('navigation', { name: /Breadcrumb/i });
      expect(nav.textContent).toContain('#123');
    });
  });

  // ========================================
  // Максимальная глубина (AC-NAV-06-6)
  // ========================================
  describe('Максимальная глубина', () => {
    it('should respect maxDepth prop', () => {
      render(<Breadcrumbs pathname="/dashboard/plots/123/edit/details" maxDepth={3} />);

      const nav = screen.getByRole('navigation', { name: /Breadcrumb/i });
      const items = nav.querySelectorAll('li');
      // With maxDepth=3, should show at most 3 items
      expect(items.length).toBeLessThanOrEqual(3);
    });
  });

  // ========================================
  // CSS классы
  // ========================================
  describe('CSS классы', () => {
    it('should have correct className', () => {
      render(<Breadcrumbs pathname="/dashboard" className="custom-class" />);

      const nav = screen.getByRole('navigation', { name: /Breadcrumb/i });
      expect(nav.className).toContain('custom-class');
    });

    it('should include hidden md:flex for mobile hiding', () => {
      render(<Breadcrumbs pathname="/dashboard/plots" />);

      const nav = screen.getByRole('navigation', { name: /Breadcrumb/i });
      expect(nav.className).toContain('hidden');
      expect(nav.className).toContain('md:flex');
    });
  });
});
