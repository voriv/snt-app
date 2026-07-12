/**
 * @file tests/e2e/plots/fixtures.ts
 * @description Фикстуры для E2E тестов управления участками
 */
import { test as base, request, type APIRequestContext } from '@playwright/test';

/**
 * Фикстура для APIRequestContext - используется для создания/удаления тестовых данных через API
 */
export const test = base.extend<{
  apiRequest: APIRequestContext;
}>({
  apiRequest: async ({}, use) => {
    // Создаем API контекст для отправки запросов
    const apiRequest = await request.newContext({
      baseURL: 'http://localhost:3000',
    });
    await use(apiRequest);
    await apiRequest.dispose();
  },
});

export { expect } from '@playwright/test';
