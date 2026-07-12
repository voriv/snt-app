/**
 * @file tests/api/plots.test.ts
 * @description API-тесты для управления земельными участками
 *
 * @spec
 * - Hoisted мокирование для корректной работы с импортами в route.ts
 * - Полная реализация AccessService с моками всех репозиториев
 * - Проверяют HTTP-статусы (200, 201, 400, 401, 403, 409, 500)
 * - Проверяют форматы ответов
 * - Проверяют валидацию входящих данных
 * - Проверяют обработку ошибок
 *
 * @see docs/tests/api-tests.md
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';

// Hoisted mock объекты — референсы на объекты, которые используются в тестах

const plotServiceMock = vi.hoisted(() => ({
  findAll: vi.fn(),
  findById: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
}));

const accessServiceMock = vi.hoisted(() => ({
  canAccessApi: vi.fn(),
  resolveEndpoint: vi.fn(),
}));

const authMock = vi.hoisted(() => vi.fn());

// Моки модулей — применяются один раз
vi.mock('../../src/lib/auth', () => ({
  auth: authMock,
}));

// Factory для создания нового ContainerMock с новыми моками для каждого теста
function createMockContainer() {
  return {
    getPlotService: vi.fn(() => plotServiceMock),
    getAccessService: vi.fn(() => accessServiceMock),
  };
}

vi.mock('../../src/di/container', () => {
  return {
    getContainer: vi.fn(() => createMockContainer()),
    createPlotService: vi.fn(() => plotServiceMock),
    createAccessService: vi.fn(() => accessServiceMock),
  };
});

// Импорт функций из API route ПОСЛЕ мокирования зависимостей
import { GET, POST } from '../../src/app/api/v1/plots/route';
import { PlotDuplicateError, PlotInvalidDataError } from '../../src/domains/plot/plot.errors';

// Создание мок-запроса с правильным методом и телом
function createMockRequest(
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE',
  path: string,
  body?: unknown
) {
  const url = `http://localhost${path}`;
  const headers = new Headers();
  if (body !== undefined && body !== null) {
    headers.set('Content-Type', 'application/json');
  }

  return {
    method,
    url,
    headers,
    nextUrl: new URL(url),
    json: async () => body ?? {},
    arrayBuffer: async () => new ArrayBuffer(0),
    text: async () => JSON.stringify(body ?? ''),
    cookie: {
      get: () => undefined,
      set: () => {},
      delete: () => {},
    },
  } as unknown as NextRequest;
}

describe('GET /api/v1/plots', () => {
  beforeEach(() => {
    // Очищаем все моки перед каждым тестом
    vi.clearAllMocks();

    // Дефолтное значение для canAccessApi - false (без доступа по умолчанию)
    accessServiceMock.canAccessApi.mockResolvedValue(false);

    // Дефолтное значение для resolveEndpoint — важно использовать isActive (camelCase)
    accessServiceMock.resolveEndpoint.mockResolvedValue({
      id: 'endpoint-1',
      method: 'GET',
      path: '/plots',
      isActive: true, // camelCase, а не snake_case
      accessType: 'role',
    });
  });

  it('should return 200 with plots array when authorized as ADMIN', async () => {
    // Мокируем успешную сессию с ролью ADMIN
    authMock.mockResolvedValue({
      user: {
        id: 'user-1',
        email: 'admin@example.com',
        roles: ['ADMIN'],
        name: 'admin',
      },
      expires: new Date(Date.now() + 3600000).toISOString(),
    });

    // Переопределяем дефолтные моки
    accessServiceMock.canAccessApi.mockResolvedValue(true);
    accessServiceMock.resolveEndpoint.mockResolvedValue({
      id: 'endpoint-1',
      method: 'GET',
      path: '/plots',
      isActive: true,
      accessType: 'role',
    });

    // Мокируем сервис plots
    plotServiceMock.findAll.mockResolvedValue([
      {
        id: 'plot-1',
        plotNumber: '100',
        area: 10,
        address: 'ул. Ленина 1',
        note: 'Тестовый участок',
      },
    ]);

    const request = createMockRequest('GET', '/api/v1/plots');
    const response = await GET(request, {} as any);

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json).toMatchObject({
      success: true,
      data: expect.any(Array),
    });
  });

  it('should return 401 without auth', async () => {
    // Мокируем отсутствие сессии
    authMock.mockResolvedValue(null);

    const request = createMockRequest('GET', '/api/v1/plots');
    const response = await GET(request, {} as any);

    expect(response.status).toBe(401);
    const json = await response.json();
    expect(json).toMatchObject({
      success: false,
      error: { code: 'UNAUTHORIZED' },
    });
  });

  it('should return 403 for MEMBER role', async () => {
    // Мокируем сессию с ролью MEMBER (без доступа)
    authMock.mockResolvedValue({
      user: {
        id: 'user-1',
        email: 'member@example.com',
        roles: ['MEMBER'],
        name: 'member',
      },
      expires: new Date(Date.now() + 3600000).toISOString(),
    });

    // canAccessApi вернёт false (по умолчанию из beforeEach)

    const request = createMockRequest('GET', '/api/v1/plots');
    const response = await GET(request, {} as any);

    expect(response.status).toBe(403);
    const json = await response.json();
    expect(json).toMatchObject({
      success: false,
      error: { code: 'FORBIDDEN' },
    });
  });

  it('should return plots with correct structure', async () => {
    authMock.mockResolvedValue({
      user: {
        id: 'user-1',
        email: 'admin@example.com',
        roles: ['ADMIN'],
        name: 'admin',
      },
      expires: new Date(Date.now() + 3600000).toISOString(),
    });

    accessServiceMock.canAccessApi.mockResolvedValue(true);

    const expectedPlot = {
      id: 'plot-1',
      plotNumber: '100',
      area: 10,
      address: 'ул. Ленина 1',
      note: 'Тестовый участок',
    };
    plotServiceMock.findAll.mockResolvedValue([expectedPlot]);

    const request = createMockRequest('GET', '/api/v1/plots');
    const response = await GET(request, {} as any);

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.data).toHaveLength(1);
    expect(json.data[0]).toMatchObject(expectedPlot);
  });
});

describe('POST /api/v1/plots', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Дефолтное значение для canAccessApi - false (без доступа по умолчанию)
    accessServiceMock.canAccessApi.mockResolvedValue(false);
    // Дефолтное значение для resolveEndpoint - POST /plots
    accessServiceMock.resolveEndpoint.mockResolvedValue({
      id: 'endpoint-1',
      method: 'POST',
      path: '/plots',
      isActive: true,
      accessType: 'role',
    });
  });

  it('should create a plot and return 201', async () => {
    authMock.mockResolvedValue({
      user: {
        id: 'user-1',
        email: 'admin@example.com',
        roles: ['ADMIN'],
        name: 'admin',
      },
      expires: new Date(Date.now() + 3600000).toISOString(),
    });

    accessServiceMock.canAccessApi.mockResolvedValue(true);

    const requestData = {
      plotNumber: '100',
      area: 100,
      address: 'ул. Ленина',
      note: 'Тестовый участок',
    };

    plotServiceMock.create.mockResolvedValue({
      id: 'new-plot-id',
      ...requestData,
    });

    const request = createMockRequest('POST', '/api/v1/plots', requestData);
    const response = await POST(request, {} as any);

    expect(response.status).toBe(201);
    const json = await response.json();
    expect(json).toMatchObject({
      success: true,
      data: expect.objectContaining({
        plotNumber: '100',
        area: 100,
      }),
    });
  });

  it('should return 400 when plotNumber is empty', async () => {
    authMock.mockResolvedValue({
      user: {
        id: 'user-1',
        email: 'admin@example.com',
        roles: ['ADMIN'],
        name: 'admin',
      },
      expires: new Date(Date.now() + 3600000).toISOString(),
    });

    accessServiceMock.canAccessApi.mockResolvedValue(true);

    // Мокаем валидацию сервиса — бросаем PlotInvalidDataError при валидационной ошибке
    plotServiceMock.create.mockImplementation(() => {
      throw new PlotInvalidDataError('Номер участка обязателен');
    });

    const requestData = {
      plotNumber: '',
      area: 100,
    };
    const request = createMockRequest('POST', '/api/v1/plots', requestData);
    const response = await POST(request, {} as any);

    // Проверка что статус 400 (валидация в сервисе)
    expect(response.status).toBe(400);
  });

  it('should return 400 when area is missing', async () => {
    authMock.mockResolvedValue({
      user: {
        id: 'user-1',
        email: 'admin@example.com',
        roles: ['ADMIN'],
        name: 'admin',
      },
      expires: new Date(Date.now() + 3600000).toISOString(),
    });

    accessServiceMock.canAccessApi.mockResolvedValue(true);

    // Мокаем валидацию сервиса — бросаем PlotInvalidDataError при валидационной ошибке
    plotServiceMock.create.mockImplementation(() => {
      throw new PlotInvalidDataError('Площадь обязательна');
    });

    const requestData = {
      plotNumber: '100',
    };
    const request = createMockRequest('POST', '/api/v1/plots', requestData);
    const response = await POST(request, {} as any);

    // Проверка что статус 400 (валидация в сервисе)
    expect(response.status).toBe(400);
  });

  it('should return 400 when area is negative', async () => {
    authMock.mockResolvedValue({
      user: {
        id: 'user-1',
        email: 'admin@example.com',
        roles: ['ADMIN'],
        name: 'admin',
      },
      expires: new Date(Date.now() + 3600000).toISOString(),
    });

    accessServiceMock.canAccessApi.mockResolvedValue(true);

    // Мокаем валидацию сервиса — бросаем PlotInvalidDataError при валидационной ошибке
    plotServiceMock.create.mockImplementation(() => {
      throw new PlotInvalidDataError('Площадь должна быть положительным числом');
    });

    const requestData = {
      plotNumber: '100',
      area: -10,
    };
    const request = createMockRequest('POST', '/api/v1/plots', requestData);
    const response = await POST(request, {} as any);

    // Проверка что статус 400 (валидация в сервисе)
    expect(response.status).toBe(400);
  });

  it('should return 400 when area is zero', async () => {
    authMock.mockResolvedValue({
      user: {
        id: 'user-1',
        email: 'admin@example.com',
        roles: ['ADMIN'],
        name: 'admin',
      },
      expires: new Date(Date.now() + 3600000).toISOString(),
    });

    accessServiceMock.canAccessApi.mockResolvedValue(true);

    // Мокаем валидацию сервиса — бросаем PlotInvalidDataError при валидационной ошибке
    plotServiceMock.create.mockImplementation(() => {
      throw new PlotInvalidDataError('Площадь должна быть положительным числом');
    });

    const requestData = {
      plotNumber: '100',
      area: 0,
    };
    const request = createMockRequest('POST', '/api/v1/plots', requestData);
    const response = await POST(request, {} as any);

    // Проверка что статус 400 (валидация в сервисе)
    expect(response.status).toBe(400);
  });

  it('should return 409 when plotNumber already exists', async () => {
    authMock.mockResolvedValue({
      user: {
        id: 'user-1',
        email: 'admin@example.com',
        roles: ['ADMIN'],
        name: 'admin',
      },
      expires: new Date(Date.now() + 3600000).toISOString(),
    });

    accessServiceMock.canAccessApi.mockResolvedValue(true);

    // Мокаем ошибку дубликата из plot.errors.ts
    plotServiceMock.create.mockRejectedValue(
      new PlotDuplicateError('plotNumber', '100')
    );

    const requestData = {
      plotNumber: '100',
      area: 100,
    };
    const request = createMockRequest('POST', '/api/v1/plots', requestData);
    const response = await POST(request, {} as any);

    expect(response.status).toBe(409);
    const json = await response.json();
    expect(json).toMatchObject({
      success: false,
      error: { code: 'CONFLICT' },
    });
  });

  it('should return 401 without auth', async () => {
    authMock.mockResolvedValue(null);

    const requestData = {
      plotNumber: '100',
      area: 100,
    };
    const request = createMockRequest('POST', '/api/v1/plots', requestData);
    const response = await POST(request, {} as any);

    expect(response.status).toBe(401);
    const json = await response.json();
    expect(json).toMatchObject({
      success: false,
      error: { code: 'UNAUTHORIZED' },
    });
  });

  it('should return 403 for MEMBER role', async () => {
    authMock.mockResolvedValue({
      user: {
        id: 'user-1',
        email: 'member@example.com',
        roles: ['MEMBER'],
        name: 'member',
      },
      expires: new Date(Date.now() + 3600000).toISOString(),
    });

    accessServiceMock.canAccessApi.mockResolvedValue(false);

    const requestData = {
      plotNumber: '100',
      area: 100,
    };
    const request = createMockRequest('POST', '/api/v1/plots', requestData);
    const response = await POST(request, {} as any);

    expect(response.status).toBe(403);
    const json = await response.json();
    expect(json).toMatchObject({
      success: false,
      error: { code: 'FORBIDDEN' },
    });
  });

  it('should handle server error and return 500', async () => {
    authMock.mockResolvedValue({
      user: {
        id: 'user-1',
        email: 'admin@example.com',
        roles: ['ADMIN'],
        name: 'admin',
      },
      expires: new Date(Date.now() + 3600000).toISOString(),
    });

    accessServiceMock.canAccessApi.mockResolvedValue(true);

    plotServiceMock.create.mockRejectedValue(new Error('Database error'));

    const requestData = {
      plotNumber: '100',
      area: 100,
    };
    const request = createMockRequest('POST', '/api/v1/plots', requestData);
    const response = await POST(request, {} as any);

    expect(response.status).toBe(500);
  });
});
