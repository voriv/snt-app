/**
 * @e2e documents-upload
 * @description E2E-тесты для загрузки документов (US-22-03, US-22-04)
 *
 * @spec
 * - US-22-03 AC-1: Загрузка PDF
 * - US-22-03 AC-4: Отклонение неподдерживаемого типа
 * - US-22-03 AC-5: Отклонение файла превышающего размер
 * - US-22-04 AC-1: Сохранение метаданных
 * - US-22-04 AC-3: Ограниченная видимость по ролям
 * - US-22-04 AC-5: draft → published
 */
import { test, expect } from './fixtures';
import { login, TEST_USERS } from '../shared/test-helpers';

const UPLOAD_API = '/api/v1/documents/upload';

/**
 * Вспомогательная функция для загрузки файла через Playwright API
 */
async function uploadFile(apiRequest: any, fileName: string, mimeType: string, content: Buffer) {
  return apiRequest.post(UPLOAD_API, {
    multipart: {
      file: {
        name: fileName,
        mimeType,
        buffer: content,
      },
    },
  });
}

// ============================================================================
// US-22-03: Загрузка файла документа
// ============================================================================

test.describe('US-22-03: Загрузка файла документа', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, TEST_USERS.admin.email, TEST_USERS.admin.password);
  });

  test('AC-1: ADMIN может загрузить PDF файл', async ({ page, apiRequest }) => {
    const pdfBuffer = Buffer.from('%PDF-1.4 test content for upload');

    const response = await uploadFile(apiRequest, 'test.pdf', 'application/pdf', pdfBuffer);

    expect(response.status()).toBe(201);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.data.status).toBe('draft');
  });

  test('AC-2: ADMIN может загрузить DOCX файл', async ({ page, apiRequest }) => {
    const docxBuffer = Buffer.from('PK dummy docx content');

    const response = await uploadFile(
      apiRequest,
      'test.docx',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      docxBuffer
    );

    expect(response.status()).toBe(201);
    const body = await response.json();
    expect(body.success).toBe(true);
  });

  test('AC-3: ADMIN может загрузить изображение', async ({ page, apiRequest }) => {
    const imgBuffer = Buffer.from('GIF89a dummy image content');

    const response = await uploadFile(apiRequest, 'test.gif', 'image/gif', imgBuffer);

    expect(response.status()).toBe(201);
  });

  test('AC-4: Отклонение неподдерживаемого типа файла', async ({ page, apiRequest }) => {
    const exeBuffer = Buffer.from('MZ dummy executable');

    const response = await uploadFile(apiRequest, 'test.exe', 'application/x-executable', exeBuffer);

    expect(response.status()).toBe(400);
  });

  test('AC-6: Отклонение пустого файла', async ({ page, apiRequest }) => {
    const emptyBuffer = Buffer.from('');

    const response = await uploadFile(apiRequest, 'empty.pdf', 'application/pdf', emptyBuffer);

    expect(response.status()).toBe(400);
  });
});

// ============================================================================
// US-22-04: Назначение метаданных при загрузке
// ============================================================================

test.describe('US-22-04: Назначение метаданных при загрузке', () => {
  let documentId: string;

  test.beforeEach(async ({ page, apiRequest }) => {
    await login(page, TEST_USERS.admin.email, TEST_USERS.admin.password);

    // Загружаем файл (создаём черновик)
    const pdfBuffer = Buffer.from('%PDF-1.4 test content for metadata');
    const uploadResponse = await uploadFile(apiRequest, 'test.pdf', 'application/pdf', pdfBuffer);
    documentId = (await uploadResponse.json()).data.id;
  });

  test('AC-1: ADMIN может сохранить метаданные', async ({ page, apiRequest }) => {
    const metadata = {
      title: 'Тестовый договор',
      description: 'Описание для тестирования',
      documentType: 'contract',
      visibleRoles: ['ADMIN', 'MEMBER'],
      tags: ['важный', 'договор'],
    };

    const response = await apiRequest.put(`/api/v1/documents/${documentId}/metadata`, {
      data: metadata,
      headers: { 'Content-Type': 'application/json' },
    });

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.data.title).toBe('Тестовый договор');
  });

  test('AC-3: Видимость можно ограничить ролью', async ({ page, apiRequest }) => {
    const metadata = {
      title: 'Только для админов',
      documentType: 'confidential',
      visibleRoles: ['ADMIN'],
    };

    const response = await apiRequest.put(`/api/v1/documents/${documentId}/metadata`, {
      data: metadata,
      headers: { 'Content-Type': 'application/json' },
    });

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.data.visibleRoles).toEqual(['ADMIN']);
  });

  test('AC-5: Документ становится published после сохранения метаданных', async ({ page, apiRequest }) => {
    const metadata = {
      title: 'Опубликованный документ',
      documentType: 'contract',
      visibleRoles: ['ADMIN', 'MEMBER'],
      status: 'published',
    };

    const response = await apiRequest.put(`/api/v1/documents/${documentId}/metadata`, {
      data: metadata,
      headers: { 'Content-Type': 'application/json' },
    });

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.data.status).toBe('published');
  });

  test('Отклонение метаданных с пустым visibleRoles', async ({ page, apiRequest }) => {
    const metadata = {
      title: 'Тест',
      documentType: 'contract',
      visibleRoles: [],
    };

    const response = await apiRequest.put(`/api/v1/documents/${documentId}/metadata`, {
      data: metadata,
      headers: { 'Content-Type': 'application/json' },
    });

    expect(response.status()).toBe(400);
  });
});
