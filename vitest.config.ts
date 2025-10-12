import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    include: [
      'tests/**/*.test.ts', 
      'tests/**/*.test.tsx',
      'src/lib/__tests__/**/*.test.ts',  // Added for auth tests
      'src/lib/__tests__/**/*.test.tsx'
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'tests/',
        '*.config.ts',
        'out/',
        'android/',
        'ios/'
      ]
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  }
});

