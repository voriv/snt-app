/**
 * @e2e change-password
 * @description E2E-тесты для смены пароля (US-12, B-015)
 *
 * @spec
 * - AC-9.7: Отображение формы смены пароля на /settings/security
 * - AC-9.8: Успешная отправка формы (через API мокинг)
 * - AC-9.9: Клиентская валидация (min 6 символов, пароли не совпадают)
 * - AC-9.10: Ошибка от сервера (неверный текущий пароль)
 * - AC-9.11: Защита маршрута — редирект неавторизованного пользователя
 * - AC-9.12: Состояние загрузки (loading)
 * - AC-9.13: Навигация к странице смены пароля
 *
 * @see docs/user-stories/US-12-активная-смена-пароля-пользователем.md
 * @see docs/api/change-password-api.md
 */
import { test, expect } from '@playwright/test';
import { loginAsMember, TEST_USERS } from '../shared/test-helpers';

const SECURITY_URL = '/settings/security';

// ============================================================================
// Tests
// ============================================================================

test.describe('US-12: Смена пароля (B-015)', () => {
  // ----------------------------------------------------------------
  // AC-9.11: Защита маршрута
  // ----------------------------------------------------------------
  test.describe('AC-9.11: Защита маршрута', () => {
    test('неавторизованный пользователь перенаправляется на /login', async ({ page }) => {
      await page.goto(SECURITY_URL);

      // Страница должна перенаправить на /login (с callbackUrl)
      await expect(page).toHaveURL(/\/login/);
      expect(page.url()).toContain('callbackUrl');
    });
  });

  // ----------------------------------------------------------------
  // AC-9.7: Отображение формы
  // ----------------------------------------------------------------
  test.describe('AC-9.7: Отображение формы смены пароля', () => {
    test.beforeEach(async ({ page }) => {
      await loginAsMember(page);
      await page.goto(SECURITY_URL);
    });

    test('должен отображать заголовок "Безопасность"', async ({ page }) => {
      await expect(page.getByRole('heading', { name: /безопасность/i })).toBeVisible();
    });

    test('должен отображать подзаголовок управления паролем', async ({ page }) => {
      await expect(page.getByText(/управление паролем и безопасностью/i)).toBeVisible();
    });

    test('должен отображать поле "Текущий пароль"', async ({ page }) => {
      const currentPasswordInput = page.getByLabel(/текущий пароль/i);
      await expect(currentPasswordInput).toBeVisible();
      await expect(currentPasswordInput).toHaveAttribute('type', 'password');
    });

    test('должен отображать поле "Новый пароль"', async ({ page }) => {
      const newPasswordInput = page.getByLabel(/новый пароль/i);
      await expect(newPasswordInput).toBeVisible();
      await expect(newPasswordInput).toHaveAttribute('type', 'password');
    });

    test('должен отображать поле "Подтверждение нового пароля"', async ({ page }) => {
      const confirmInput = page.getByLabel(/подтверждение/i);
      await expect(confirmInput).toBeVisible();
      await expect(confirmInput).toHaveAttribute('type', 'password');
    });

    test('должен отображать кнопку "Сменить пароль"', async ({ page }) => {
      const submitButton = page.getByRole('button', { name: /сменить пароль/i });
      await expect(submitButton).toBeVisible();
    });

    test('кнопка отправки заблокирована при пустых полях', async ({ page }) => {
      const submitButton = page.getByRole('button', { name: /сменить пароль/i });
      await expect(submitButton).toBeDisabled();
    });
  });

  // ----------------------------------------------------------------
  // AC-9.9: Клиентская валидация
  // ----------------------------------------------------------------
  test.describe('AC-9.9: Клиентская валидация на стороне клиента', () => {
    test.beforeEach(async ({ page }) => {
      await loginAsMember(page);
      await page.goto(SECURITY_URL);
    });

    test('должен показать ошибку при коротком новом пароле (<6 символов)', async ({
      page,
    }) => {
      const currentInput = page.getByLabel(/текущий пароль/i);
      const newInput = page.getByLabel(/новый пароль/i);
      const confirmInput = page.getByLabel(/подтверждение/i);

      await currentInput.fill('AnyPass123');
      await newInput.fill('12345'); // менее 6 символов
      await confirmInput.fill('12345');

      // Вводим и переключаем фокус, чтобы сработала валидация
      await newInput.press('Tab');

      // Клиентская ошибка min(6)
      await expect(page.getByText(/минимум 6/i)).toBeVisible({ timeout: 5000 });
    });

    test('должен показать ошибку при несовпадении паролей', async ({ page }) => {
      const currentInput = page.getByLabel(/текущий пароль/i);
      const newInput = page.getByLabel(/новый пароль/i);
      const confirmInput = page.getByLabel(/подтверждение/i);

      await currentInput.fill('AnyPass123');
      await newInput.fill('NewPass123');
      await confirmInput.fill('Different123');

      // Переключаем фокус для валидации
      await confirmInput.press('Tab');

      await expect(page.getByText(/не совпада/i)).toBeVisible({ timeout: 5000 });
    });

    test('кнопка активна при заполнении всех полей', async ({ page }) => {
      const currentInput = page.getByLabel(/текущий пароль/i);
      const newInput = page.getByLabel(/новый пароль/i);
      const confirmInput = page.getByLabel(/подтверждение/i);
      const submitButton = page.getByRole('button', { name: /сменить пароль/i });

      await currentInput.fill('current123');
      await newInput.fill('newpass123');
      await confirmInput.fill('newpass123');

      await expect(submitButton).toBeEnabled();
    });
  });

  // ----------------------------------------------------------------
  // AC-9.10: Ошибка от сервера (неверный текущий пароль)
  // ----------------------------------------------------------------
  test.describe('AC-9.10: Ошибка от сервера', () => {
    test('должен показать ошибку при неверном текущем пароле', async ({ page }) => {
      await loginAsMember(page);
      await page.goto(SECURITY_URL);

      // Мокаем ответ API с ошибкой
      await page.route('**/api/v1/auth/password', async (route) => {
        await route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            error: {
              code: 'INVALID_CURRENT_PASSWORD',
              message: 'Неверный текущий пароль',
            },
          }),
        });
      });

      const currentInput = page.getByLabel(/текущий пароль/i);
      const newInput = page.getByLabel(/новый пароль/i);
      const confirmInput = page.getByLabel(/подтверждение/i);
      const submitButton = page.getByRole('button', { name: /сменить пароль/i });

      await currentInput.fill('WrongPassword');
      await newInput.fill('NewSecure123');
      await confirmInput.fill('NewSecure123');

      await submitButton.click();

      // Проверяем сообщение об ошибке
      await expect(page.getByText(/неверный.*текущий.*пароль/i)).toBeVisible({
        timeout: 5000,
      });
    });
  });

  // ----------------------------------------------------------------
  // AC-9.12: Состояние загрузки
  // ----------------------------------------------------------------
  test.describe('AC-9.12: Состояние загрузки (loading)', () => {
    test('кнопка показывает индикатор загрузки во время отправки', async ({
      page,
    }) => {
      await loginAsMember(page);
      await page.goto(SECURITY_URL);

      // Мокаем медленный ответ API (имитируем задержку)
      await page.route('**/api/v1/auth/password', async (route) => {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true }),
        });
      });

      const currentInput = page.getByLabel(/текущий пароль/i);
      const newInput = page.getByLabel(/новый пароль/i);
      const confirmInput = page.getByLabel(/подтверждение/i);
      const submitButton = page.getByRole('button', { name: /сменить пароль/i });

      await currentInput.fill(TEST_USERS.member.password);
      await newInput.fill('NewSecure123');
      await confirmInput.fill('NewSecure123');

      await submitButton.click();

      // Во время загрузки кнопка должна быть disabled
      await expect(submitButton).toBeDisabled({ timeout: 5000 });
    });
  });

  // ----------------------------------------------------------------
  // AC-9.13: Навигация к странице смены пароля
  // ----------------------------------------------------------------
  test.describe('AC-9.13: Навигация к странице смены пароля', () => {
    test.beforeEach(async ({ page }) => {
      await loginAsMember(page);
    });

    test('ссылка "Безопасность" присутствует на странице профиля', async ({
      page,
    }) => {
      await page.goto('/dashboard/profile');

      // На странице профиля должна быть ссылка на /settings/security
      const securityLink = page.getByRole('link', {
        name: /безопасность|сменить пароль/i,
      });
      await expect(securityLink).toBeVisible();
      await expect(securityLink).toHaveAttribute('href', '/settings/security');
    });

    test('переход по ссылке ведёт на страницу безопасности', async ({ page }) => {
      await page.goto('/dashboard/profile');

      const securityLink = page.getByRole('link', {
        name: /безопасность|сменить пароль/i,
      });
      await securityLink.click();

      await expect(page).toHaveURL(/\/settings\/security/);
      await expect(page.getByRole('heading', { name: /безопасность/i })).toBeVisible();
    });
  });

  // ----------------------------------------------------------------
  // AC-9.8: Успешная смена пароля (через API мокинг)
  // ----------------------------------------------------------------
  test.describe('AC-9.8: Успешная отправка формы', () => {
    test('отображает сообщение об успехе и очищает форму', async ({ page }) => {
      await loginAsMember(page);
      await page.goto(SECURITY_URL);

      // Мокаем успешный ответ API
      await page.route('**/api/v1/auth/password', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true }),
        });
      });

      const currentInput = page.getByLabel(/текущий пароль/i);
      const newInput = page.getByLabel(/новый пароль/i);
      const confirmInput = page.getByLabel(/подтверждение/i);
      const submitButton = page.getByRole('button', { name: /сменить пароль/i });

      await currentInput.fill(TEST_USERS.member.password);
      await newInput.fill('NewSecure123');
      await confirmInput.fill('NewSecure123');

      await submitButton.click();

      // Проверяем сообщение об успехе
      await expect(page.getByText(/пароль успешно/i)).toBeVisible({ timeout: 5000 });
    });
  });

  // ----------------------------------------------------------------
  // Бонус: хлебные крошки
  // ----------------------------------------------------------------
  test.describe('Breadcrumb', () => {
    test('должен отображать хлебные крошки: Главная > Безопасность', async ({
      page,
    }) => {
      await loginAsMember(page);
      await page.goto(SECURITY_URL);

      const breadcrumb = page.getByRole('navigation', { name: 'Breadcrumb' });
      await expect(breadcrumb).toBeVisible();

      // Ссылка "Главная" ведёт на /dashboard
      const homeLink = breadcrumb.getByRole('link', { name: /главная/i });
      await expect(homeLink).toBeVisible();
      await expect(homeLink).toHaveAttribute('href', '/dashboard');

      // Активный элемент "Безопасность"
      await expect(breadcrumb.getByText(/безопасность/i)).toBeVisible();
    });
  });
});
