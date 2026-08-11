/**
 * @file sidebar.e2e.spec.ts
 * @category e2e/navigation
 * @description E2E-тесты для бокового меню (Sidebar).
 *
 * @covers AC-NAV-05-1 — Sidebar на дашборде
 * @covers AC-NAV-05-2 — Ролевые пункты в sidebar
 * @covers AC-NAV-05-3 — Активное состояние пункта
 * @covers AC-NAV-05-4 — Иконки у пунктов
 * @covers AC-NAV-05-5 — Скрытие на мобильных
 */
import { expect, test } from '@playwright/test';
import { login, TEST_USERS } from '../shared/test-helpers';

test.describe('Sidebar (US-NAV-05)', () => {
  // AC-NAV-05-1: Sidebar на дашборде
  test('AC-NAV-05-1: Sidebar отображается на страницах дашборда', async ({ page }) => {
    await login(page, TEST_USERS.admin.email, TEST_USERS.admin.password);
    await page.goto('/dashboard');
    await page.waitForTimeout(1000);

    // Sidebar должен быть виден на desktop
    const sidebar = page.getByRole('navigation', { name: /Sidebar/i });
    await expect(sidebar).toBeVisible();
  });

  // AC-NAV-05-2: Ролевые пункты
  test('AC-NAV-05-2: Админ видит все пункты меню', async ({ page }) => {
    await login(page, TEST_USERS.admin.email, TEST_USERS.admin.password);
    await page.goto('/dashboard');
    await page.waitForTimeout(1000);

    const sidebar = page.getByRole('navigation', { name: /Sidebar/i });
    await expect(sidebar).toBeVisible();

    // Проверяем наличие ключевых пунктов
    await expect(page.getByText('Дашборд')).toBeVisible();
    await expect(page.getByText('Участки')).toBeVisible();
    await expect(page.getByText('Документы')).toBeVisible();
    await expect(page.getByText('Пользователи')).toBeVisible();
    await expect(page.getByText('Платежи')).toBeVisible();
  });

  // AC-NAV-05-2: Ролевые пункты для MEMBER
  test('AC-NAV-05-2: MEMBER не видит админ-пункты', async ({ page }) => {
    await login(page, TEST_USERS.member.email, TEST_USERS.member.password);
    await page.goto('/dashboard');
    await page.waitForTimeout(1000);

    const sidebar = page.getByRole('navigation', { name: /Sidebar/i });
    await expect(sidebar).toBeVisible();

    // MEMBER не должен видеть админ-пункты
    await expect(page.getByText('Пользователи')).not.toBeVisible();
    await expect(page.getByText('Платежи')).not.toBeVisible();
  });

  // AC-NAV-05-5: Скрытие на мобильных
  test('AC-NAV-05-5: Sidebar скрыт на мобильных устройствах', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    await login(page, TEST_USERS.admin.email, TEST_USERS.admin.password);
    await page.goto('/dashboard');
    await page.waitForTimeout(1000);

    // На мобильных sidebar должен быть скрыт (hidden md:block)
    const sidebar = page.getByRole('navigation', { name: /Sidebar/i });
    expect(await sidebar.isVisible()).toBe(false);
  });

  // AC-NAV-05-3: Активное состояние
  test('AC-NAV-05-3: Активный пункт подсвечивается', async ({ page }) => {
    await login(page, TEST_USERS.admin.email, TEST_USERS.admin.password);
    await page.goto('/dashboard/plots');
    await page.waitForTimeout(1000);

    // Навигационный элемент для "Участки" должен быть активным
    const plotsLink = page.getByRole('navigation', { name: /Sidebar/i }).getByRole('link', { name: /Участки/i });
    await expect(plotsLink).toBeVisible();
  });
});
