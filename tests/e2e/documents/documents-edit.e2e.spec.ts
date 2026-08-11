/**
 * @e2e documents-edit
 * @description E2E-тесты для редактирования документов (US-22-07)
 *
 * @spec
 * - US-22-07 AC-1: Редактирование названия
 * - US-22-07 AC-3: Добавление тега
 * - US-22-07 AC-4: Удаление тега
 * - US-22-07 AC-5: Изменение видимости
 * - US-22-07 AC-6: Архивация
 * - US-22-07 AC-7: Блокировка archived
 */
import { test, expect } from './fixtures';
import { login, TEST_USERS } from '../shared/test-helpers';

/**
 * Вспомогательная функция для загрузки и публикации документа
 */
async function createPublishedDocument(apiRequest: any, title: string, visibleRoles: string[], tags?: string[]) {
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

  await apiRequest.put(`/api/v1/documents/${docId}/metadata`, {
    data: {
      title,
      documentType: 'contract',
      visibleRoles,
      status: 'published',
      tags,
    },
    headers: { 'Content-Type': 'application/json' },
  });

  return docId;
}

// ============================================================================
// US-22-07: Редактирование метаданных и тегов документа
// ============================================================================

test.describe('US-22-07: Редактирование метаданных и тегов документа', () => {
  let docId: string;

  test.beforeEach(async ({ page, apiRequest }) => {
    await login(page, TEST_USERS.admin.email, TEST_USERS.admin.password);
    docId = await createPublishedDocument(apiRequest, `Original Title ${Date.now()}`, ['ADMIN', 'MEMBER'], ['старый']);
  });

  test('AC-1: ADMIN может изменить название', async ({ page, apiRequest }) => {
    const newTitle = `Изменённое название ${Date.now()}`;

    const response = await apiRequest.put(`/api/v1/documents/${docId}`, {
      data: { title: newTitle },
      headers: { 'Content-Type': 'application/json' },
    });

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.data.title).toBe(newTitle);
  });

  test('AC-3: ADMIN может добавить тег', async ({ page, apiRequest }) => {
    const response = await apiRequest.put(`/api/v1/documents/${docId}`, {
      data: { tags: ['старый', 'новый'] },
      headers: { 'Content-Type': 'application/json' },
    });

    expect(response.status()).toBe(200);
  });

  test('AC-4: ADMIN может удалить тег', async ({ page, apiRequest }) => {
    const response = await apiRequest.put(`/api/v1/documents/${docId}`, {
      data: { tags: ['новый'] },
      headers: { 'Content-Type': 'application/json' },
    });

    expect(response.status()).toBe(200);
  });

  test('AC-5: ADMIN может изменить видимость по ролям', async ({ page, apiRequest }) => {
    const response = await apiRequest.put(`/api/v1/documents/${docId}`, {
      data: { visibleRoles: ['ADMIN'] },
      headers: { 'Content-Type': 'application/json' },
    });

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.data.visibleRoles).toEqual(['ADMIN']);
  });

  test('AC-6: ADMIN может архивировать документ', async ({ page, apiRequest }) => {
    const response = await apiRequest.put(`/api/v1/documents/${docId}`, {
      data: { status: 'archived' },
      headers: { 'Content-Type': 'application/json' },
    });

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.data.status).toBe('archived');
  });

  test('AC-7: Архивированный документ нельзя редактировать (BR-08)', async ({ page, apiRequest }) => {
    // Сначала архивируем
    await apiRequest.put(`/api/v1/documents/${docId}`, {
      data: { status: 'archived' },
      headers: { 'Content-Type': 'application/json' },
    });

    // Пытаемся изменить название
    const response = await apiRequest.put(`/api/v1/documents/${docId}`, {
      data: { title: 'Новое название' },
      headers: { 'Content-Type': 'application/json' },
    });

    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('BUSINESS_RULE_VIOLATION');
  });

  test('AC-8: Валидация названия при редактировании', async ({ page, apiRequest }) => {
    const response = await apiRequest.put(`/api/v1/documents/${docId}`, {
      data: { title: '' },
      headers: { 'Content-Type': 'application/json' },
    });

    expect(response.status()).toBe(400);
  });

  test('403 при попытке редактирования не-ADMIN', async ({ page, apiRequest }) => {
    // Логаемся как MEMBER
    await login(page, TEST_USERS.member.email, TEST_USERS.member.password);

    const response = await apiRequest.put(`/api/v1/documents/${docId}`, {
      data: { title: 'Взлом' },
      headers: { 'Content-Type': 'application/json' },
    });

    expect(response.status()).toBe(403);
  });
});
