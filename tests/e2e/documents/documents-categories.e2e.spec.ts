/**
 * @e2e documents-categories
 * @description E2E-тесты для управления категориями документов (US-22-01, US-22-02)
 *
 * @spec
 * - US-22-01 AC-1: Создание корневой категории
 * - US-22-01 AC-2: Создание подкатегории
 * - US-22-01 AC-3: Валидация пустого name
 * - US-22-01 AC-4: Уникальность name+parent
 * - US-22-01 AC-5: Валидация parentId
 * - US-22-02 AC-1: Удаление пустой категории
 * - US-22-02 AC-5: 404 при повторном удалении
 */
import { test, expect } from './fixtures';
import { login, TEST_USERS } from '../shared/test-helpers';

const CATEGORIES_URL = '/dashboard/documents/categories';
const CATEGORIES_API = '/api/v1/documents/categories';

// ============================================================================
// US-22-01: Создание категории документа
// ============================================================================

test.describe('US-22-01: Создание категории документа', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, TEST_USERS.admin.email, TEST_USERS.admin.password);
    await page.goto(CATEGORIES_URL);
  });

  test('AC-1: ADMIN может создать корневую категорию', async ({ page, apiRequest }) => {
    const categoryName = `Тестовая категория ${Date.now()}`;

    const response = await apiRequest.post(CATEGORIES_API, {
      data: { name: categoryName },
      headers: { 'Content-Type': 'application/json' },
    });

    expect(response.status()).toBe(201);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.data.name).toBe(categoryName);
    expect(body.data.parentId).toBeNull();
  });

  test('AC-2: ADMIN может создать подкатегорию', async ({ page, apiRequest }) => {
    // Создаём родительскую категорию
    const parentResponse = await apiRequest.post(CATEGORIES_API, {
      data: { name: `Родитель ${Date.now()}` },
      headers: { 'Content-Type': 'application/json' },
    });
    const parentId = (await parentResponse.json()).data.id;

    // Создаём подкатегорию
    const childResponse = await apiRequest.post(CATEGORIES_API, {
      data: { name: 'Подкатегория', parentId },
      headers: { 'Content-Type': 'application/json' },
    });

    expect(childResponse.status()).toBe(201);
    const body = await childResponse.json();
    expect(body.data.parentId).toBe(parentId);
  });

  test('AC-3: Отклонение при пустом названии', async ({ page, apiRequest }) => {
    const response = await apiRequest.post(CATEGORIES_API, {
      data: { name: '' },
      headers: { 'Content-Type': 'application/json' },
    });

    expect(response.status()).toBe(400);
  });

  test('AC-4: Отклонение при дубликате имени на том же уровне', async ({ page, apiRequest }) => {
    const name = `Уникальная ${Date.now()}`;

    await apiRequest.post(CATEGORIES_API, {
      data: { name },
      headers: { 'Content-Type': 'application/json' },
    });

    const duplicateResponse = await apiRequest.post(CATEGORIES_API, {
      data: { name },
      headers: { 'Content-Type': 'application/json' },
    });

    expect(duplicateResponse.status()).toBe(409);
  });

  test('AC-5: Отклонение при несуществующем parentId', async ({ page, apiRequest }) => {
    const response = await apiRequest.post(CATEGORIES_API, {
      data: { name: 'Тест', parentId: 'nonexistent-id' },
      headers: { 'Content-Type': 'application/json' },
    });

    expect(response.status()).toBe(404);
  });
});

// ============================================================================
// US-22-02: Удаление категории документа
// ============================================================================

test.describe('US-22-02: Удаление категории документа', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, TEST_USERS.admin.email, TEST_USERS.admin.password);
  });

  test('AC-1: ADMIN может удалить пустую категорию', async ({ page, apiRequest }) => {
    const response = await apiRequest.post(CATEGORIES_API, {
      data: { name: `Удалить ${Date.now()}` },
      headers: { 'Content-Type': 'application/json' },
    });
    const categoryId = (await response.json()).data.id;

    const deleteResponse = await apiRequest.delete(`${CATEGORIES_API}/${categoryId}`);

    expect(deleteResponse.status()).toBe(200);
  });

  test('AC-5: 404 при повторном удалении', async ({ page, apiRequest }) => {
    const response = await apiRequest.post(CATEGORIES_API, {
      data: { name: `Удалить ${Date.now()}` },
      headers: { 'Content-Type': 'application/json' },
    });
    const categoryId = (await response.json()).data.id;

    await apiRequest.delete(`${CATEGORIES_API}/${categoryId}`);

    const secondDelete = await apiRequest.delete(`${CATEGORIES_API}/${categoryId}`);
    expect(secondDelete.status()).toBe(404);
  });
});
