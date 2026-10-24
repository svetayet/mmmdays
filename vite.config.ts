/// <reference types="vitest/config" />
import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  test: {
    environment: 'happy-dom',
    setupFiles: ['src/test/setup.ts'],
  },
});
