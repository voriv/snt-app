/**
 * @file redirects.e2e.spec.ts
 * @category e2e/navigation
 * @description E2E-тесты для редиректов (защита маршрутов, старые URL).
 *
 * @covers AC-1 — Неавторизованный видит главную
 * @covers AC-2 — Авторизованный редиректится с / на /dashboard
 * @covers AC-3 — Неавторизованный редиректится с /dashboard/* на /login
 * @covers AC-9 — Переход по старым URL → /dashboard/comms
 * @covers EC-01 — Прямой доступ без авторизации → редирект на /auth/login
 * @covers EC-07 — Старые URL /dashboard/messages, /dashboard/chats → /dashboard/comms
 */
import { expect, test } from '@playwright/test';
import { login, TEST_USERS } from '../shared/test-helpers';

test.describe('Redirects (US-NAV-01, US-NAV-04)', () => {
  // AC-1: Неавторизованный пользователь видит главную страницу
  test('AC-1: Неавторизованный видит главную страницу', async ({ page }) => {
    await page.context().clearCookies();
    const response = await page.goto('/');

    // Главная страница должна загрузиться
    await expect(page).toHaveURL(/\/$/);
    expect(response?.status()).toBe(200);
  });

  // AC-2: Авторизованный перенаправляется на дашборд
  test('AC-2: Авторизованный перенаправляется с / на /dashboard', async ({ page }) => {
    await login(page, TEST_USERS.admin.email, TEST_USERS.admin.password);
    await page.goto('/');
    await page.waitForTimeout(1000);

    // Должен быть редирект на /dashboard
    const url = page.url();
    expect(url).toMatch(/\/dashboard/);
  });

  // AC-3: Неавторизованный перенаправляется с /dashboard/* на /login
  test('AC-3: Неавторизованный перенаправляется с /dashboard/plots на /login', async ({ page }) => {
    await page.context().clearCookies();
    await page.goto('/dashboard/plots');
    await page.waitForTimeout(2000);

    // Ожидание редиректа на страницу входа
    const url = page.url();
    expect(url).toMatch(/\/login|\/auth\/login/);
  });

  // EC-01: Прямой доступ к защищённой странице без авторизации
  test('EC-01: Прямой доступ к /dashboard/documents без авторизации → редирект', async ({ page }) => {
    await page.context().clearCookies();
    await page.goto('/dashboard/documents');
    await page.waitForTimeout(2000);

    const url = page.url();
    expect(url).toMatch(/\/login|\/auth\/login/);
  });

  // EC-07: Старые URL → /dashboard/comms
  test('EC-07: /dashboard/messages редиректится на /dashboard/comms', async ({ page }) => {
    await login(page, TEST_USERS.admin.email, TEST_USERS.admin.password);
    await page.goto('/dashboard/messages');
    await page.waitForTimeout(2000);

    const url = page.url();
    expect(url).toMatch(/\/dashboard\/comms/);
  });

  test('EC-07: /dashboard/chats редиректится на /dashboard/comms', async ({ page }) => {
    await login(page, TEST_USERS.admin.email, TEST_USERS.admin.password);
    await page.goto('/dashboard/chats');
    await page.waitForTimeout(2000);

    const url = page.url();
    expect(url).toMatch(/\/dashboard\/comms/);
  });

  // AC-9: Старые URL редирект
  test('AC-9: Переход по старым URL перенаправляет на /dashboard/comms', async ({ page }) => {
    await login(page, TEST_USERS.admin.email, TEST_USERS.admin.password);

    // Проверка /dashboard/messages
    await page.goto('/dashboard/messages');
    await page.waitForTimeout(2000);
    expect(page.url()).toMatch(/\/dashboard\/comms/);
  });
});
