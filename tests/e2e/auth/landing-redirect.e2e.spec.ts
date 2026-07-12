import { test, expect, Page } from '@playwright/test';
import { login } from './helpers';

/**
 * Создаёт авторизованную сессию для тестов
 */
async function goToHomeWithSession(page: Page) {
  // Авторизуем пользователя
  await login(page, 'test@example.com', 'TestPassword123!');
}

test.describe('Landing Page Redirect - E2E Tests', () => {
  test.describe('AC-10.1.1: Перенаправление авторизованного пользователя', () => {
    test('должен перенаправлять авторизованного пользователя на /dashboard', async ({ page }) => {
      // Авторизуем пользователя перед переходом на главную
      await goToHomeWithSession(page);
      
      // Переходим на главную страницу
      await page.goto('/');
      
      // Ожидаем перенаправление на dashboard
      await expect(page).toHaveURL(/\/dashboard/, { timeout: 5000 });
    });

    test('не должен создавать лишних записей в истории браузера', async ({ page }) => {
      await goToHomeWithSession(page);
      
      // Сохраняем количество записей истории
      const initialHistoryLength = await page.evaluate(() => window.history.length);
      
      // Переходим на главную
      await page.goto('/');
      
      // Ожидаем перенаправление
      await expect(page).toHaveURL(/\/dashboard/, { timeout: 5000 });
      
      // История не должна увеличиваться (используется replace вместо push)
      const finalHistoryLength = await page.evaluate(() => window.history.length);
      
      // История должна остаться той же (replace не добавляет запись)
      expect(finalHistoryLength).toBeLessThanOrEqual(initialHistoryLength + 1);
    });

    test('должен сохранять сессию после перенаправления', async ({ page, browser }) => {
      const context = await browser.newContext();
      const sessionPage = await context.newPage();
      
      // Авторизуем пользователя
      await login(sessionPage, 'test@example.com', 'TestPassword123!');
      
      // Переходим на главную
      await sessionPage.goto('/');
      
      // Ожидаем перенаправление
      await expect(sessionPage).toHaveURL(/\/dashboard/, { timeout: 5000 });
      
      // Проверяем что авторизация сохранилась
      const navItem = sessionPage.locator('nav a[href="/dashboard"]');
      await expect(navItem).toBeVisible();
      
      await context.close();
    });
  });

  test.describe('AC-10.1.2: Оставление landing page для неавторизованных', () => {
    test('должен отображать landing page для неавторизованного пользователя', async ({ page }) => {
      // Убеждаемся что нет активной сессии
      await page.goto('/');
      
      // Проверяем что отображается landing page
      await expect(page.locator('h1')).toContainText('СНТ Берёзки-НТ');
      await expect(page.locator('p')).toContainText(
        'Система управления товариществом'
      );
    });

    test('должен показывать кнопку "Войти в систему"', async ({ page }) => {
      await page.goto('/');
      
      const loginLink = page.locator('a').filter({ hasText: 'Войти в систему' });
      await expect(loginLink).toBeVisible();
    });

    test('не должен перенаправлять неавторизованного пользователя', async ({ page }) => {
      await page.goto('/');
      
      // Проверяем что URL остался '/'
      await expect(page).toHaveURL('/', { timeout: 5000 });
    });

    test('должен работать переход на login с landing page', async ({ page }) => {
      await page.goto('/');
      
      // Кликаем на кнопку входа
      const loginLink = page.locator('a').filter({ hasText: 'Войти в систему' });
      await loginLink.click();
      
      // Проверяем что перенаправило на login
      await expect(page).toHaveURL('/login');
    });
  });

  test.describe('AC-10.2.1: Обработка состояния загрузки', () => {
    test('должен показывать индикатор загрузки при проверке сессии', async ({ page }) => {
      // Мокаем задержку проверки сессии
      await page.route('**/api/auth/session', async (route) => {
        await new Promise(resolve => setTimeout(resolve, 1000));
        await route.fallback();
      });

      await page.goto('/');
      
      // Проверяем что показывается индикатор загрузки
      const loadingIndicator = page.locator('div').filter({ hasText: 'Загрузка...' });
      await expect(loadingIndicator).toBeVisible();
    });

    test('должен отображать landing page после загрузки если не авторизован', async ({ page }) => {
      await page.goto('/');
      
      // Проверяем что landing page отображается после загрузки
      await expect(page.locator('h1')).toContainText('СНТ Берёзки-НТ');
    });
  });

  test.describe('Edge Cases', () => {
    test('должен корректно работать при быстром пересечении страниц', async ({ page }) => {
      // Неавторизованный пользователь
      await page.goto('/');
      
      // Быстро переходим и возвращаемся
      const loginLink = page.locator('a').filter({ hasText: 'Войти в систему' });
      await loginLink.click();
      await expect(page).toHaveURL('/login');
      
      await page.goto('/');
      await expect(page).toHaveURL('/');
    });

    test('должен работать при повторном входе на главную после авторизации', async ({ page, browser }) => {
      const context = await browser.newContext();
      const sessionPage = await context.newPage();
      
      // Авторизуемся
      await login(sessionPage, 'test@example.com', 'TestPassword123!');
      
      // Переходим на главную (должно перенаправить)
      await sessionPage.goto('/');
      await expect(sessionPage).toHaveURL(/\/dashboard/, { timeout: 5000 });
      
      // Возвращаемся на главную (должно снова перенаправить)
      await sessionPage.goto('/');
      await expect(sessionPage).toHaveURL(/\/dashboard/, { timeout: 5000 });
      
      await context.close();
    });
  });
});
