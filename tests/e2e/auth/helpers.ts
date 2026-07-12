import { Page } from '@playwright/test';

/**
 * Логин для тестов
 * 
 * @param page - Страница для выполнения действий
 * @param email - Email пользователя
 * @param password - Пароль пользователя
 */
export async function login(
  page: Page,
  email: string,
  password: string
): Promise<void> {
  await page.goto('/login');
  
  // Вводим email
  await page.getByLabel('Email').fill(email);
  
  // Вводим пароль
  await page.getByLabel('Пароль').fill(password);
  
  // Нажимаем кнопку входа
  await page.getByRole('button', { name: 'Войти' }).click();
  
  // Ожидаем перенаправление на dashboard
  await page.waitForURL(/\/dashboard/);
}
