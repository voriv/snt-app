import { defineConfig } from 'vitest/config';
import path from 'path';
import tsconfigPaths from 'vite-tsconfig-paths';

const projectRoot = path.resolve(__dirname, '../..');

export default defineConfig({
  plugins: [
    tsconfigPaths({ root: projectRoot })
  ],
  test: {
    include: ['**/*.test.ts'],
    environment: 'node',
    setupFiles: [path.resolve(__dirname, './setup.ts')],
    globals: true,
    // globalSetup removed - API tests use isolated mocks, no DB needed
  },
  resolve: {
    alias: {
      '@': path.resolve(projectRoot, 'src'),
      '@app': path.resolve(projectRoot, 'src/app'),
    },
  },
});
