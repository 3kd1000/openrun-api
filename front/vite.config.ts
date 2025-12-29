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
        // JS/CSS/이미지만 precache (HTML 제외)
        globPatterns: ['**/*.{js,css,ico,png,svg,jpeg}'],
        // 구버전 캐시 자동 삭제
        cleanupOutdatedCaches: true,
        runtimeCaching: [
          // HTML 문서: 항상 네트워크 우선 (배포 시 최신 버전 즉시 반영)
          {
            urlPattern: ({ request }) => request.mode === 'navigate',
            handler: 'NetworkFirst',
            options: {
              cacheName: 'html-cache',
              networkTimeoutSeconds: 3,
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60, // 1시간
              },
            },
          },
          // API 캐싱: 네트워크 우선, 실패 시 캐시 사용
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
