/**
 * @file tests/api/helpers.ts
 * @description Утилиты для создания API тестов с моками сессий
 *
 * @spec
 * - mockSession: устанавливает мокированную сессию с указанным пользователем
 * - mockNoSession: устанавливает мокированную несессированную сессию
 * - mockMemberSession: устанавливает мокированную сессию с ролью MEMBER
 * - mockAdminSession: устанавливает мокированную сессию с ролью ADMIN
 */
import { vi } from 'vitest';

// Создаем local mock функцию в каждом тесте
// Это позволяет избежать проблем с циклическими импортами и порядком инициализации
let localAuthMock: ReturnType<typeof vi.fn> | null = null;

/**
 * Инициализирует local mock функцию для текущего теста
 * @param impl - опциональная кастомная реализация
 */
export function initAuthMock(impl?: ReturnType<typeof vi.fn>): void {
  localAuthMock = impl || vi.fn().mockResolvedValue(null);
}

/**
 * Получает local mock функцию
 * @throws Error если mock не инициализирован
 */
function getLocalAuthMock(): ReturnType<typeof vi.fn> {
  if (!localAuthMock) {
    throw new Error(
      'Local auth mock не инициализирован. Вызовите initAuthMock() в beforeEach.'
    );
  }
  return localAuthMock;
}

/**
 * Создаёт мокированную сессию для тестов
 * @param user - Объект пользователя с id, email и roles
 * @param expires - Дата истечения сессии (опционально)
 */
export function mockSession(
  user: {
    id: string;
    email: string;
    roles: string[];
  },
  expires?: string
) {
  const mockResult = {
    user: {
      id: user.id,
      email: user.email,
      roles: user.roles,
      name: user.email.split('@')[0],
    },
    expires: expires ?? new Date(Date.now() + 3600000).toISOString(),
  };

  const mockFn = getLocalAuthMock();
  mockFn.mockResolvedValue(mockResult);
}

/**
 * Создаёт мокированную несессированную сессию
 */
export function mockNoSession() {
  const mockFn = getLocalAuthMock();
  mockFn.mockResolvedValue(null);
}

/**
 * Создаёт мокированную сессию с ролью MEMBER
 */
export function mockMemberSession() {
  mockSession({ 
    id: 'user-1', 
    email: 'member@example.com', 
    roles: ['MEMBER'] 
  });
}

/**
 * Создаёт мокированную сессию с ролью ADMIN
 */
export function mockAdminSession() {
  mockSession({ 
    id: 'user-1', 
    email: 'admin@example.com', 
    roles: ['ADMIN'] 
  });
}
