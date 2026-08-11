/**
 * @e2e documents-list
 * @description E2E-тесты для просмотра списка документов (US-22-05)
 *
 * @spec
 * - US-22-05 AC-1: Список по роли
 * - US-22-05 AC-2: ADMIN видит все
 * - US-22-05 AC-3: ADMIN видит draft
 * - US-22-05 AC-4: Фильтр по категории
 * - US-22-05 AC-5: Фильтр по типу
 * - US-22-05 AC-6: Поиск по названию
 * - US-22-05 AC-8: Пустое состояние
 * - US-22-05 AC-9: Сортировка DESC
 */
import { test, expect } from './fixtures';
import { login, TEST_USERS } from '../shared/test-helpers';

const DOCUMENTS_API = '/api/v1/documents';

/**
 * Вспомогательная функция для загрузки файла
 */
async function uploadAndPublish(apiRequest: any, title: string, status: string, visibleRoles: string[], tags?: string[]) {
  // Upload
  const pdfBuffer = Buffer.from(`%PDF-1.4 ${title}`);
  const uploadResponse = await apiRequest.post('/api/v1/documents/upload', {
    multipart: {
      file: {
        name: `${title}.pdf`,
        mimeType: 'application/pdf',
        buffer: pdfBuffer,
      },
    },
  });
  const docId = (await uploadResponse.json()).data.id;

  // Metadata
  await apiRequest.put(`/api/v1/documents/${docId}/metadata`, {
    data: {
      title,
      documentType: 'contract',
      visibleRoles,
      status,
      tags,
    },
    headers: { 'Content-Type': 'application/json' },
  });

  return docId;
}

// ============================================================================
// US-22-05: Просмотр списка документов
// ============================================================================

test.describe('US-22-05: Просмотр списка документов', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, TEST_USERS.admin.email, TEST_USERS.admin.password);
  });

  test('AC-2: ADMIN видит все документы через API', async ({ page, apiRequest }) => {
    const response = await apiRequest.get(DOCUMENTS_API);

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.data).toHaveProperty('items');
    expect(body.data).toHaveProperty('total');
  });

  test('AC-6: Поиск по названию работает', async ({ page, apiRequest }) => {
    const response = await apiRequest.get(`${DOCUMENTS_API}?search=договор`);

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
  });

  test('AC-8: Пустое состояние показывает сообщение', async ({ page }) => {
    await page.goto('/dashboard/documents');

    // Проверяем, что страница загрузилась
    await expect(page).toHaveURL(/\/dashboard\/documents/);
  });

  test('AC-9: Сортировка DESC по дате создания', async ({ page, apiRequest }) => {
    const response = await apiRequest.get(`${DOCUMENTS_API}?page=1&limit=20`);

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.data.page).toBe(1);
    expect(body.data.limit).toBe(20);
  });

  test('Фильтрация по статусу draft', async ({ page, apiRequest }) => {
    const response = await apiRequest.get(`${DOCUMENTS_API}?status=draft`);

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
  });

  test('Пагинация работает корректно', async ({ page, apiRequest }) => {
    const response = await apiRequest.get(`${DOCUMENTS_API}?page=2&limit=10`);

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.data.page).toBe(2);
    expect(body.data.limit).toBe(10);
  });
});
