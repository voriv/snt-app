/**
 * @module nav-utils.test
 * @description Unit-тесты для утилит навигации: getMenuItems, isActivePath,
 * generateBreadcrumbs, getIconByPath, filterNavItemsByRole.
 *
 * @covers AC-NAV-02-4 — Ролевые пункты меню
 * @covers AC-NAV-02-6 — Активное состояние пункта меню
 * @covers AC-NAV-05-2 — Ролевые пункты в sidebar
 * @covers AC-NAV-05-3 — Активное состояние пункта sidebar
 * @covers AC-NAV-05-4 — Иконки у пунктов
 * @covers AC-NAV-06-2 — Авто-генерация breadcrumbs по пути
 * @covers AC-NAV-06-6 — Максимальная глубина breadcrumbs
 */
import { describe, it, expect } from 'vitest';
import {
  getMenuItems,
  filterNavItemsByRole,
  getIconByPath,
  isActivePath,
  generateBreadcrumbs,
  type BreadcrumbItem,
} from '@/lib/nav-utils';

describe('nav-utils', () => {
  // ========================================
  // getMenuItems (filterNavItemsByRole)
  // ========================================
  describe('getMenuItems / filterNavItemsByRole', () => {
    it('should return all items without roles for empty roles array', () => {
      const result = getMenuItems([]);
      // Items without roles constraint: dashboard, plots, documents, comms, profile
      expect(result.every((item) => !item.roles || item.roles.length === 0)).toBe(true);
    });

    it('should return all items without roles for undefined/null roles', () => {
      // @ts-ignore — testing edge case
      expect(getMenuItems(undefined)).toBeTruthy();
      // @ts-ignore — testing edge case
      expect(getMenuItems(null)).toBeTruthy();
    });

    it('should return all 8 items for SUPER_ADMIN', () => {
      const result = getMenuItems(['SUPER_ADMIN']);
      expect(result).toHaveLength(8);
    });

    it('should return 7 items for ADMIN (no /roles)', () => {
      const result = getMenuItems(['ADMIN']);
      expect(result).toHaveLength(7);
      expect(result.map((i) => i.path)).not.toContain('/dashboard/roles');
      expect(result.map((i) => i.path)).toContain('/dashboard/users');
      expect(result.map((i) => i.path)).toContain('/dashboard/payments');
    });

    it('should return base items for MEMBER', () => {
      const result = getMenuItems(['MEMBER']);
      // MEMBER sees: dashboard, plots, documents, comms, profile (5 items)
      // comms has no roles restriction so MEMBER sees it
      const paths = result.map((i) => i.path);
      expect(paths).toContain('/dashboard');
      expect(paths).toContain('/dashboard/plots');
      expect(paths).toContain('/dashboard/documents');
      expect(paths).toContain('/dashboard/comms');
      expect(paths).toContain('/dashboard/profile');
      expect(paths).not.toContain('/dashboard/users');
      expect(paths).not.toContain('/dashboard/roles');
      expect(paths).not.toContain('/dashboard/payments');
    });

    it('should return base items for GUEST', () => {
      const result = getMenuItems(['GUEST']);
      const paths = result.map((i) => i.path);
      expect(paths).toContain('/dashboard');
      expect(paths).toContain('/dashboard/plots');
      expect(paths).toContain('/dashboard/documents');
      expect(paths).toContain('/dashboard/profile');
      expect(paths).not.toContain('/dashboard/users');
      expect(paths).not.toContain('/dashboard/roles');
      expect(paths).not.toContain('/dashboard/payments');
    });

    it('should filter correctly for multiple roles', () => {
      const result = getMenuItems(['MEMBER', 'ADMIN']);
      const paths = result.map((i) => i.path);
      // Should include ADMIN-only items
      expect(paths).toContain('/dashboard/users');
      expect(paths).toContain('/dashboard/payments');
      // Should NOT include SUPER_ADMIN-only items
      expect(paths).not.toContain('/dashboard/roles');
    });

    it('should be aliased as filterNavItemsByRole', () => {
      expect(filterNavItemsByRole).toBe(getMenuItems);
    });
  });

  // ========================================
  // getIconByPath
  // ========================================
  describe('getIconByPath', () => {
    it('should return icon for known path', () => {
      const icon = getIconByPath('/dashboard');
      expect(icon).toBeDefined();
      // LucideIcon может быть function (named export) или object (React component)
      expect(['function', 'object']).toContain(typeof icon);
    });

    it('should return undefined for unknown path', () => {
      const icon = getIconByPath('/nonexistent');
      expect(icon).toBeUndefined();
    });

    it('should return correct icon for each nav path', () => {
      const paths = [
        '/dashboard',
        '/dashboard/plots',
        '/dashboard/documents',
        '/dashboard/comms',
        '/dashboard/profile',
        '/dashboard/users',
        '/dashboard/roles',
        '/dashboard/payments',
      ];
      for (const path of paths) {
        expect(getIconByPath(path)).toBeDefined();
      }
    });
  });

  // ========================================
  // isActivePath
  // ========================================
  describe('isActivePath', () => {
    it('should return false for null/undefined currentPath', () => {
      expect(isActivePath('/dashboard', null)).toBe(false);
      expect(isActivePath('/dashboard', undefined)).toBe(false);
    });

    it('should return true for exact match on /dashboard', () => {
      expect(isActivePath('/dashboard', '/dashboard')).toBe(true);
    });

    it('should return false for /dashboard on nested paths (exact match rule)', () => {
      expect(isActivePath('/dashboard', '/dashboard/plots')).toBe(false);
      expect(isActivePath('/dashboard', '/dashboard/comms/messages')).toBe(false);
    });

    it('should return true for prefix match on non-dashboard paths', () => {
      expect(isActivePath('/dashboard/plots', '/dashboard/plots')).toBe(true);
      expect(isActivePath('/dashboard/plots', '/dashboard/plots/123')).toBe(true);
      expect(isActivePath('/dashboard/plots', '/dashboard/plots/42/edit')).toBe(true);
    });

    it('should return false for non-matching prefix', () => {
      expect(isActivePath('/dashboard/plots', '/dashboard/documents')).toBe(false);
      expect(isActivePath('/dashboard/plots', '/dashboard/plotting')).toBe(false);
    });

    it('should handle query parameters correctly', () => {
      expect(isActivePath('/dashboard/plots', '/dashboard/plots?page=2')).toBe(true);
      // /dashboard exact match: после strip query path='/dashboard' === '/dashboard' → true
      expect(isActivePath('/dashboard', '/dashboard?tab=1')).toBe(true);
    });

    it('should handle /dashboard with query params as exact match', () => {
      // /dashboard exact match rule: '/dashboard' !== '/dashboard?tab=1'
      // Actually the function strips query: path becomes '/dashboard' which === '/dashboard'
      expect(isActivePath('/dashboard', '/dashboard?tab=1')).toBe(true);
    });
  });

  // ========================================
  // generateBreadcrumbs
  // ========================================
  describe('generateBreadcrumbs', () => {
    it('should return empty array for null/undefined pathname', () => {
      expect(generateBreadcrumbs(null)).toEqual([]);
      expect(generateBreadcrumbs(undefined)).toEqual([]);
    });

    it('should generate breadcrumbs for /dashboard', () => {
      const result = generateBreadcrumbs('/dashboard');
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        label: '🏠 Дашборд',
        href: '/dashboard',
        isCurrent: true,
      });
    });

    it('should generate breadcrumbs for /dashboard/plots', () => {
      const result = generateBreadcrumbs('/dashboard/plots');
      expect(result).toHaveLength(2);
      expect(result[0].href).toBe('/dashboard');
      expect(result[0].isCurrent).toBe(false);
      expect(result[1].href).toBe('/dashboard/plots');
      expect(result[1].isCurrent).toBe(true);
    });

    it('should handle numeric IDs as #N', () => {
      const result = generateBreadcrumbs('/dashboard/plots/123');
      expect(result).toHaveLength(3);
      const last = result[2];
      expect(last.label).toContain('#123');
      expect(last.isCurrent).toBe(true);
    });

    it('should handle compound keys (comms/messages)', () => {
      const result = generateBreadcrumbs('/dashboard/comms/messages');
      expect(result).toHaveLength(3);
      // dashboard → comms → messages
      expect(result[0].label).toBe('🏠 Дашборд');
      // comms is compound key 'comms/messages' for the 'comms' segment when next is 'messages'
      expect(result[1].label).toBe('💬 Личные сообщения');
    });

    it('should strip query parameters', () => {
      const result = generateBreadcrumbs('/dashboard/plots?page=2&tab=active');
      expect(result).toHaveLength(2);
      expect(result[1].href).toBe('/dashboard/plots');
    });

    it('should respect maxDepth', () => {
      // maxDepth=4, path with 5 segments: /dashboard/plots/123/edit/something
      const result = generateBreadcrumbs('/dashboard/plots/123/edit/something', 4);
      expect(result.length).toBeLessThanOrEqual(4);
      // First items + last item
      expect(result[0].href).toBe('/dashboard');
      expect(result[result.length - 1].isCurrent).toBe(true);
    });

    it('should return correct type BreadcrumbItem', () => {
      const result: BreadcrumbItem[] = generateBreadcrumbs('/dashboard/profile');
      expect(result[0]).toHaveProperty('label');
      expect(result[0]).toHaveProperty('href');
      expect(result[0]).toHaveProperty('isCurrent');
    });

    it('should handle deeply nested paths', () => {
      const result = generateBreadcrumbs('/dashboard/documents/456/view', 4);
      expect(result.length).toBeLessThanOrEqual(4);
    });
  });
});
