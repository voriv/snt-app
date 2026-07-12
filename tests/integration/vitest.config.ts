import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '../../src'),
    },
  },
  test: {
    env: {
      NODE_ENV: 'test',
    },
    globals: true,
    environment: 'node',
    include: ['tests/integration/**/**/*.test.ts'],
    // Setup для integration-тестов (вызывается перед каждым тестом)
    setupFiles: ['tests/integration/setup.ts'],
    // Global setup для инициализации базы данных
    globalSetup: ['tests/integration/global-setup.ts'],
    // Sequential execution: тестовые файлы выполняются по одному,
    // чтобы избежать конфликтов между beforeEach cleanup в параллельных тестах
    fileParallelism: false,
    isolate: false,
  },
});
