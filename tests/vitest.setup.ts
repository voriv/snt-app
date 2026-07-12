import { beforeEach, afterEach } from 'vitest';
import { configure } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

// Очистка моков перед каждым тестом
beforeEach(() => {
  // Очистка будет выполнена автоматически Vitest
});

afterEach(() => {
  // Дополнительная очистка при необходимости
});

// Настройка Testing Library
configure({ testIdAttribute: 'data-testid' });
