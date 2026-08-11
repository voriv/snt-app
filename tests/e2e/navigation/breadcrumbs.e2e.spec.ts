/**
 * @file breadcrumbs.e2e.spec.ts
 * @category e2e/navigation
 * @description E2E-тесты для хлебных крошек (Breadcrumbs).
 *
 * @covers AC-NAV-06-1 — Breadcrumbs на страницах
 * @covers AC-NAV-06-2 — Авто-генерация по пути
 * @covers AC-NAV-06-3 — Кликабельные ссылки
 * @covers AC-NAV-06-4 — Последний уровень не кликабелен
 * @covers AC-NAV-06-5 — Разделитель между уровнями
 */
import { expect, test } from '@playwright/test';
import { login, TEST_USERS } from '../shared/test-helpers';

test.describe('Breadcrumbs (US-NAV-06)', () => {
  // AC-NAV-06-1: Breadcrumbs на страницах
  test('AC-NAV-06-1: Breadcrumbs отображаются на страницах дашборда', async ({ page }) => {
    await login(page, TEST_USERS.admin.email, TEST_USERS.admin.password);
    await page.goto('/dashboard/plots');
    await page.waitForTimeout(1000);

    const breadcrumbs = page.getByRole('navigation', { name: /Breadcrumb/i });
    await expect(breadcrumbs).toBeVisible();
  });

  // AC-NAV-06-2: Авто-генерация по пути
  test('AC-NAV-06-2: Breadcrumbs авто-генерируются по пути', async ({ page }) => {
    await login(page, TEST_USERS.admin.email, TEST_USERS.admin.password);
    await page.goto('/dashboard/documents');
    await page.waitForTimeout(1000);

    const breadcrumbs = page.getByRole('navigation', { name: /Breadcrumb/i });
    // Проверяем наличие крошек
    const items = breadcrumbs.getByRole('list').locator('li');
    const count = await items.count();
    expect(count).toBeGreaterThanOrEqual(2);
  });

  // AC-NAV-06-3: Кликабельные ссылки
  test('AC-NAV-06-3: Неактивные крошки — кликабельные ссылки', async ({ page }) => {
    await login(page, TEST_USERS.admin.email, TEST_USERS.admin.password);
    await page.goto('/dashboard/plots');
    await page.waitForTimeout(1000);

    const breadcrumbs = page.getByRole('navigation', { name: /Breadcrumb/i });

    // Первая крошка (Дашборд) должна быть ссылкой
    const dashboardLink = breadcrumbs.getByRole('link', { name: /Дашборд/i });
    await expect(dashboardLink).toBeVisible();
    await expect(dashboardLink).toHaveAttribute('href', '/dashboard');
  });

  // AC-NAV-06-4: Последний уровень не кликабелен
  test('AC-NAV-06-4: Последний элемент breadcrumbs не кликабелен', async ({ page }) => {
    await login(page, TEST_USERS.admin.email, TEST_USERS.admin.password);
    await page.goto('/dashboard/plots');
    await page.waitForTimeout(1000);

    const breadcrumbs = page.getByRole('navigation', { name: /Breadcrumb/i });

    // Последний элемент должен иметь aria-current="page"
    const current = breadcrumbs.locator('[aria-current="page"]');
    await expect(current).toBeVisible();
  });

  // AC-NAV-06-5: Разделитель между уровнями
  test('AC-NAV-06-5: Разделитель между уровнями breadcrumbs', async ({ page }) => {
    await login(page, TEST_USERS.admin.email, TEST_USERS.admin.password);
    await page.goto('/dashboard/plots');
    await page.waitForTimeout(1000);

    const breadcrumbs = page.getByRole('navigation', { name: /Breadcrumb/i });

    // Проверяем наличие разделителя ›
    const separator = breadcrumbs.locator('[aria-hidden="true"]').first();
    const text = await separator.textContent();
    expect(text).toContain('›');
  });
});
