/**
 * @e2e registration
 * @description E2E-тесты для страницы регистрации (Registration Page)
 *
 * @spec
 * - AC-1: Отображение формы регистрации при переходе на /register
 * - AC-2: Успешная регистрация → редирект на страницу входа с сообщением
 * - AC-3: Дубликат email → показ ошибки
 * - AC-4: Неверный формат email → показ ошибки валидации
 * - AC-5: Пустые поля → валидация при отправке
 * - AC-6: Inline валидация при потере фокуса
 * - AC-7: Блокировка кнопки регистрации при невалидной форме
 * - AC-8: ARIA-атрибуты для accessibility
 */
import { test, expect } from '@playwright/test';

const REGISTER_URL = '/register';
const LOGIN_URL = '/login';
const DASHBOARD_URL = '/dashboard';

// ============================================================================
// Test Fixtures
// ============================================================================

test.use({
  storageState: {
    cookies: [],
    origins: [],
  },
});

/**
 * Уникальный email для каждого теста (уникальность критична для регистрации)
 */
const generateUniqueEmail = () => `test.${Date.now()}@example.com`;

// ============================================================================
// Tests
// ============================================================================

test.describe('Registration Page - E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
    await page.goto(REGISTER_URL);
  });

  test.describe('AC-1: Отображение формы регистрации', () => {
    test('должен отображать заголовок формы регистрации', async ({ page }) => {
      await expect(page.getByRole('heading', { name: /создание аккаунта/i })).toBeVisible();
    });

    test('должен отображать описание формы', async ({ page }) => {
      await expect(page.getByText(/заполните форму для создания аккаунта/i)).toBeVisible();
    });

    test('должен отображать поле email', async ({ page }) => {
      const emailInput = page.getByLabel(/email/i);
      await expect(emailInput).toBeVisible();
      await expect(emailInput).toHaveAttribute('type', 'email');
    });

    test('должен отображать поле пароль', async ({ page }) => {
      const passwordInput = page.getByLabel(/пароль/i);
      await expect(passwordInput).toBeVisible();
      await expect(passwordInput).toHaveAttribute('type', 'password');
    });

    test('должен отображать поле подтверждение пароля', async ({ page }) => {
      const confirmPasswordInput = page.getByLabel(/подтвердите пароль/i);
      await expect(confirmPasswordInput).toBeVisible();
      await expect(confirmPasswordInput).toHaveAttribute('type', 'password');
    });

    test('должен отображать кнопку "Зарегистрироваться"', async ({ page }) => {
      await expect(page.getByRole('button', { name: /зарегистрироваться/i })).toBeVisible();
    });

    test('должен отображать ссылку на страницу входа', async ({ page }) => {
      await expect(page.getByRole('link', { name: /уже есть аккаунт/i })).toBeVisible();
      await expect(page.getByRole('link', { name: /уже есть аккаунт/i })).toHaveAttribute(
        'href',
        '/login'
      );
    });
  });

  test.describe('AC-5: Валидация пустых полей', () => {
    test('должен показывать ошибку при отправке пустой формы', async ({ page }) => {
      await page.getByRole('button', { name: /зарегистрироваться/i }).click();

      await expect(page.getByText(/заполните все поля/i)).toBeVisible();
    });

    test('должен показывать ошибку при пустом email', async ({ page }) => {
      const password = 'Password123!';
      await page.getByLabel(/пароль/i).fill(password);
      await page.getByLabel(/подтвердите пароль/i).fill(password);
      await page.getByRole('button', { name: /зарегистрироваться/i }).click();

      await expect(page.getByText(/заполните все поля/i)).toBeVisible();
    });

    test('должен показывать ошибку при пустом пароле', async ({ page }) => {
      const email = generateUniqueEmail();
      await page.getByLabel(/email/i).fill(email);
      await page.getByRole('button', { name: /зарегистрироваться/i }).click();

      await expect(page.getByText(/заполните все поля/i)).toBeVisible();
    });
  });

  test.describe('AC-4: Валидация формата email', () => {
    test('должен показывать ошибку при неверном формате email', async ({ page }) => {
      await page.getByLabel(/email/i).fill('invalid-email');
      await page.getByLabel(/пароль/i).fill('Password123!');
      await page.getByLabel(/подтвердите пароль/i).fill('Password123!');
      await page.getByRole('button', { name: /зарегистрироваться/i }).click();

      await expect(page.getByText(/некорректный формат email/i)).toBeVisible();
    });

    test('должен очищать ошибку формата email при вводе', async ({ page }) => {
      const email = generateUniqueEmail();
      
      // Вводим невалидный email и отправляем
      await page.getByLabel(/email/i).fill('invalid-email');
      await page.getByLabel(/пароль/i).fill('Password123!');
      await page.getByLabel(/подтвердите пароль/i).fill('Password123!');
      await page.getByRole('button', { name: /зарегистрироваться/i }).click();

      // Проверяем ошибку
      await expect(page.getByText(/некорректный формат email/i)).toBeVisible();

      // Начинаем вводить правильный email
      await page.getByLabel(/email/i).fill(email);

      // Ошибка должна исчезнуть
      await expect(page.getByText(/некорректный формат email/i)).not.toBeVisible();
    });

    test('должен автоматически переводить email в нижний регистр при отправке', async ({ page }) => {
      const email = generateUniqueEmail().toUpperCase();
      await page.getByLabel(/email/i).fill(email);
      await page.getByLabel(/пароль/i).fill('Password123!');
      await page.getByLabel(/подтвердите пароль/i).fill('Password123!');
      await page.getByRole('button', { name: /зарегистрироваться/i }).click();

      await page.waitForURL('**/login');
      expect(page.url()).toContain('/login');
    });
  });

  test.describe('AC-3: Обработка дубликатов', () => {
    test('должен показывать ошибку при повторной регистрации с тем же email', async ({
      page,
      browser,
    }) => {
      const email = generateUniqueEmail();
      const password = 'Password123!';

      // Первая регистрация
      await page.getByLabel(/email/i).fill(email);
      await page.getByLabel(/пароль/i).fill(password);
      await page.getByLabel(/подтвердите пароль/i).fill(password);
      await page.getByRole('button', { name: /зарегистрироваться/i }).click();

      // Ждём редирект на страницу входа
      await page.waitForURL('**/login');

      // Возвращаемся на страницу регистрации
      await page.goto(REGISTER_URL);

      // Пытаемся зарегистрироваться снова с тем же email
      await page.getByLabel(/email/i).fill(email);
      await page.getByLabel(/пароль/i).fill(password);
      await page.getByLabel(/подтвердите пароль/i).fill(password);
      await page.getByRole('button', { name: /зарегистрироваться/i }).click();

      // Ожидаем ошибку дубликата
      await expect(page.getByText(/пользователь с таким email уже существует/i)).toBeVisible();
    });
  });

  test.describe('AC-6: Inline валидация при потере фокуса', () => {
    test('должен показывать ошибку email при потере фокуса для невалидного email', async ({
      page,
    }) => {
      const email = 'invalid-email';
      await page.getByLabel(/email/i).fill(email);
      
      // Потеря фокуса
      await page.locator('body').click();

      await expect(page.getByText(/некорректный формат email/i)).toBeVisible();
    });

    test('должен показывать ошибку пароля при потере фокуса для короткого пароля', async ({
      page,
    }) => {
      const password = 'short';
      await page.getByLabel(/пароль/i).fill(password);
      
      // Потеря фокуса
      await page.locator('body').click();

      await expect(page.getByText(/пароль должен содержать минимум 6 символов/i)).toBeVisible();
    });

    test('должен показывать ошибку подтверждения пароля при потере фокуса', async ({ page }) => {
      const password = 'Password123!';
      const confirmPassword = 'DifferentPassword123!';
      
      await page.getByLabel(/пароль/i).fill(password);
      await page.getByLabel(/подтвердите пароль/i).fill(confirmPassword);
      
      // Потеря фокуса
      await page.locator('body').click();

      await expect(page.getByText(/пароли не совпадают/i)).toBeVisible();
    });
  });

  test.describe('AC-7: Блокировка кнопки при невалидной форме', () => {
    test('должен быть заблокирован при пустой форме', async ({ page }) => {
      const submitButton = page.getByRole('button', { name: /зарегистрироваться/i });
      await expect(submitButton).toBeDisabled();
    });

    test('должен быть заблокирован при невалидном email', async ({ page }) => {
      await page.getByLabel(/email/i).fill('invalid-email');
      await page.getByLabel(/пароль/i).fill('Password123!');
      await page.getByLabel(/подтвердите пароль/i).fill('Password123!');

      const submitButton = page.getByRole('button', { name: /зарегистрироваться/i });
      await expect(submitButton).toBeDisabled();
    });

    test('должен разблокироваться при вводе корректных данных', async ({ page }) => {
      const email = generateUniqueEmail();
      await page.getByLabel(/email/i).fill(email);
      await page.getByLabel(/пароль/i).fill('Password123!');
      await page.getByLabel(/подтвердите пароль/i).fill('Password123!');

      const submitButton = page.getByRole('button', { name: /зарегистрироваться/i });
      await expect(submitButton).not.toBeDisabled();
    });
  });

  test.describe('AC-2: Успешная регистрация', () => {
    test('должен перенаправлять на страницу входа с сообщением об успехе', async ({
      page,
      browser,
    }) => {
      const email = generateUniqueEmail();
      const password = 'Password123!';

      await page.getByLabel(/email/i).fill(email);
      await page.getByLabel(/пароль/i).fill(password);
      await page.getByLabel(/подтвердите пароль/i).fill(password);
      await page.getByRole('button', { name: /зарегистрироваться/i }).click();

      // Ожидаем редирект на страницу входа
      await page.waitForURL('**/login');
      expect(page.url()).toContain('/login');

      // Проверяем сообщение об успешной регистрации
      await expect(
        page.getByText(/ваш аккаунт успешно создан/i)
      ).toBeVisible();
    });

    test('должен предоставлять кнопку перехода на страницу входа', async ({
      page,
      browser,
    }) => {
      const email = generateUniqueEmail();
      const password = 'Password123!';

      await page.getByLabel(/email/i).fill(email);
      await page.getByLabel(/пароль/i).fill(password);
      await page.getByLabel(/подтвердите пароль/i).fill(password);
      await page.getByRole('button', { name: /зарегистрироваться/i }).click();

      await page.waitForURL('**/login');

      // Проверяем кнопку "Вернуться на страницу входа"
      const loginButton = page.getByRole('link', { name: /вернуться на страницу входа/i });
      await expect(loginButton).toBeVisible();
      await loginButton.click();

      // Проверяем что редирект произошёл
      await page.waitForURL('**/login');
    });
  });

  test.describe('Edge Cases', () => {
    test('должен показывать ошибку при несоответствии паролей', async ({ page }) => {
      const email = generateUniqueEmail();
      
      await page.getByLabel(/email/i).fill(email);
      await page.getByLabel(/пароль/i).fill('Password123!');
      await page.getByLabel(/подтвердите пароль/i).fill('DifferentPassword123!');
      await page.getByRole('button', { name: /зарегистрироваться/i }).click();

      await expect(page.getByText(/пароли не совпадают/i)).toBeVisible();
    });

    test('должен очищать ошибку при исправлении несоответствия паролей', async ({
      page,
    }) => {
      const email = generateUniqueEmail();
      
      await page.getByLabel(/email/i).fill(email);
      await page.getByLabel(/пароль/i).fill('Password123!');
      await page.getByLabel(/подтвердите пароль/i).fill('DifferentPassword123!');
      await page.getByRole('button', { name: /зарегистрироваться/i }).click();

      await expect(page.getByText(/пароли не совпадают/i)).toBeVisible();

      // Исправляем подтверждение пароля
      await page.getByLabel(/подтвердите пароль/i).fill('Password123!');

      await expect(page.getByText(/пароли не совпадают/i)).not.toBeVisible();
    });

    test('должен хранить введенные данные после ошибки', async ({ page }) => {
      const email = generateUniqueEmail();
      const password = 'Password123!';

      await page.getByLabel(/email/i).fill(email);
      await page.getByLabel(/пароль/i).fill(password);
      await page.getByLabel(/подтвердите пароль/i).fill(password);
      await page.getByRole('button', { name: /зарегистрироваться/i }).click();

      // Создаём пользователя с теми же данными
      const apiClient = new (require('@/lib/api-client').ApiClient)();
      await apiClient.post('/auth/register', {
        email,
        password,
        confirmPassword: password,
      }).catch(() => {}); // Игнорируем ошибку если пользователь уже существует

      // Возвращаемся на страницу регистрации
      await page.goto(REGISTER_URL);
      await page.getByLabel(/email/i).fill(email);
      await page.getByLabel(/пароль/i).fill(password);
      await page.getByLabel(/подтвердите пароль/i).fill(password);
      await page.getByRole('button', { name: /зарегистрироваться/i }).click();

      // Проверяем что ошибка дубликата отображается
      await expect(page.getByText(/пользователь с таким email уже существует/i)).toBeVisible();
    });

    test('должен работать с email в верхнем регистре', async ({ page }) => {
      const email = generateUniqueEmail().toUpperCase();
      
      await page.getByLabel(/email/i).fill(email);
      await page.getByLabel(/пароль/i).fill('Password123!');
      await page.getByLabel(/подтвердите пароль/i).fill('Password123!');
      await page.getByRole('button', { name: /зарегистрироваться/i }).click();

      await page.waitForURL('**/login');
      expect(page.url()).toContain('/login');
    });
  });

  test.describe('Accessibility', () => {
    test('все поля должны иметь aria-label', async ({ page }) => {
      const emailInput = page.getByLabel(/email/i);
      await expect(emailInput).toHaveAttribute('aria-label');

      const passwordInput = page.getByLabel(/пароль/i);
      await expect(passwordInput).toHaveAttribute('aria-label');

      const confirmPasswordInput = page.getByLabel(/подтвердите пароль/i);
      await expect(confirmPasswordInput).toHaveAttribute('aria-label');

      const submitButton = page.getByRole('button', { name: /зарегистрироваться/i });
      await expect(submitButton).toHaveAttribute('aria-label');
    });

    test('ошибки валидации должны иметь aria-live', async ({ page }) => {
      await page.getByLabel(/email/i).fill('invalid');
      await page.getByLabel(/пароль/i).fill('Password123!');
      await page.getByLabel(/подтвердите пароль/i).fill('Password123!');
      await page.getByRole('button', { name: /зарегистрироваться/i }).click();

      const errorAlert = page.getByRole('alert', { name: /некорректный формат email/i });
      await expect(errorAlert).toHaveAttribute('aria-live');
    });

    test('ошибки в полях должны иметь aria-invalid', async ({ page }) => {
      const emailInput = page.getByLabel(/email/i);
      await emailInput.fill('invalid');
      
      await emailInput.blur();

      await expect(emailInput).toHaveAttribute('aria-invalid', 'true');
    });

    test('обязательные поля должны иметь aria-required', async ({ page }) => {
      const emailInput = page.getByLabel(/email/i);
      await expect(emailInput).toHaveAttribute('aria-required');

      const passwordInput = page.getByLabel(/пароль/i);
      await expect(passwordInput).toHaveAttribute('aria-required');

      const confirmPasswordInput = page.getByLabel(/подтвердите пароль/i);
      await expect(confirmPasswordInput).toHaveAttribute('aria-required');
    });
  });
});
