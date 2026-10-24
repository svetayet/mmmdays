/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: './',
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'MmmDays',
        short_name: 'MmmDays',
        description: 'Минималистичный трекер цикла без аккаунтов и облака',
        start_url: './',
        scope: './',
        display: 'standalone',
        background_color: '#F5F6F7',
        theme_color: '#F5F6F7',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
    }),
  ],
  test: {
    environment: 'happy-dom',
    setupFiles: ['src/test/setup.ts'],
  },
});
