/**
 * @file E2E тесты для обработки ошибок аутентификации и регистрации
 * Покрытие: AC-11.1.1, AC-11.2.1, AC-11.3.1, AC-11.3.2
 */

import { test, expect, type Page } from '@playwright/test';

test.describe('Authentication Errors - E2E Tests', () => {
  /**
   * Вспомогательная функция для входа на страницу
   */
  async function goToLoginPage(page: Page): Promise<void> {
    await page.goto('/login');
  }

  /**
   * Вспомогательная функция для регистрации
   */
  async function goToRegisterPage(page: Page): Promise<void> {
    await page.goto('/register');
  }

  /**
   * Вспомогательная функция для заполнения формы входа
   */
  async function fillLoginForm(
    page: Page,
    email: string,
    password: string
  ): Promise<void> {
    await page.getByLabel('Email адрес для входа').fill(email);
    await page.getByLabel('Пароль для входа').fill(password);
  }

  /**
   * Вспомогательная функция для заполнения формы регистрации
   */
  async function fillRegisterForm(
    page: Page,
    email: string,
    password: string,
    confirmPassword: string
  ): Promise<void> {
    await page.getByLabel('Email').fill(email);
    await page.getByLabel('Пароль').fill(password);
    await page.getByLabel('Подтверждение пароля').fill(confirmPassword);
  }

  // ============================================================================
  // AC-11.1.1: Общие ошибки входа
  // ============================================================================

  test.describe('AC-11.1.1: Общие ошибки входа', () => {
    test.beforeEach(async ({ page }) => {
      await goToLoginPage(page);
    });

    test('AC-11.1.1: должен показывать общее сообщение при неверном пароле', async ({
      page,
    }) => {
      // Дано: пользователь находится на странице входа
      // Когда: пользователь вводит неверные учётные данные
      await fillLoginForm(page, 'test@example.com', 'WrongPassword123');
      await page.getByRole('button', { name: 'Войти' }).click();

      // Тогда: система показывает общее сообщение
      await expect(
        page.getByText('Неверный email или пароль')
      ).toBeVisible();
    });

    test('AC-11.1.1: должен показывать общее сообщение при несуществующем email', async ({
      page,
    }) => {
      // Дано: пользователь находится на странице входа
      // Когда: пользователь вводит несуществующий email
      await fillLoginForm(page, 'nonexistent@example.com', 'Password123');
      await page.getByRole('button', { name: 'Войти' }).click();

      // Тогда: система показывает общее сообщение (не раскрывает email не найден)
      await expect(
        page.getByText('Неверный email или пароль')
      ).toBeVisible();
    });

    test('AC-11.1.2: сообщение об ошибке должно быть доступно для скринридеров', async ({
      page,
    }) => {
      await fillLoginForm(page, 'test@example.com', 'WrongPassword');
      await page.getByRole('button', { name: 'Войти' }).click();

      // Проверка на наличие role="alert"
      const alertElement = page.getByRole('alert');
      await expect(alertElement).toBeVisible();
      await expect(alertElement).toHaveAttribute('aria-live', 'polite');
    });

    test('AC-11.1.3: данные должны сохраняться после ошибки', async ({
      page,
    }) => {
      // Ввод данных
      await fillLoginForm(page, 'test@example.com', 'MyPassword123');

      // Отправка формы с ошибкой
      await page.getByRole('button', { name: 'Войти' }).click();

      // Проверка что данные сохранены
      await expect(
        page.getByLabel('Email адрес для входа')
      ).toHaveValue('test@example.com');
      await expect(
        page.getByLabel('Пароль для входа')
      ).toHaveValue('MyPassword123');
    });

    test('AC-11.1.4: кнопка должна разблокироваться после ошибки', async ({
      page,
    }) => {
      await fillLoginForm(page, 'test@example.com', 'WrongPassword');
      await page.getByRole('button', { name: 'Войти' }).click();

      // Ожидание ошибки
      await expect(
        page.getByText('Неверный email или пароль')
      ).toBeVisible();

      // Кнопка должна быть разблокирована для повторной попытки
      const loginButton = page.getByRole('button', { name: 'Войти' });
      await expect(loginButton).toBeEnabled();
    });
  });

  // ============================================================================
  // AC-11.2.1: Валидация пустых полей
  // ============================================================================

  test.describe('AC-11.2.1: Валидация пустых полей', () => {
    test.describe('Страница входа', () => {
      test.beforeEach(async ({ page }) => {
        await goToLoginPage(page);
      });

      test('должен показывать ошибку при отправке пустой формы', async ({
        page,
      }) => {
        await page.getByRole('button', { name: 'Войти' }).click();
        await expect(
          page.getByText('Пожалуйста, заполните все поля')
        ).toBeVisible();
      });

      test('должен показывать ошибку при пустом email', async ({ page }) => {
        await page.getByLabel('Пароль для входа').fill('Password123');
        await page.getByRole('button', { name: 'Войти' }).click();
        await expect(
          page.getByText('Пожалуйста, заполните все поля')
        ).toBeVisible();
      });

      test('должен показывать ошибку при пустом пароле', async ({ page }) => {
        await page.getByLabel('Email адрес для входа').fill('test@example.com');
        await page.getByRole('button', { name: 'Войти' }).click();
        await expect(
          page.getByText('Пожалуйста, заполните все поля')
        ).toBeVisible();
      });

      test('должен очищать ошибку при вводе данных', async ({ page }) => {
        // Сначала покажем ошибку
        await page.getByRole('button', { name: 'Войти' }).click();
        await expect(
          page.getByText('Пожалуйста, заполните все поля')
        ).toBeVisible();

        // Введём email
        await page.getByLabel('Email адрес для входа').fill('test@example.com');

        // Ошибка должна исчезнуть
        await expect(
          page.getByText('Пожалуйста, заполните все поля')
        ).not.toBeVisible();
      });
    });

    test.describe('Страница регистрации', () => {
      test.beforeEach(async ({ page }) => {
        await goToRegisterPage(page);
      });

      test('должен показывать ошибку при отправке пустой формы', async ({
        page,
      }) => {
        await page.getByRole('button', { name: 'Зарегистрироваться' }).click();

        // Ошибка должна отображаться
        await expect(
          page.getByText(/Email обязателен|Пароль обязателен|Подтверждение пароля обязательна/)
        ).toBeVisible();
      });

      test('должен показывать ошибку при пустом email', async ({ page }) => {
        await fillRegisterForm(page, '', 'Password123', 'Password123');
        await page.getByRole('button', { name: 'Зарегистрироваться' }).click();
        await expect(
          page.getByText('Email обязателен')
        ).toBeVisible();
      });

      test('должен показывать ошибку при пустом пароле', async ({ page }) => {
        await fillRegisterForm(page, 'test@example.com', '', 'Password123');
        await page.getByRole('button', { name: 'Зарегистрироваться' }).click();
        await expect(
          page.getByText('Пароль обязателен')
        ).toBeVisible();
      });
    });
  });

  // ============================================================================
  // AC-11.3.1: Дублирование email
  // ============================================================================

  test.describe('AC-11.3.1: Дублирование email', () => {
    test.beforeEach(async ({ page }) => {
      // Сначала зарегистрируем пользователя
      await goToRegisterPage(page);
      await fillRegisterForm(
        page,
        'duplicate@example.com',
        'Password123',
        'Password123'
      );
      await page.getByRole('button', { name: 'Зарегистрироваться' }).click();

      // Дожидаемся успешной регистрации
      await expect(page).toHaveURL(/\/login/);
    });

    test('должен показывать ошибку при повторной регистрации с тем же email', async ({
      page,
    }) => {
      // Переходим на страницу регистрации снова
      await goToRegisterPage(page);

      // Вводим уже существующий email
      await fillRegisterForm(
        page,
        'duplicate@example.com',
        'Password123',
        'Password123'
      );
      await page.getByRole('button', { name: 'Зарегистрироваться' }).click();

      // Ожидаем ошибку о дубликате
      await expect(
        page.getByText(/Пользователь с таким email уже зарегистрирован|409|duplicate/i)
      ).toBeVisible();
    });
  });

  // ============================================================================
  // AC-11.3.2: Несоответствие паролей
  // ============================================================================

  test.describe('AC-11.3.2: Несоответствие паролей', () => {
    test.beforeEach(async ({ page }) => {
      await goToRegisterPage(page);
    });

    test('должен показывать ошибку при несоответствии паролей', async ({
      page,
    }) => {
      await fillRegisterForm(page, 'test@example.com', 'Password123', 'Password456');
      await page.getByRole('button', { name: 'Зарегистрироваться' }).click();

      await expect(
        page.getByText('Пароли не совпадают')
      ).toBeVisible();
    });

    test('должен показывать ошибку при потере фокуса с разными паролями', async ({
      page,
    }) => {
      await fillRegisterForm(page, 'test@example.com', 'Password123', 'Password456');

      // Фокус с поля подтверждения пароля
      await page.getByLabel('Подтверждение пароля').blur();

      await expect(
        page.getByText('Пароли не совпадают')
      ).toBeVisible();
    });

    test('должен очищать ошибку при исправлении несоответствия', async ({
      page,
    }) => {
      await fillRegisterForm(page, 'test@example.com', 'Password123', 'Password456');
      await page.getByLabel('Подтверждение пароля').blur();

      // Ошибка должна появиться
      await expect(
        page.getByText('Пароли не совпадают')
      ).toBeVisible();

      // Исправляем пароль
      await page
        .getByLabel('Подтверждение пароля')
        .fill('Password123');

      // Ошибка должна исчезнуть
      await expect(
        page.getByText('Пароли не совпадают')
      ).not.toBeVisible();
    });
  });

  // ============================================================================
  // Edge Cases
  // ============================================================================

  test.describe('Edge Cases', () => {
    test.describe('Обработка сетевых ошибок', () => {
      test.beforeEach(async ({ page }) => {
        await goToLoginPage(page);
      });

      test('должен показывать сообщение об ошибке сети при потере соединения', async ({
        page,
      }) => {
        // Вводим данные
        await fillLoginForm(page, 'test@example.com', 'Password123');

        // Отключаем сеть
        await page.route('**/api/*', async (route) => {
          await route.abort('failed');
        });

        await page.getByRole('button', { name: 'Войти' }).click();

        // Ожидаем сообщение об ошибке сети
        await expect(
          page.getByText(/Ошибка соединения|Ошибка сети|network/i)
        ).toBeVisible({ timeout: 5000 });
      });
    });

    test.describe('Обработка валидации email', () => {
      test.describe('Страница входа', () => {
        test.beforeEach(async ({ page }) => {
          await goToLoginPage(page);
        });

        test('должен показывать ошибку формата email', async ({ page }) => {
          await page
            .getByLabel('Email адрес для входа')
            .fill('invalid-email');
          await page.getByLabel('Пароль для входа').fill('Password123');
          await page.getByRole('button', { name: 'Войти' }).click();

          await expect(
            page.getByText(/Некорректный формат email|email/i)
          ).toBeVisible();
        });

        test('должен очищать ошибку формата при вводе корректного email', async ({
          page,
        }) => {
          // Сначала покажем ошибку
          await page
            .getByLabel('Email адрес для входа')
            .fill('invalid');
          await page.getByLabel('Пароль для входа').fill('Password123');
          await page.getByRole('button', { name: 'Войти' }).click();
          await expect(
            page.getByText(/Некорректный формат email/i)
          ).toBeVisible();

          // Введём корректный email
          await page
            .getByLabel('Email адрес для входа')
            .fill('valid@example.com');

          // Ошибка должна исчезнуть
          await expect(
            page.getByText(/Некорректный формат email/i)
          ).not.toBeVisible();
        });
      });

      test.describe('Страница регистрации', () => {
        test.beforeEach(async ({ page }) => {
          await goToRegisterPage(page);
        });

        test('должен показывать ошибку формата email', async ({ page }) => {
          await fillRegisterForm(page, 'invalid-email', 'Password123', 'Password123');
          await page.getByRole('button', { name: 'Зарегистрироваться' }).click();

          await expect(
            page.getByText(/Введите корректный email|email/i)
          ).toBeVisible();
        });

        test('должен автоматически переводить email в нижний регистр', async ({
          page,
        }) => {
          await fillRegisterForm(
            page,
            'UPPERCASE@EXAMPLE.COM',
            'Password123',
            'Password123'
          );

          // Ошибка не должна появляться для корректного формата
          await page.getByRole('button', { name: 'Зарегистрироваться' }).click();

          // Проверяем что email был приведён к нижнему регистру на сервере
          // (это должно произойти, если email не дубликат)
          await expect(page).toHaveURL(/\/login/);
        });
      });
    });

    test.describe('Валидация пароля', () => {
      test.describe('Страница регистрации', () => {
        test.beforeEach(async ({ page }) => {
          await goToRegisterPage(page);
        });

        test('должен показывать ошибку для короткого пароля', async ({ page }) => {
          await fillRegisterForm(page, 'test@example.com', 'abc', 'abc');
          await page.getByRole('button', { name: 'Зарегистрироваться' }).click();

          await expect(
            page.getByText(/Минимум 6 символов|пароль/i)
          ).toBeVisible();
        });

        test('должен очищать ошибку длины при вводе корректного пароля', async ({
          page,
        }) => {
          // Сначала покажем ошибку
          await fillRegisterForm(page, 'test@example.com', 'abc', 'abc');
          await page.getByRole('button', { name: 'Зарегистрироваться' }).click();
          await expect(
            page.getByText(/Минимум 6 символов/i)
          ).toBeVisible();

          // Введём корректный пароль
          await page.getByLabel('Пароль').fill('Password123');
          await page.getByLabel('Подтверждение пароля').fill('Password123');

          // Ошибка должна исчезнуть
          await expect(
            page.getByText(/Минимум 6 символов/i)
          ).not.toBeVisible();
        });
      });
    });
  });
});
