import type { ApiResponse, PaginatedResponse } from '@/shared/types';

/**
 * @class ApiClient
 * @description Централизованный REST API клиент для общения с сервером
 *
 * @spec
 * - Все запросы автоматически префиксируются BASE_API_URL
 * - Поддерживает: GET, POST, PUT, DELETE, POST with FormData
 * - credentials: include — для отправки cookie сессии
 * - Ошибки: возвращают сообщение из error.error.message или error.message
 *
 * @example
 * ```typescript
 * const client = new ApiClient('/api/v1');
 * const response = await client.get<UserProfile>('/profile');
 * ```
 */
class ApiClient {
  private readonly baseUrl: string;

  /**
   * @param baseUrl - Базовый URL API, по умолчанию '/api/v1'
   */
  constructor(baseUrl: string = '/api/v1') {
    this.baseUrl = baseUrl;
  }

  /**
   * GET запрос
   * @param path - Путь API (относительно baseUrl)
   */
  async get<T>(path: string, options?: { signal?: AbortSignal }): Promise<ApiResponse<T>> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      credentials: 'include',
      signal: options?.signal,
    });
    if (!res.ok) {
      const error = await res.json().catch(() => ({ error: { message: 'Request failed' } }));
      throw new Error(error.error?.message || error.message || 'Request failed');
    }
    return res.json();
  }

  /**
   * GET запрос с query параметрами
   * @param path - Путь API
   * @param queryParams - Объект с query параметрами
   */
  async getWithQuery<T>(
    path: string,
    queryParams: Record<string, string | number | boolean | null | undefined>,
    options?: { signal?: AbortSignal },
  ): Promise<ApiResponse<T>> {
    const queryString = Object.entries(queryParams)
      .filter(([, value]) => value !== null && value !== undefined && value !== '')
      .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
      .join('&');

    const url = queryString ? `${this.baseUrl}${path}?${queryString}` : `${this.baseUrl}${path}`;
    const res = await fetch(url, {
      credentials: 'include',
      signal: options?.signal,
    });
    if (!res.ok) {
      const error = await res.json().catch(() => ({ error: { message: 'Request failed' } }));
      throw new Error(error.error?.message || error.message || 'Request failed');
    }
    return res.json();
  }

  /**
   * POST запрос
   * @param path - Путь API
   * @param body - Тело запроса
   */
  async post<T>(path: string, body: unknown): Promise<ApiResponse<T>> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      credentials: 'include',
    });
    if (!res.ok) {
      const error = await res.json().catch(() => ({ error: { message: 'Request failed' } }));
      throw new Error(error.error?.message || error.message || 'Request failed');
    }
    return res.json();
  }

  /**
   * PATCH запрос
   * @param path - Путь API
   * @param body - Тело запроса
   */
  async patch<T>(path: string, body: unknown): Promise<ApiResponse<T>> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      credentials: 'include',
    });
    if (!res.ok) {
      const error = await res.json().catch(() => ({ error: { message: 'Request failed' } }));
      throw new Error(error.error?.message || error.message || 'Request failed');
    }
    return res.json();
  }

  /**
   * PUT запрос
   * @param path - Путь API
   * @param body - Тело запроса
   */
  async put<T>(path: string, body: unknown): Promise<ApiResponse<T>> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      credentials: 'include',
    });
    if (!res.ok) {
      const error = await res.json().catch(() => ({ error: { message: 'Request failed' } }));
      throw new Error(error.error?.message || error.message || 'Request failed');
    }
    return res.json();
  }

  /**
   * DELETE запрос
   * @param path - Путь API
   * @returns ApiResponse<T> с данными (если есть) или void
   *
   * @spec
   * - Обрабатывает 204 No Content — возвращает { success: true, data: null }
   * - При ошибках — пытается распарсить JSON и выбрасывает ошибку
   */
  async delete<T = void>(path: string): Promise<ApiResponse<T>> {
    const res = await fetch(`${this.baseUrl}${path}`, { method: 'DELETE', credentials: 'include' });
    if (!res.ok) {
      const error = await res.json().catch(() => ({ error: { message: 'Request failed' } }));
      throw new Error(error.error?.message || error.message || 'Request failed');
    }
    // 204 No Content — пустое тело
    if (res.status === 204) {
      return { success: true, data: null as T };
    }
    return res.json();
  }

  /**
   * POST запрос с FormData (для загрузки файлов)
   * @param path - Путь API
   * @param formData - FormData для отправки
   */
  async postFormData<T>(path: string, formData: FormData): Promise<ApiResponse<T>> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      method: 'POST',
      body: formData,
      credentials: 'include',
    });
    if (!res.ok) {
      const error = await res.json().catch(() => ({ error: { message: 'Request failed' } }));
      throw new Error(error.error?.message || error.message || 'Request failed');
    }
    return res.json();
  }
}

/**
 * Экземпляр API клиента с базовым URL '/api/v1'
 * Используется во всех компонентах и страницах для запросов к API
 */
export const apiClient = new ApiClient();

/**
 * Фабрика для создания новых экземпляров API клиента с кастомным baseUrl
 * @param baseUrl - Базовый URL API
 * @returns Новый экземпляр ApiClient
 */
export function createApiClient(baseUrl: string = '/api/v1'): ApiClient {
  return new ApiClient(baseUrl);
}
