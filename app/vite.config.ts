import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import { copyFileSync } from 'node:fs'

// https://vite.dev/config/
// GitHub Pages has no SPA fallback: serving the app shell as 404.html
// makes deep links (e.g. /aircraft/Q5830) render via react-router.
function spa404() {
  return {
    name: 'spa-404',
    closeBundle() {
      copyFileSync('dist/index.html', 'dist/404.html')
    },
  }
}

export default defineConfig({
  base: '/Aviationpedia/',
  plugins: [
    spa404(),
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icons/apple-touch-icon.png', 'icons/icon-192.png', 'icons/icon-512.png'],
      manifest: {
        name: '航空百科 · Aviationpedia',
        short_name: '航空百科',
        description: '飞机与航空公司开放百科 — Aircraft & Airline Encyclopedia',
        theme_color: '#1f2a3a',
        background_color: '#f4f7fb',
        display: 'standalone',
        lang: 'zh-CN',
        start_url: './',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // The app is fully bundled (data included), so precache everything.
        globPatterns: ['**/*.{js,css,html,svg,png,ico}'],
        maximumFileSizeToCacheInBytes: 6 * 1024 * 1024,
        runtimeCaching: [
          {
            // Wikimedia Commons images: cache-first for offline viewing
            urlPattern: ({ url }) => url.hostname === 'commons.wikimedia.org',
            handler: 'CacheFirst',
            options: {
              cacheName: 'commons-images',
              expiration: {
                maxEntries: 400,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
              },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
  build: {
    chunkSizeWarningLimit: 6000,
  },
})
