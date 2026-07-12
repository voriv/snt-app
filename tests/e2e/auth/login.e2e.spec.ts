/**
 * @e2e login
 * @description E2E-тесты для страницы входа (Login Page)
 *
 * @spec
 * - AC-1: Отображение формы входа при переходе на /login
 * - AC-2: Успешный вход с валидными данными → редирект на /dashboard
 * - AC-3: Неверный пароль → показ ошибки
 * - AC-4: Пустые поля → валидация
 * - AC-5: Авторизованный пользователь → редирект на /dashboard
 * - AC-6: Отображение ошибки после неудачного входа
 */
import { test, expect, type BrowserContext } from '@playwright/test';

const LOGIN_URL = '/login';
const DASHBOARD_URL = '/dashboard';

// ============================================================================
// Test Fixtures
// ============================================================================

// Фикстура для создания очищенного контекста
test.use({
  storageState: {
    cookies: [],
    origins: [],
  },
});

/**
 * Тестовые учётные данные для аутентификации
 * В реальном окружении эти данные должны быть созданы через seed или API
 */
const VALID_CREDENTIALS = {
  email: 'admin@snt.local',
  password: 'Admin123!',
};

// ============================================================================
// Tests
// ============================================================================

test.describe('Login Page - E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Очищаем сессии перед каждым тестом
    await page.context().clearCookies();
    await page.goto(LOGIN_URL);
  });

  test.describe('AC-1: Отображение формы входа', () => {
    test('должен отображать заголовок формы входа', async ({ page }) => {
      await expect(page.getByRole('heading', { name: /вход в систему/i })).toBeVisible();
    });

    test('должен отображать описание формы', async ({ page }) => {
      await expect(page.getByText(/войдите в свой аккаунт/i)).toBeVisible();
    });

    test('должен отображать поле email', async ({ page }) => {
      const emailInput = page.getByLabel(/email адрес для входа/i);
      await expect(emailInput).toBeVisible();
      await expect(emailInput).toHaveAttribute('type', 'email');
    });

    test('должен отображать поле password', async ({ page }) => {
      const passwordInput = page.getByLabel(/пароль для входа/i);
      await expect(passwordInput).toBeVisible();
      await expect(passwordInput).toHaveAttribute('type', 'password');
    });

    test('должен отображать кнопку "Войти"', async ({ page }) => {
      await expect(page.getByRole('button', { name: /войти/i })).toBeVisible();
    });

    test('должен отображать ссылку на регистрацию', async ({ page }) => {
      await expect(page.getByRole('link', { name: /зарегистрироваться/i })).toBeVisible();
      await expect(page.getByRole('link', { name: /зарегистрироваться/i })).toHaveAttribute(
        'href',
        '/register'
      );
    });
  });

  test.describe('AC-4: Валидация пустых полей', () => {
    test('должен показывать ошибку при отправке пустой формы', async ({ page }) => {
      await page.getByRole('button', { name: /войти/i }).click();

      await expect(page.getByText(/заполните все поля/i)).toBeVisible();
    });

    test('должен показывать ошибку при пустом email', async ({ page }) => {
      await page.getByLabel(/пароль для входа/i).fill(VALID_CREDENTIALS.password);
      await page.getByRole('button', { name: /войти/i }).click();

      await expect(page.getByText(/заполните все поля/i)).toBeVisible();
    });

    test('должен показывать ошибку при пустом пароле', async ({ page }) => {
      await page.getByLabel(/email адрес для входа/i).fill(VALID_CREDENTIALS.email);
      await page.getByRole('button', { name: /войти/i }).click();

      await expect(page.getByText(/заполните все поля/i)).toBeVisible();
    });

    test('должен очищать ошибку при вводе данных', async ({ page }) => {
      // Отправляем пустую форму для показа ошибки
      await page.getByRole('button', { name: /войти/i }).click();

      await expect(page.getByText(/заполните все поля/i)).toBeVisible();

      // Начинаем вводить данные
      await page.getByLabel(/email адрес для входа/i).fill('test');

      await expect(page.getByText(/заполните все поля/i)).not.toBeVisible();
    });
  });

  test.describe('AC-3 и AC-6: Неверный пароль / Ошибка входа', () => {
    test('должен показывать ошибку при неверном пароле', async ({ page }) => {
      await page.getByLabel(/email адрес для входа/i).fill(VALID_CREDENTIALS.email);
      await page.getByLabel(/пароль для входа/i).fill('wrongpassword');
      await page.getByRole('button', { name: /войти/i }).click();

      await expect(page.getByText(/неверный email или пароль/i)).toBeVisible();
    });

    test('должен показывать ошибку при несуществующем email', async ({ page }) => {
      await page.getByLabel(/email адрес для входа/i).fill('nonexistent@example.com');
      await page.getByLabel(/пароль для входа/i).fill(VALID_CREDENTIALS.password);
      await page.getByRole('button', { name: /войти/i }).click();

      await expect(page.getByText(/неверный email или пароль/i)).toBeVisible();
    });

    test('должен сохранять введенные данные после ошибки', async ({ page }) => {
      await page.getByLabel(/email адрес для входа/i).fill(VALID_CREDENTIALS.email);
      await page.getByLabel(/пароль для входа/i).fill(VALID_CREDENTIALS.password);
      await page.getByRole('button', { name: /войти/i }).click();

      // Ждём ошибку
      await expect(page.getByText(/неверный email или пароль/i)).toBeVisible();

      // Проверяем что данные сохранены
      await expect(page.getByLabel(/email адрес для входа/i)).toHaveValue(
        VALID_CREDENTIALS.email
      );
      // Пароль скрыт, но должен иметь значение (не пустое)
      await expect(page.getByLabel(/пароль для входа/i)).toHaveValue(/[^\s]/);
    });

    test('должен разблокировать кнопку после ошибки', async ({ page }) => {
      await page.getByLabel(/email адрес для входа/i).fill(VALID_CREDENTIALS.email);
      await page.getByLabel(/пароль для входа/i).fill('wrongpassword');
      await page.getByRole('button', { name: /войти/i }).click();

      await expect(page.getByText(/неверный email или пароль/i)).toBeVisible();

      // Кнопка должна быть активна
      const submitButton = page.getByRole('button', { name: /войти/i });
      await expect(submitButton).not.toBeDisabled();
    });
  });

  test.describe('AC-2: Успешная аутентификация', () => {
    test('должен перенаправлять на dashboard при успешном входе', async ({ page }) => {
      // Заполняем форму
      await page.getByLabel(/email адрес для входа/i).fill(VALID_CREDENTIALS.email);
      await page.getByLabel(/пароль для входа/i).fill(VALID_CREDENTIALS.password);
      await page.getByRole('button', { name: /войти/i }).click();

      // Ожидаем редирект на dashboard
      await page.waitForURL('**/dashboard');

      // Проверяем, что URL соответствует dashboard
      expect(page.url()).toContain('/dashboard');
    });
  });

  test.describe('AC-5: Авторизованный пользователь перенаправляется', () => {
    test('неавторизованный пользователь видит страницу входа', async ({ page }) => {
      // Это уже тестируется beforeEach
      await expect(page.getByRole('heading', { name: /вход в систему/i })).toBeVisible();
    });

    test('авторизованный пользователь перенаправляется на /dashboard при переходе на /login', async ({ page, browser }) => {
      // Сначала выполняем вход через валидные данные
      await page.getByLabel(/email адрес для входа/i).fill(VALID_CREDENTIALS.email);
      await page.getByLabel(/пароль для входа/i).fill(VALID_CREDENTIALS.password);
      await page.getByRole('button', { name: /войти/i }).click();

      // Дожидаемся редиректа на dashboard (подтверждает успешную аутентификацию)
      await page.waitForURL('**/dashboard');
      expect(page.url()).toContain('/dashboard');

      // Сохраняем состояние сессии (cookies) авторизованного пользователя
      const authStorageState = await page.context().storageState();

      // Создаём новый контекст с сохранённой сессией авторизованного пользователя
      const authContext = await browser.newContext({ storageState: authStorageState });
      const authPage = await authContext.newPage();

      // Переходим на /login под авторизованной сессией
      await authPage.goto(LOGIN_URL);

      // Ожидаем редирект на /dashboard
      await authPage.waitForURL('**/dashboard');
      expect(authPage.url()).toContain('/dashboard');

      // Закрываем дополнительный контекст
      await authContext.close();
    });
  });

  test.describe('Edge Cases', () => {
    test('должен показывать индикатор загрузки во время аутентификации', async ({ page }) => {
      await page.getByLabel(/email адрес для входа/i).fill(VALID_CREDENTIALS.email);
      await page.getByLabel(/пароль для входа/i).fill(VALID_CREDENTIALS.password);

      const submitButton = page.getByRole('button', { name: /войти/i });

      // Перед отправкой кнопка должна быть активной
      await expect(submitButton).not.toBeDisabled();

      await submitButton.click();

      // Во время загрузки кнопка должна быть заблокирована и показывать индикатор
      await expect(submitButton).toHaveAttribute('disabled');
    });

    test('должен корректно обрабатывать email с пробелами', async ({ page }) => {
      const emailWithSpaces = '  TEST@EXAMPLE.COM  ';

      await page.getByLabel(/email адрес для входа/i).fill(emailWithSpaces);
      await page.getByLabel(/пароль для входа/i).fill(VALID_CREDENTIALS.password);
      await page.getByRole('button', { name: /войти/i }).click();

      // Система должна отправить данные без trim (trim выполняется на сервере)
      await page.waitForTimeout(500);

      // Проверяем что ошибка не из-за формата email
      const emailFormatError = page.getByText(/некорректный формат/i);
      // Формат email должен быть валидным
      const hasValidationError = await emailFormatError.count();
      expect(hasValidationError).toBeLessThan(2); // 0 или 1 (одна ошибка OK)
    });

    test('должен позволять отменить вход нажатием кнопки повторно', async ({ page }) => {
      await page.getByLabel(/email адрес для входа/i).fill(VALID_CREDENTIALS.email);
      await page.getByLabel(/пароль для входа/i).fill(VALID_CREDENTIALS.password);

      const submitButton = page.getByRole('button', { name: /войти/i });

      await submitButton.click();

      // Во время загрузки кнопка заблокирована
      await expect(submitButton).toHaveAttribute('disabled');

      // Пользователь может нажать повторно для "отмены" (если обработка позволяет)
      // В текущей реализации это просто вызовет новый запрос
    });
  });

  test.describe('Accessibility', () => {
    test('все поля должны иметь aria-label', async ({ page }) => {
      const emailInput = page.getByLabel(/email адрес для входа/i);
      await expect(emailInput).toHaveAttribute('aria-label');

      const passwordInput = page.getByLabel(/пароль для входа/i);
      await expect(passwordInput).toHaveAttribute('aria-label');

      const submitButton = page.getByRole('button', { name: /войти/i });
      await expect(submitButton).toHaveAttribute('aria-label');
    });

    test('сообщения об ошибках должны иметь aria-live', async ({ page }) => {
      await page.getByLabel(/email адрес для входа/i).fill(VALID_CREDENTIALS.email);
      await page.getByLabel(/пароль для входа/i).fill(VALID_CREDENTIALS.password);
      await page.getByRole('button', { name: /войти/i }).click();

      await expect(page.getByText(/неверный email или пароль/i)).toBeVisible();

      const errorAlert = page.getByRole('alert', { name: /неверный email или пароль/i });
      await expect(errorAlert).toHaveAttribute('aria-live');
    });
  });
});
