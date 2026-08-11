/**
 * @e2e documents-detail
 * @description E2E-тесты для просмотра деталей и скачивания (US-22-06)
 *
 * @spec
 * - US-22-06 AC-1: Метаданные в карточке
 * - US-22-06 AC-4: Скачивание
 * - US-22-06 AC-5: 403 без прав
 * - US-22-06 AC-6: draft не виден не-ADMIN
 * - US-22-06 AC-7: archived — только просмотр
 */
import { test, expect } from './fixtures';
import { login, TEST_USERS } from '../shared/test-helpers';

/**
 * Вспомогательная функция для загрузки и публикации документа
 */
async function createPublishedDocument(apiRequest: any, title: string, visibleRoles: string[]) {
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
    },
    headers: { 'Content-Type': 'application/json' },
  });

  return docId;
}

async function createDraftDocument(apiRequest: any, title: string) {
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
      visibleRoles: ['ADMIN'],
      status: 'draft',
    },
    headers: { 'Content-Type': 'application/json' },
  });

  return docId;
}

// ============================================================================
// US-22-06: Просмотр деталей и скачивание документа
// ============================================================================

test.describe('US-22-06: Просмотр деталей и скачивание документа', () => {
  let docId: string;

  test.beforeEach(async ({ page, apiRequest }) => {
    await login(page, TEST_USERS.admin.email, TEST_USERS.admin.password);
    docId = await createPublishedDocument(apiRequest, `Test Doc ${Date.now()}`, ['ADMIN', 'MEMBER']);
  });

  test('AC-1: Метаданные отображаются в карточке', async ({ page, apiRequest }) => {
    const response = await apiRequest.get(`/api/v1/documents/${docId}`);

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.data.title).toContain('Test Doc');
  });

  test('AC-4: ADMIN может скачать документ', async ({ page, apiRequest }) => {
    const response = await apiRequest.get(`/api/v1/documents/${docId}/download`);

    expect(response.status()).toBe(200);
  });

  test('AC-5: 403 для пользователя без прав', async ({ page, apiRequest }) => {
    // Создаём документ только для ADMIN
    const adminDocId = await createPublishedDocument(apiRequest, `Admin Only ${Date.now()}`, ['ADMIN']);

    // Логаемся как MEMBER
    await login(page, TEST_USERS.member.email, TEST_USERS.member.password);

    const response = await apiRequest.get(`/api/v1/documents/${adminDocId}`);

    expect(response.status()).toBe(403);
  });

  test('AC-6: draft не виден не-ADMIN', async ({ page, apiRequest }) => {
    const draftDocId = await createDraftDocument(apiRequest, `Draft ${Date.now()}`);

    // Логаемся как MEMBER
    await login(page, TEST_USERS.member.email, TEST_USERS.member.password);

    const response = await apiRequest.get(`/api/v1/documents/${draftDocId}`);

    expect(response.status()).toBe(403);
  });

  test('AC-7: archived документ доступен для просмотра', async ({ page, apiRequest }) => {
    // Архивируем документ
    await apiRequest.put(`/api/v1/documents/${docId}`, {
      data: { status: 'archived' },
      headers: { 'Content-Type': 'application/json' },
    });

    const response = await apiRequest.get(`/api/v1/documents/${docId}`);

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.data.status).toBe('archived');
  });
});
