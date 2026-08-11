/**
 * @file 404.e2e.spec.ts
 * @category e2e/navigation
 * @description E2E-тесты для страницы 404 (Not Found).
 *
 * @covers AC-NAV-03-1 — Страница 404 для несуществующих маршрутов
 * @covers AC-NAV-03-2 — Контекстные ссылки для авторизованных
 * @covers AC-NAV-03-3 — Контекстные ссылки для неавторизованных
 */
import { expect, test } from '@playwright/test';
import { login, TEST_USERS } from '../shared/test-helpers';

test.describe('404 Page (US-NAV-03)', () => {
  // AC-NAV-03-1: Страница 404
  test('AC-NAV-03-1: Несуществующий маршрут показывает 404', async ({ page }) => {
    await page.goto('/nonexistent-page-that-does-not-exist');
    await page.waitForTimeout(1000);

    // Проверяем заголовок 404
    const heading = page.getByRole('heading', { name: /404/i });
    await expect(heading).toBeVisible();
    expect(await heading.textContent()).toContain('404');
  });

  // AC-NAV-03-2: Авторизованный пользователь видит ссылку на дашборд
  test('AC-NAV-03-2: Авторизованный видит "Вернуться на дашборд"', async ({ page }) => {
    await login(page, TEST_USERS.admin.email, TEST_USERS.admin.password);
    await page.goto('/nonexistent-page');
    await page.waitForTimeout(1000);

    // Проверяем кнопку "Вернуться на дашборд"
    const backToDashboard = page.getByRole('button', { name: /Вернуться на дашборд/i })
      ?? page.getByText(/Вернуться на дашборд/i);
    await expect(backToDashboard).toBeVisible();
  });

  // AC-NAV-03-3: Неавторизованный видит ссылку "На главную"
  test('AC-NAV-03-3: Неавторизованный видит "На главную"', async ({ page }) => {
    await page.context().clearCookies();
    await page.goto('/nonexistent-page');
    await page.waitForTimeout(1000);

    // Проверяем кнопку "На главную"
    const toHome = page.getByRole('button', { name: /На главную/i })
      ?? page.getByText(/На главную/i);
    await expect(toHome).toBeVisible();
  });

  // A11y: role="alert"
  test('A11y: 404 страница имеет role=alert', async ({ page }) => {
    await page.goto('/nonexistent-page');
    await page.waitForTimeout(1000);

    const alert = page.getByRole('alert');
    await expect(alert).toBeVisible();
  });

  // A11y: aria-label
  test('A11y: 404 страница имеет aria-label "Страница не найдена"', async ({ page }) => {
    await page.goto('/nonexistent-page');
    await page.waitForTimeout(1000);

    const alert = page.locator('[aria-label="Страница не найдена"]');
    await expect(alert).toBeVisible();
  });
});
