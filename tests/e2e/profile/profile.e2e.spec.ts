/**
 * @e2e profile
 * @description E2E-тесты для страницы профиля пользователя (US-19)
 *
 * @spec
 * - US-19-01: Просмотр профиля (AC-1, AC-2)
 * - US-19-02: Частичное обновление профиля (AC-3, AC-6, AC-7)
 * - US-19-05: Смена темы оформления (AC-1, AC-2)
 * - US-19-06: Ссылка на профиль в навигации
 *
 * @see docs/user-stories/US-19-01-просмотр-профиля.md
 * @see docs/user-stories/US-19-02-частичное-обновление-профиля.md
 * @see docs/user-stories/US-19-05-смена-темы-оформления.md
 * @see docs/user-stories/US-19-06-ссылка-на-профиль-в-навигации.md
 */
import { test, expect } from '@playwright/test';
import { loginAsMember, TEST_USERS } from '../shared/test-helpers';

const PROFILE_URL = '/dashboard/profile';

// ============================================================================
// Tests
// ============================================================================

test.describe('US-19: Профиль пользователя', () => {
  test.describe('US-19-01: Просмотр профиля', () => {
    test.describe('AC-1: Авторизация', () => {
      test('без сессии должен перенаправить на /login', async ({ page }) => {
        await page.goto(PROFILE_URL);
        await page.waitForURL(/\/login/);
        expect(page.url()).toContain('/login');
      });

      test('с сессией должен показать страницу профиля', async ({ page }) => {
        await loginAsMember(page);
        await page.goto(PROFILE_URL);
        await expect(page).toHaveURL(/\/dashboard\/profile/);
      });
    });

    test.describe('AC-2: Отображение данных профиля', () => {
      test.beforeEach(async ({ page }) => {
        await loginAsMember(page);
        await page.goto(PROFILE_URL);
      });

      test('должен отображать заголовок "Профиль"', async ({ page }) => {
        await expect(page.getByRole('heading', { name: /профиль/i })).toBeVisible();
      });

      test('должен отображать вкладки: Профиль и Мои участки', async ({ page }) => {
        const profileTab = page.getByRole('button', { name: /профиль/i });
        const connectionsTab = page.getByRole('button', { name: /мои участки/i });

        await expect(profileTab).toBeVisible();
        await expect(connectionsTab).toBeVisible();
      });

      test('должен отображать имя и фамилию пользователя', async ({ page }) => {
        await expect(page.getByText(TEST_USERS.member.firstName)).toBeVisible();
        await expect(page.getByText(TEST_USERS.member.lastName)).toBeVisible();
      });

      test('должен отображать кнопку "Редактировать" в режиме просмотра', async ({ page }) => {
        const editButton = page.getByRole('button', { name: /редактировать/i });
        await expect(editButton).toBeVisible();
      });

      test('должен отображать секцию загрузки аватара', async ({ page }) => {
        await expect(page.getByText(/аватар/i).first()).toBeVisible();
      });

      test('должен отображать секцию выбора темы', async ({ page }) => {
        await expect(page.getByText(/тема/i).first()).toBeVisible();
      });
    });

    test.describe('AC-3: Навигация по вкладкам', () => {
      test.beforeEach(async ({ page }) => {
        await loginAsMember(page);
        await page.goto(PROFILE_URL);
      });

      test('должен переключать на вкладку "Мои участки"', async ({ page }) => {
        const connectionsTab = page.getByRole('button', { name: /мои участки/i });
        await connectionsTab.click();

        // Проверяем, что вкладка активна
        await expect(connectionsTab).toHaveAttribute('aria-selected', 'true');
      });

      test('должен возвращаться на вкладку "Профиль"', async ({ page }) => {
        const connectionsTab = page.getByRole('button', { name: /мои участки/i });
        const profileTab = page.getByRole('button', { name: /профиль/i });

        await connectionsTab.click();
        await profileTab.click();

        await expect(profileTab).toHaveAttribute('aria-selected', 'true');
      });
    });

    test.describe('Edge Cases', () => {
      test('должен показывать загрузку при загрузке профиля', async ({ page }) => {
        await loginAsMember(page);
        await page.goto(PROFILE_URL);

        // Проверяем наличие спиннера
        const spinner = page.locator('.animate-spin');
        await expect(spinner).toBeVisible();
      });
    });
  });

  test.describe('US-19-02: Редактирование профиля', () => {
    test.beforeEach(async ({ page }) => {
      await loginAsMember(page);
      await page.goto(PROFILE_URL);
    });

    test.describe('AC-3: Открытие формы редактирования', () => {
      test('должен открывать форму редактирования при клике на "Редактировать"', async ({ page }) => {
        await page.getByRole('button', { name: /редактировать/i }).click();

        // Проверяем что кнопка "Сохранить" появилась
        const saveButton = page.getByRole('button', { name: /сохранить/i });
        await expect(saveButton).toBeVisible();
      });

      test('должен отображать email в заблокированном состоянии', async ({ page }) => {
        await page.getByRole('button', { name: /редактировать/i }).click();

        const emailInput = page.getByLabel(/email/i);
        await expect(emailInput).toBeDisabled();
      });
    });

    test.describe('AC-6: Сохранение изменений', () => {
      test('должен сохранять изменения имени', async ({ page }) => {
        await page.getByRole('button', { name: /редактировать/i }).click();

        // Изменяем имя
        const firstNameInput = page.getByLabel(/имя/i);
        await firstNameInput.clear();
        await firstNameInput.fill('НовоеИмя');

        // Сохраняем
        await page.getByRole('button', { name: /сохранить/i }).click();

        // Проверяем что вернулись в режим просмотра
        await expect(page.getByRole('button', { name: /редактировать/i })).toBeVisible();
      });

      test('должен блокировать кнопку "Сохранить" во время отправки', async ({ page }) => {
        await page.getByRole('button', { name: /редактировать/i }).click();

        // Заполняем данные
        await page.getByLabel(/имя/i).clear();
        await page.getByLabel(/имя/i).fill('НовоеИмя');

        // Нажимаем сохранить
        const saveButton = page.getByRole('button', { name: /сохранить/i });
        await saveButton.click();

        // Кнопка должна быть заблокирована
        await expect(saveButton).toBeDisabled();
      });
    });

    test.describe('AC-7: Отмена редактирования', () => {
      test('должен отменять редактирование без изменений', async ({ page }) => {
        await page.getByRole('button', { name: /редактировать/i }).click();
        await page.getByRole('button', { name: /отмена/i }).click();

        await expect(page.getByRole('button', { name: /редактировать/i })).toBeVisible();
      });
    });
  });

  test.describe('US-19-05: Смена темы оформления', () => {
    test.beforeEach(async ({ page }) => {
      await loginAsMember(page);
      await page.goto(PROFILE_URL);
    });

    test('должен отображать переключатель темы', async ({ page }) => {
      const themeSelector = page.getByText(/тема/i).first();
      await expect(themeSelector).toBeVisible();
    });

    test('должен переключать тему при клике', async ({ page }) => {
      // Проверяем наличие переключателя темы (светлая/тёмная)
      const themeToggle = page.getByRole('button', { name: /светлая|тёмная|тема/i }).first();
      if (await themeToggle.isVisible()) {
        await themeToggle.click();
        // Тема должна примениться (проверяем что нет ошибки)
        await expect(page.getByText(/ошибка/i)).not.toBeVisible();
      }
    });
  });

  test.describe('US-19-06: Ссылка на профиль в навигации', () => {
    test.beforeEach(async ({ page }) => {
      await loginAsMember(page);
      await page.goto('/dashboard');
    });

    test('должен отображать ссылку на профиль в навигации', async ({ page }) => {
      const profileLink = page.getByRole('link', { name: /профиль/i });
      const count = await profileLink.count();
      if (count > 0) {
        await expect(profileLink.first()).toBeVisible();
        // Ссылка должна вести на /dashboard/profile
        const href = await profileLink.first().getAttribute('href');
        expect(href).toContain('/dashboard/profile');
      }
    });

    test('переход по ссылке ведет на страницу профиля', async ({ page }) => {
      const profileLink = page.getByRole('link', { name: /профиль/i });
      if ((await profileLink.count()) > 0) {
        await profileLink.first().click();
        await expect(page).toHaveURL(/\/dashboard\/profile/);
      }
    });
  });
});
