/**
 * @module nav-items.config.test
 * @description Unit-тесты для конфигурации пунктов навигации.
 *
 * @covers AC-NAV-02-4 — Ролевые пункты меню
 * @covers AC-NAV-05-2 — Ролевые пункты в sidebar
 * @covers AC-NAV-07-7 — Ролевые пункты в drawer
 */
import { describe, it, expect } from 'vitest';
import {
  navItems,
  breadcrumbMap,
  navGroupOrder,
  navGroupLabels,
  type NavItem,
  type NavGroup,
} from '@/components/features/navigation/nav-items.config';

describe('nav-items.config', () => {
  // ========================================
  // navItems — структура и количество
  // ========================================
  describe('navItems', () => {
    it('should contain exactly 8 navigation items', () => {
      expect(navItems).toHaveLength(8);
    });

    it('should contain all expected paths', () => {
      const paths = navItems.map((item) => item.path);
      expect(paths).toContain('/dashboard');
      expect(paths).toContain('/dashboard/plots');
      expect(paths).toContain('/dashboard/documents');
      expect(paths).toContain('/dashboard/comms');
      expect(paths).toContain('/dashboard/profile');
      expect(paths).toContain('/dashboard/users');
      expect(paths).toContain('/dashboard/roles');
      expect(paths).toContain('/dashboard/payments');
    });

    it('should have unique paths', () => {
      const paths = navItems.map((item) => item.path);
      const uniquePaths = new Set(paths);
      expect(uniquePaths.size).toBe(paths.length);
    });

    it('should have all paths starting with /dashboard', () => {
      expect(navItems.every((item) => item.path.startsWith('/dashboard'))).toBe(true);
    });

    it('should have a title for each item', () => {
      expect(navItems.every((item) => item.title && item.title.length > 0)).toBe(true);
    });

    it('should have an icon for each item', () => {
      // Lucide icons can be functions or objects (forwardRef components)
      expect(navItems.every((item) => ['function', 'object'].includes(typeof item.icon))).toBe(true);
    });

    it('should have a group for each item', () => {
      const validGroups: NavGroup[] = ['main', 'account', 'admin', 'finance'];
      expect(
        navItems.every((item) => validGroups.includes(item.group))
      ).toBe(true);
    });
  });

  // ========================================
  // Ролевая видимость
  // ========================================
  describe('ролевая видимость', () => {
    it('should mark /dashboard/users as ADMIN/SUPER_ADMIN only', () => {
      const item = navItems.find((i) => i.path === '/dashboard/users');
      expect(item).toBeDefined();
      expect(item?.roles).toEqual(['ADMIN', 'SUPER_ADMIN']);
    });

    it('should mark /dashboard/roles as SUPER_ADMIN only', () => {
      const item = navItems.find((i) => i.path === '/dashboard/roles');
      expect(item).toBeDefined();
      expect(item?.roles).toEqual(['SUPER_ADMIN']);
    });

    it('should mark /dashboard/payments as ADMIN/SUPER_ADMIN only', () => {
      const item = navItems.find((i) => i.path === '/dashboard/payments');
      expect(item).toBeDefined();
      expect(item?.roles).toEqual(['ADMIN', 'SUPER_ADMIN']);
    });

    it('should have no roles restriction on base items', () => {
      const basePaths = [
        '/dashboard',
        '/dashboard/plots',
        '/dashboard/documents',
        '/dashboard/comms',
        '/dashboard/profile',
      ];
      for (const path of basePaths) {
        const item = navItems.find((i) => i.path === path);
        expect(item?.roles).toBeUndefined();
      }
    });
  });

  // ========================================
  // Группировка
  // ========================================
  describe('группировка', () => {
    it('should assign correct groups to items', () => {
      expect(navItems.find((i) => i.path === '/dashboard')?.group).toBe('main');
      expect(navItems.find((i) => i.path === '/dashboard/plots')?.group).toBe('main');
      expect(navItems.find((i) => i.path === '/dashboard/documents')?.group).toBe('main');
      expect(navItems.find((i) => i.path === '/dashboard/comms')?.group).toBe('main');
      expect(navItems.find((i) => i.path === '/dashboard/profile')?.group).toBe('account');
      expect(navItems.find((i) => i.path === '/dashboard/users')?.group).toBe('admin');
      expect(navItems.find((i) => i.path === '/dashboard/roles')?.group).toBe('admin');
      expect(navItems.find((i) => i.path === '/dashboard/payments')?.group).toBe('finance');
    });

    it('should have navGroupOrder with 4 groups', () => {
      expect(navGroupOrder).toEqual(['main', 'account', 'admin', 'finance']);
    });

    it('should have labels for all groups', () => {
      expect(navGroupLabels.main).toBeDefined();
      expect(navGroupLabels.account).toBeDefined();
      expect(navGroupLabels.admin).toBeDefined();
      expect(navGroupLabels.finance).toBeDefined();
    });
  });

  // ========================================
  // breadcrumbMap
  // ========================================
  describe('breadcrumbMap', () => {
    it('should contain entries for all segments', () => {
      expect(breadcrumbMap.dashboard).toBeDefined();
      expect(breadcrumbMap.plots).toBeDefined();
      expect(breadcrumbMap.documents).toBeDefined();
      expect(breadcrumbMap.comms).toBeDefined();
      expect(breadcrumbMap.users).toBeDefined();
      expect(breadcrumbMap.roles).toBeDefined();
      expect(breadcrumbMap.profile).toBeDefined();
      expect(breadcrumbMap.payments).toBeDefined();
    });

    it('should contain compound keys for comms sub-sections', () => {
      expect(breadcrumbMap['comms/messages']).toBeDefined();
      expect(breadcrumbMap['comms/chats']).toBeDefined();
      expect(breadcrumbMap['comms/announcements']).toBeDefined();
      expect(breadcrumbMap['comms/moderation']).toBeDefined();
    });

    it('should contain action keys (edit, new, create)', () => {
      expect(breadcrumbMap.edit).toBeDefined();
      expect(breadcrumbMap.new).toBeDefined();
      expect(breadcrumbMap.create).toBeDefined();
    });

    it('should have emoji prefixes in labels', () => {
      expect(breadcrumbMap.dashboard).toMatch(/^🏠/);
      expect(breadcrumbMap.plots).toMatch(/^📋/);
      expect(breadcrumbMap.documents).toMatch(/^📄/);
      expect(breadcrumbMap.comms).toMatch(/^💬/);
    });
  });
});
