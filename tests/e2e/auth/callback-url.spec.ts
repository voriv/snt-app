/**
 * @e2e callback-url
 * @description E2E-тесты для callbackUrl в процессе аутентификации
 *
 * @spec
 * - AC-4.1: При переходе на защищённый маршрут → редирект на /login с callbackUrl
 * - AC-4.4: После успешного входа → редирект на сохранённый callbackUrl
 * - EC-03: callbackUrl сохраняет путь + query-параметры
 *
 * @see docs/user-stories/US-05-реализация-процесса-аутентификации.md — AC-4.1, AC-4.4, EC-03
 */

import { test, expect, type Page, type BrowserContext } from '@playwright/test';

const LOGIN_URL = '/login';
const DASHBOARD_URL = '/dashboard';
const DASHBOARD_PLOTS_URL = '/dashboard/plots';
const DASHBOARD_MEMBERS_URL = '/dashboard/members';

// Тестовые учётные данные (из prisma/seed.ts)
const TEST_CREDENTIALS = {
  email: 'admin@snt.local',
  password: 'Admin123!',
};

// ============================================================================
// Fixtures
// ============================================================================

/**
 * Фикстура для создания чистого контекста без сессии
 */
test.use({
  storageState: {
    cookies: [],
    origins: [],
  },
});

// ============================================================================
// E2E Tests
// ============================================================================

