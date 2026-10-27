/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import { configDefaults } from 'vitest/config';

// './' — локальный dev; в CI передаём '/mmmdays/app/', чтобы продакшн-манифест
// и service worker получили абсолютные адреса: некоторые Android-браузеры
// (Samsung Internet) спотыкаются об относительный start_url при установке.
const BASE = process.env.DEPLOY_BASE ?? './';

export default defineConfig({
  base: BASE,
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'MmmDays',
        short_name: 'MmmDays',
        description: 'Минималистичный трекер цикла без аккаунтов и облака',
        // абсолютный id только в проде: в dev './' разрешился бы в корень origin
        ...(BASE === './' ? {} : { id: BASE }),
        start_url: BASE,
        scope: BASE,
        display: 'standalone',
        background_color: '#F5F6F7',
        theme_color: '#F5F6F7',
        icons: [
          { src: `${BASE}icons/icon-192.png`, sizes: '192x192', type: 'image/png' },
          { src: `${BASE}icons/icon-512.png`, sizes: '512x512', type: 'image/png' },
          { src: `${BASE}icons/maskable-512.png`, sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
    }),
  ],
  test: {
    environment: 'happy-dom',
    setupFiles: ['src/test/setup.ts'],
    exclude: [...configDefaults.exclude, '.superpowers/**'],
  },
});
