import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon-192x192.png', 'icon-512x512.png', 'openrun_logo.jpeg'],
      manifest: false, // 이미 수동으로 생성한 manifest.json 사용
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,jpeg}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/api\.openrun\.app\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24, // 24시간
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            urlPattern: /^https:\/\/dev-api\.openrun\.app\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'dev-api-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24, // 24시간
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
        ],
      },
      devOptions: {
        enabled: true, // 개발 환경에서도 PWA 테스트 가능
      },
    }),
  ],
  server: {
    host: true, // 모든 네트워크 인터페이스에서 접근 허용
    allowedHosts: [
      'front.openrun.app', // Cloudflare Tunnel을 통해 접근할 도메인
    ]
  }
})