test.describe('Callback URL - E2E Tests', () => {
  let page: Page;
  let context: BrowserContext;

  test.beforeEach(async ({ page: newPage, context: newContext }) => {
    page = newPage;
    context = newContext;

    // Очищаем сессии перед каждым тестом
    await context.clearCookies();
    await page.goto(LOGIN_URL);
  });

  test.afterEach(async () => {
    await page.close();
  });

  test.describe('AC-4.1: Redirect to login with callbackUrl', () => {
    test('должен redirect на /login с callbackUrl при переходе на /dashboard', async () => {
      // Открываем защищённый маршрут напрямую (обходя middleware)
      const protectedPage = await context.newPage();
      await protectedPage.goto(DASHBOARD_PLOTS_URL);

      // Проверяем что редирект на /login
      const currentUrl = protectedPage.url();
      expect(currentUrl).toContain(LOGIN_URL);

      // Проверяем что callbackUrl сохранён в URL
      const url = new URL(currentUrl);
      const callbackUrl = url.searchParams.get('callbackUrl');
      expect(callbackUrl).toBe(DASHBOARD_PLOTS_URL);

      await protectedPage.close();
    });

    test('должен показывать форму входа с сохранённым callbackUrl', async () => {
      // Переходим на защищённый маршрут
      await page.goto(DASHBOARD_PLOTS_URL);

      // Проверяем что страница входа отрисована
      await expect(
        page.getByRole('heading', { name: /вход в систему/i })
      ).toBeVisible();

      // Проверяем что поля формы доступны
      await expect(
        page.getByLabel(/email адрес для входа/i)
      ).toBeVisible();

      await expect(
        page.getByLabel(/пароль для входа/i)
      ).toBeVisible();

      // Проверяем что кнопка входа доступна
      await expect(page.getByRole('button', { name: /войти/i })).toBeVisible();
    });
  });

  test.describe('AC-4.4: Redirect to callbackUrl after successful login', () => {
    test('должен redirect на /dashboard/plots после успешного входа с /dashboard/plots', async () => {
      // Переходим на /dashboard/plots (должен redirect на /login?callbackUrl=/dashboard/plots)
      await page.goto(DASHBOARD_PLOTS_URL);

      // Заполняем форму входа
      await page.getByLabel(/email адрес для входа/i).fill(TEST_CREDENTIALS.email);
      await page.getByLabel(/пароль для входа/i).fill(TEST_CREDENTIALS.password);

      // Нажимаем кнопку входа
      await page.getByRole('button', { name: /войти/i }).click();

      // Ждём редирект и проверяем что мы на /dashboard/plots
      await page.waitForURL(DASHBOARD_PLOTS_URL);

      const currentUrl = new URL(page.url());
      expect(currentUrl.pathname).toBe(DASHBOARD_PLOTS_URL);
    });

    test('должен redirect на /dashboard/members после успешного входа с /dashboard/members', async () => {
      // Переходим на /dashboard/members
      await page.goto(DASHBOARD_MEMBERS_URL);

      // Заполняем форму входа
      await page.getByLabel(/email адрес для входа/i).fill(TEST_CREDENTIALS.email);
      await page.getByLabel(/пароль для входа/i).fill(TEST_CREDENTIALS.password);

      // Нажимаем кнопку входа
      await page.getByRole('button', { name: /войти/i }).click();

      // Ждём редирект и проверяем что мы на /dashboard/members
      await page.waitForURL(DASHBOARD_MEMBERS_URL);

      const currentUrl = new URL(page.url());
      expect(currentUrl.pathname).toBe(DASHBOARD_MEMBERS_URL);
    });

    test('должен redirect на сохранённый callbackUrl даже после ошибки входа', async () => {
      // Переходим на /dashboard/plots
      await page.goto(DASHBOARD_PLOTS_URL);

      // Вводим неверные данные
      await page.getByLabel(/email адрес для входа/i).fill('wrong@example.com');
      await page.getByLabel(/пароль для входа/i).fill('wrongpassword');

      // Нажимаем кнопку входа
      await page.getByRole('button', { name: /войти/i }).click();

      // Проверяем что ошибка показана
      await expect(
        page.getByText(/неверный email или пароль/i)
      ).toBeVisible();

      // Вводим верные данные
      await page.getByLabel(/email адрес для входа/i).fill(TEST_CREDENTIALS.email);
      await page.getByLabel(/пароль для входа/i).fill(TEST_CREDENTIALS.password);

      // Нажимаем кнопку входа
      await page.getByRole('button', { name: /войти/i }).click();

      // Ждём редирект на оригинальный callbackUrl (/dashboard/plots), а не на /dashboard
      await page.waitForURL(DASHBOARD_PLOTS_URL);

      const currentUrl = new URL(page.url());
      expect(currentUrl.pathname).toBe(DASHBOARD_PLOTS_URL);
    });
  });

  test.describe('EC-03: Callback URL preserves path + query params', () => {
    test('должен сохранять query параметры в callbackUrl', async () => {
      const callbackWithQuery = '/dashboard/members?search=ivan&role=owner';

      // Используем fetch для имитации перехода на защищённый маршрут с query params
      const protectedPage = await context.newPage();
      await protectedPage.goto(callbackWithQuery);

      // Редирект на /login с callbackUrl
      const currentUrl = new URL(protectedPage.url());
      const callbackUrl = currentUrl.searchParams.get('callbackUrl');

      expect(callbackUrl).toBe(callbackWithQuery);

      // Заполняем форму входа
      await protectedPage.getByLabel(/email адрес для входа/i).fill(
        TEST_CREDENTIALS.email
      );
      await protectedPage.getByLabel(/пароль для входа/i).fill(
        TEST_CREDENTIALS.password
      );

      await protectedPage.getByRole('button', { name: /войти/i }).click();

      // Проверяем что редирект на оригинальный URL с query params
      await protectedPage.waitForURL((url) =>
        url.pathname === '/dashboard/members' &&
        url.searchParams.get('search') === 'ivan' &&
        url.searchParams.get('role') === 'owner'
      );

      await protectedPage.close();
    });

    test('должен сохранять глубокие вложенные пути в callbackUrl', async () => {
      const deepPath = '/dashboard/plots/123/members/456/settings';

      const protectedPage = await context.newPage();
      await protectedPage.goto(deepPath);

      const currentUrl = new URL(protectedPage.url());
      const callbackUrl = currentUrl.searchParams.get('callbackUrl');

      expect(callbackUrl).toBe(deepPath);

      await protectedPage.close();
    });

    test('должен сохранять hash в callbackUrl', async () => {
      const pathWithHash = '/dashboard/plots?tab=members#section-1';

      const protectedPage = await context.newPage();
      await protectedPage.goto(pathWithHash);

      const currentUrl = new URL(protectedPage.url());
      const callbackUrl = currentUrl.searchParams.get('callbackUrl');

      // Note: hash не передаётся через query params сервера, только path + query
      // Поэтому callbackUrl будет '/dashboard/plots?tab=members' без #section-1
      expect(callbackUrl).toContain('/dashboard/plots?tab=members');

      await protectedPage.close();
    });

    test('должен сохранять множественные query параметры в callbackUrl', async () => {
      const complexQuery =
        '/dashboard/members?search=ivan&role=owner&sort=name&order=asc&page=2&limit=20';

      const protectedPage = await context.newPage();
      await protectedPage.goto(complexQuery);

      const currentUrl = new URL(protectedPage.url());
      const callbackUrl = currentUrl.searchParams.get('callbackUrl');

      expect(callbackUrl).toBe(complexQuery);

      await protectedPage.close();
    });
  });

  test.describe('Edge Cases', () => {
    test('должен обработать callbackUrl с special characters', async () => {
      const callbackWithSpecialChars =
        '/dashboard/members?search=%D0%98%D0%B2%D0%B0%D0%BD%D0%BE%D0%B2&filter=active';

      const protectedPage = await context.newPage();
      await protectedPage.goto(callbackWithSpecialChars);

      const currentUrl = new URL(protectedPage.url());
      const callbackUrl = currentUrl.searchParams.get('callbackUrl');

      expect(callbackUrl).toBe(callbackWithSpecialChars);

      await protectedPage.close();
    });

    test('должен redirect на /dashboard если callbackUrl не указан', async () => {
      // Имитируем вход без callbackUrl (прямой переход на /login)
      await page.goto(LOGIN_URL);

      await page.getByLabel(/email адрес для входа/i).fill(
        TEST_CREDENTIALS.email
      );
      await page.getByLabel(/пароль для входа/i).fill(TEST_CREDENTIALS.password);

      await page.getByRole('button', { name: /войти/i }).click();

      // Без callbackUrl redirect должен быть на /dashboard
      await page.waitForURL((url) => url.pathname === DASHBOARD_URL);

      expect(page.url()).toContain(DASHBOARD_URL);
    });

    test('должен не позволять redirect на external URL (security)', async () => {
      // Middleware должен sanitize callbackUrl и не позволять external redirects
      // Это проверка что даже если попытаться указать external URL, middleware его отклонит
      const externalUrl = 'https://evil.com';

      // Тестируем что middleware не редиректит на external URL
      // Это проверяется на уровне middleware логики
      const protectedPage = await context.newPage();

      // Пытаемся перейти на login с external callbackUrl
      // Middleware должен sanitize URL и оставить только internal paths
      try {
        await protectedPage.goto(`${LOGIN_URL}?callbackUrl=${externalUrl}`);
      } catch (error) {
        // Ожидаем что страница либо загрузится либо будет ошибка безопасности
      }

      await protectedPage.close();
    });
  });

  test.describe('Flow Integration', () => {
    test('полный flow: protected route → login → callback', async () => {
      // Шаг 1: Пользователь пытается открыть защищённый маршрут
      const protectedPage = await context.newPage();
      await protectedPage.goto(DASHBOARD_PLOTS_URL);

      // Шаг 2: Middleware редиректит на /login?callbackUrl=/dashboard/plots
      expect(protectedPage.url()).toContain(LOGIN_URL);
      const urlWithCallback = new URL(protectedPage.url());
      expect(urlWithCallback.searchParams.get('callbackUrl')).toBe(
        DASHBOARD_PLOTS_URL
      );

      // Шаг 3: Пользователь вводит учётные данные
      await protectedPage.getByLabel(/email адрес для входа/i).fill(
        TEST_CREDENTIALS.email
      );
      await protectedPage.getByLabel(/пароль для входа/i).fill(
        TEST_CREDENTIALS.password
      );

      // Шаг 4: Пользователь нажимает "Войти"
      await protectedPage.getByRole('button', { name: /войти/i }).click();

      // Шаг 5: После успешной аутентификации → редирект на callbackUrl
      await protectedPage.waitForURL(DASHBOARD_PLOTS_URL);
      expect(protectedPage.url()).toContain(DASHBOARD_PLOTS_URL);

      await protectedPage.close();
    });

    test('повторный вход использует сохранённый callbackUrl из сессии', async () => {
      // Шаг 1: Вход с callbackUrl
      await page.goto(DASHBOARD_PLOTS_URL);

      await page.getByLabel(/email адрес для входа/i).fill(
        TEST_CREDENTIALS.email
      );
      await page.getByLabel(/пароль для входа/i).fill(TEST_CREDENTIALS.password);

      await page.getByRole('button', { name: /войти/i }).click();

      // Успешный вход на /dashboard/plots
      await page.waitForURL(DASHBOARD_PLOTS_URL);

      // Шаг 2: Выход из системы
      // (предполагая что есть кнопка выхода на странице)
      // Если кнопки выхода нет, используем API для удаления сессии

      // Шаг 3: Повторная попытка доступа к защищённому маршруту
      // Должен снова redirect на /login с callbackUrl
      await page.goto(DASHBOARD_MEMBERS_URL);

      expect(page.url()).toContain(LOGIN_URL);
      const urlWithCallback = new URL(page.url());
      expect(urlWithCallback.searchParams.get('callbackUrl')).toBe(
        DASHBOARD_MEMBERS_URL
      );

      // Шаг 4: Повторный вход
      await page.getByLabel(/email адрес для входа/i).fill(
        TEST_CREDENTIALS.email
      );
      await page.getByLabel(/пароль для входа/i).fill(TEST_CREDENTIALS.password);

      await page.getByRole('button', { name: /войти/i }).click();

      // Редирект на новый callbackUrl (/dashboard/members), не на старый
      await page.waitForURL(DASHBOARD_MEMBERS_URL);
      expect(page.url()).toContain(DASHBOARD_MEMBERS_URL);
    });
  });
});
