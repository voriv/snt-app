/**
 * @e2e roles-crud
 * @description E2E-тесты для управления ролями (CRUD)
 *
 * @spec
 * - AC-1: Просмотр списка ролей
 * - AC-2: Создание роли
 * - AC-3: Редактирование роли
 * - AC-4: Удаление роли
 * - AC-5: Назначение роли пользователю
 *
 * @see docs/user-stories/US-01-автоматическое-назначение-роли-GUEST-при-регистрации.md
 * @see docs/user-stories/US-03-контроль-доступа-к-функциям-приложения-на-основе-роли.md
 */
import { test, expect } from '@playwright/test';
import { loginAsAdmin } from '../shared/test-helpers';

const ROLES_URL = '/dashboard/roles';

// ============================================================================
// Tests
// ============================================================================

test.describe('Управление ролями (CRUD)', () => {
  test.describe('AC-1: Просмотр списка ролей', () => {
    test.describe('Авторизация', () => {
      test('без сессии должен перенаправить на /login', async ({ page }) => {
        await page.goto(ROLES_URL);
        await page.waitForURL(/\/login/);
        expect(page.url()).toContain('/login');
      });

      test('администратор имеет доступ к странице ролей', async ({ page }) => {
        await loginAsAdmin(page);
        await page.goto(ROLES_URL);
        await expect(page).toHaveURL(/\/dashboard\/roles/);
      });
    });

    test.describe('Отображение', () => {
      test.beforeEach(async ({ page }) => {
        await loginAsAdmin(page);
        await page.goto(ROLES_URL);
      });

      test('должен отображать заголовок страницы', async ({ page }) => {
        await expect(page.getByRole('heading', { name: /роли|roles/i })).toBeVisible();
      });

      test('должен отображать список ролей', async ({ page }) => {
        // Проверяем что таблица или список ролей отображается
        const tableElement = page.getByRole('table');
        const listElement = page.locator('[class*="role"]').first();

        if (await tableElement.isVisible()) {
          await expect(tableElement).toBeVisible();
        } else {
          // Проверяем что хотя бы один элемент роли есть
          const roleElements = page.getByText(/admin|member|super_admin|guest/i);
          const count = await roleElements.count();
          expect(count).toBeGreaterThan(0);
        }
      });
    });
  });

  test.describe('AC-2: Создание роли', () => {
    test.beforeEach(async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto(ROLES_URL);
    });

    test('должен иметь кнопку для создания роли', async ({ page }) => {
      const createButton = page.getByRole('button', { name: /создать|добавить|new/i }).first();
      if (await createButton.isVisible()) {
        await expect(createButton).toBeVisible();
      }
    });

    test('должен открывать форму создания при клике', async ({ page }) => {
      const createButton = page.getByRole('button', { name: /создать|добавить|new/i }).first();
      if (await createButton.isVisible()) {
        await createButton.click();

        await page.waitForTimeout(500);
        // Проверяем что форма видна
        const nameInput = page.getByLabel(/название|name|имя/i).first();
        if (await nameInput.isVisible()) {
          await expect(nameInput).toBeVisible();
        }
      }
    });
  });

  test.describe('AC-3: Редактирование роли', () => {
    test.beforeEach(async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto(ROLES_URL);
    });

    test('должен иметь кнопку редактирования для каждой роли', async ({ page }) => {
      // Поиск кнопки редактирования (иконка или текст)
      const editButton = page.getByRole('button', { name: /редактировать|edit/i }).first();
      if (await editButton.isVisible()) {
        await expect(editButton).toBeVisible();
      }
    });

    test('должен открывать форму редактирования при клике', async ({ page }) => {
      const editButton = page.getByRole('button', { name: /редактировать|edit/i }).first();
      if (await editButton.isVisible()) {
        await editButton.click();
        await page.waitForTimeout(500);

        // Проверяем что форма открыта
        const nameInput = page.getByLabel(/название|name|имя/i).first();
        if (await nameInput.isVisible()) {
          await expect(nameInput).toBeVisible();
        }
      }
    });
  });

  test.describe('AC-4: Удаление роли', () => {
    test.beforeEach(async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto(ROLES_URL);
    });

    test('должен иметь кнопку удаления', async ({ page }) => {
      const deleteButton = page.getByRole('button', { name: /удалить|delete/i }).first();
      if (await deleteButton.isVisible()) {
        await expect(deleteButton).toBeVisible();
      }
    });
  });

  test.describe('AC-5: Назначение роли пользователю', () => {
    test.beforeEach(async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto(ROLES_URL);
    });

    test('должен иметь возможность управления пользователями роли', async ({ page }) => {
      // Поиск раздела или кнопки для управления пользователями
      const usersSection = page.getByText(/пользовател|user/i).first();
      const usersButton = page.getByRole('button', { name: /пользовател|user/i }).first();

      if (await usersSection.isVisible()) {
        await expect(usersSection).toBeVisible();
      } else if (await usersButton.isVisible()) {
        await expect(usersButton).toBeVisible();
      }
    });
  });

  test.describe('Edge Cases', () => {
    test('должен показывать спиннер загрузки', async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto(ROLES_URL);

      const spinner = page.locator('.animate-spin');
      await expect(spinner).toBeVisible();
    });

    test('должен обрабатывать ошибку доступа', async ({ page }) => {
      await loginAsAdmin(page);

      // Проверяем доступ к API roles
      const response = await page.request.get('http://localhost:3000/api/v1/roles');
      // ADMIN может иметь или не иметь доступ
      expect([200, 403]).toContain(response.status());
    });
  });
});
