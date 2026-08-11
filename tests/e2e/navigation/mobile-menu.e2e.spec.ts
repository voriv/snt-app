/**
 * @file mobile-menu.e2e.spec.ts
 * @category e2e/navigation
 * @description E2E-тесты для мобильного меню (гамбургер + drawer).
 *
 * @covers AC-NAV-07-1 — Гамбургер на мобильных
 * @covers AC-NAV-07-2 — Открытие drawer
 * @covers AC-NAV-07-3 — Закрытие по клику на пункт
 * @covers AC-NAV-07-4 — Закрытие по overlay
 * @covers AC-NAV-07-5 — Закрытие по Escape
 */
import { expect, test } from '@playwright/test';
import { login, TEST_USERS } from '../shared/test-helpers';

test.describe('Mobile Menu / Hamburger (US-NAV-07)', () => {
  // AC-NAV-07-1: Гамбургер на мобильных
  test('AC-NAV-07-1: Гамбургер-кнопка видна на мобильных', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    await login(page, TEST_USERS.admin.email, TEST_USERS.admin.password);
    await page.goto('/dashboard');
    await page.waitForTimeout(1000);

    // Гамбургер-кнопка должна быть видна
    const hamburger = page.getByRole('button', { name: /Открыть меню/i })
      ?? page.getByLabel(/Открыть меню/i);
    await expect(hamburger).toBeVisible();
  });

  // AC-NAV-07-2: Открытие drawer
  test('AC-NAV-07-2: Клик на гамбургер открывает drawer', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    await login(page, TEST_USERS.admin.email, TEST_USERS.admin.password);
    await page.goto('/dashboard');
    await page.waitForTimeout(1000);

    const hamburger = page.getByRole('button', { name: /Открыть меню/i })
      ?? page.getByLabel(/Открыть меню/i);
    await hamburger.click();

    // Drawer должен появиться
    const drawer = page.getByRole('dialog');
    await expect(drawer).toBeVisible();
    await expect(drawer).toBeInViewport();
  });

  // AC-NAV-07-3: Закрытие по клику на пункт
  test('AC-NAV-07-3: Клик на пункт меню закрывает drawer', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    await login(page, TEST_USERS.admin.email, TEST_USERS.admin.password);
    await page.goto('/dashboard');
    await page.waitForTimeout(1000);

    // Открываем drawer
    const hamburger = page.getByRole('button', { name: /Открыть меню/i })
      ?? page.getByLabel(/Открыть меню/i);
    await hamburger.click();

    const drawer = page.getByRole('dialog');
    await expect(drawer).toBeVisible();

    // Кликаем на пункт "Дашборд"
    await drawer.getByText('Дашборд').click();
    await page.waitForTimeout(500);

    // Drawer должен закрыться
    await expect(drawer).not.toBeVisible();
  });

  // AC-NAV-07-4: Закрытие по overlay
  test('AC-NAV-07-4: Клик на overlay закрывает drawer', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    await login(page, TEST_USERS.admin.email, TEST_USERS.admin.password);
    await page.goto('/dashboard');
    await page.waitForTimeout(1000);

    // Открываем drawer
    const hamburger = page.getByRole('button', { name: /Открыть меню/i })
      ?? page.getByLabel(/Открыть меню/i);
    await hamburger.click();

    const drawer = page.getByRole('dialog');
    await expect(drawer).toBeVisible();

    // Кликаем на overlay (фон за drawer)
    await page.click('body', { position: { x: 10, y: 100 } });
    await page.waitForTimeout(500);

    await expect(drawer).not.toBeVisible();
  });

  // AC-NAV-07-5: Закрытие по Escape
  test('AC-NAV-07-5: Escape закрывает drawer', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    await login(page, TEST_USERS.admin.email, TEST_USERS.admin.password);
    await page.goto('/dashboard');
    await page.waitForTimeout(1000);

    // Открываем drawer
    const hamburger = page.getByRole('button', { name: /Открыть меню/i })
      ?? page.getByLabel(/Открыть меню/i);
    await hamburger.click();

    const drawer = page.getByRole('dialog');
    await expect(drawer).toBeVisible();

    // Нажимаем Escape
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);

    await expect(drawer).not.toBeVisible();
  });
});
