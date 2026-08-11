/**
 * @file tests/e2e/documents/fixtures.ts
 * @description Фикстуры для E2E тестов модуля документов
 */
import { test as base, request, type APIRequestContext } from '@playwright/test';

/**
 * Фикстура для APIRequestContext - используется для создания/удаления тестовых данных через API
 */
export const test = base.extend<{
  apiRequest: APIRequestContext;
}>({
  apiRequest: async ({}, use) => {
    const apiRequest = await request.newContext({
      baseURL: 'http://localhost:3000',
    });
    await use(apiRequest);
    await apiRequest.dispose();
  },
});

export { expect } from '@playwright/test';
