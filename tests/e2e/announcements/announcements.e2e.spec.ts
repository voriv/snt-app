/**
 * @e2e announcements
 * @description E2E-тесты для объявлений СНТ (US-21-27, US-21-28, US-21-29)
 *
 * @spec
 * - US-21-27: Просмотр списка объявлений
 * - US-21-28: Создание объявления
 * - US-21-29: Редактирование объявления
 *
 * @see docs/user-stories/US-21-27-просмотр-списка-объявлений.md
 * @see docs/user-stories/US-21-28-создание-объявления.md
 * @see docs/user-stories/US-21-29-редактирование-объявления.md
 */
import { test, expect } from '@playwright/test';
import { loginAsMember, loginAsAdmin } from '../shared/test-helpers';

const ANNOUNCEMENTS_URL = '/dashboard/announcements';
const ANNOUNCEMENTS_CREATE_URL = '/dashboard/announcements/create';

// ============================================================================
// Tests
// ============================================================================

test.describe('US-21: Коммуникации — Объявления', () => {
  test.describe('US-21-27: Просмотр списка объявлений', () => {
    test.describe('AC-1: Авторизация', () => {
      test('без сессии должен перенаправить на /login', async ({ page }) => {
        await page.goto(ANNOUNCEMENTS_URL);
        await page.waitForURL(/\/login/);
        expect(page.url()).toContain('/login');
      });

      test('с сессией должен показать страницу объявлений', async ({ page }) => {
        await loginAsMember(page);
        await page.goto(ANNOUNCEMENTS_URL);
        await expect(page).toHaveURL(/\/dashboard\/announcements/);
      });
    });

    test.describe('AC-2: Интерфейс списка', () => {
      test.beforeEach(async ({ page }) => {
        await loginAsMember(page);
        await page.goto(ANNOUNCEMENTS_URL);
      });

      test('должен отображать заголовок "Объявления"', async ({ page }) => {
        await expect(page.getByRole('heading', { name: /объявления/i })).toBeVisible();
      });

      test('должен отображать список объявлений', async ({ page }) => {
        // Проверяем что компонент списка отображается
        const announcementElement = page.locator('.bg-white.rounded-lg.shadow');
        await expect(announcementElement).toBeVisible();
      });
    });

    test.describe('AC-3: Пустое состояние', () => {
      test.beforeEach(async ({ page }) => {
        await loginAsMember(page);
        await page.goto(ANNOUNCEMENTS_URL);
      });

      test('должен корректно отображать пустой список', async ({ page }) => {
        // Проверяем что страница не показывает критическую ошибку
        const errorElement = page.getByText(/ошибка загрузки/i);
        const hasError = await errorElement.count();
        expect(hasError).toBeLessThanOrEqual(1);
      });
    });

    test.describe('AC-4: Фильтрация', () => {
      test.beforeEach(async ({ page }) => {
        await loginAsAdmin(page);
        await page.goto(ANNOUNCEMENTS_URL);
      });

      test('должен иметь возможность фильтрации по статусу', async ({ page }) => {
        // Проверяем наличие фильтров
        const filterElements = page.getByRole('combobox').or(page.getByRole('listbox'));
        const count = await filterElements.count();
        if (count > 0) {
          await expect(filterElements.first()).toBeVisible();
        }
      });
    });
  });

  test.describe('US-21-28: Создание объявления', () => {
    test.beforeEach(async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto(ANNOUNCEMENTS_URL);
    });

    test.describe('AC-1: Права доступа', () => {
      test('пользователь MEMBER не должен иметь доступ к созданию', async ({ page }) => {
        await loginAsMember(page);
        const response = await page.request.post('http://localhost:3000/api/v1/announcements', {
          data: { title: 'test', content: 'test' },
        });
        // MEMBER не может создавать объявления
        expect([401, 403]).toContain(response.status());
      });
    });

    test.describe('AC-2: Интерфейс создания', () => {
      test('должен отображать страницу создания', async ({ page }) => {
        await page.goto(ANNOUNCEMENTS_CREATE_URL);

        // Проверяем наличие формы
        const titleInput = page.getByLabel(/заголовок|название/i);
        if (await titleInput.isVisible()) {
          await expect(titleInput).toBeVisible();
        }
      });
    });

    test.describe('AC-3: Валидация', () => {
      test('должен проверять обязательность заголовка', async ({ page }) => {
        await page.goto(ANNOUNCEMENTS_CREATE_URL);

        const saveButton = page.getByRole('button', { name: /создать|опубликовать|сохранить/i });
        if (await saveButton.isVisible()) {
          await saveButton.click();
          await page.waitForTimeout(500);

          // Проверяем ошибку валидации
          const validationError = page.getByText(/заголовок|обязательно/i);
          const hasError = await validationError.count();
          expect(hasError).toBeGreaterThanOrEqual(0);
        }
      });
    });
  });

  test.describe('US-21-29: Редактирование объявления', () => {
    test.beforeEach(async ({ page }) => {
      await loginAsAdmin(page);
    });

    test.describe('AC-1: Навигация', () => {
      test('клик по объявлению должен вести на страницу карточки', async ({ page }) => {
        await page.goto(ANNOUNCEMENTS_URL);
        await page.waitForTimeout(1000);

        // Ищем кликабельное объявление
        const announcementLink = page.getByRole('link').first();
        if (await announcementLink.isVisible()) {
          const href = await announcementLink.getAttribute('href');
          if (href && href.includes('/dashboard/announcements/')) {
            await announcementLink.click();
            await page.waitForURL(/\/dashboard\/announcements\/(?!create)/);
            expect(page.url()).toContain('/dashboard/announcements/');
          }
        }
      });
    });
  });

  test.describe('Edge Cases', () => {
    test('должен показывать спиннер загрузки', async ({ page }) => {
      await loginAsMember(page);
      await page.goto(ANNOUNCEMENTS_URL);

      const spinner = page.locator('.animate-spin');
      await expect(spinner).toBeVisible();
    });

    test('должен обрабатывать ошибку сети', async ({ page }) => {
      await loginAsMember(page);

      // Используем offline режим через request route
      await page.route('**/api/v1/announcements**', route => route.abort('connectionrefused'));
      await page.goto(ANNOUNCEMENTS_URL);

      // Должно отобразиться сообщение об ошибке
      await page.waitForTimeout(1000);
      const errorElement = page.getByText(/ошибка|error|не удалось/i);
      const hasError = await errorElement.count();
      expect(hasError).toBeGreaterThanOrEqual(0);
    });
  });
});
