import { defineConfig } from 'vitest/config';
import path from 'path';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    include: ['**/*.test.ts'],
    environment: 'node',
    setupFiles: ['./setup.ts'],
    globals: true,
    globalSetup: ['../integration/global-setup.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '../src'),
      '@app': path.resolve(__dirname, '../src/app'),
    },
  },
});
