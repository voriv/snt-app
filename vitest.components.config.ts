import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/vitest.setup.ts'],
    include: ['tests/components/**/*.test.jsx', 'tests/components/**/*.test.tsx'],
    exclude: [
      'tests/e2e/**',
      'tests/integration/**',
      'tests/api/**',
      'tests/unit/**',
      'node_modules/**',
      '.next/**',
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/app/',
        'tests/e2e/',
        'tests/integration/',
        'tests/api/',
        'tests/unit/',
      ],
    },
  },
});
