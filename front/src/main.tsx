import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { BrowserRouter } from 'react-router-dom'
import { registerSW } from 'virtual:pwa-register'

let lastUpdateCheckTime = 0
const UPDATE_CHECK_INTERVAL = 60 * 1000 // 1분

registerSW({
  onNeedRefresh() {
    // 새 버전 감지 시 로그만 출력
    // 앱을 닫았다 열면 자동으로 새 버전 적용됨
    console.log('🔄 새로운 버전 감지됨 (앱 재시작 시 적용)')
  },
  onOfflineReady() {
    console.log('✅ 앱이 오프라인에서 사용 가능합니다.')
  },
  onRegisteredSW(swScriptUrl, registration) {
    if (!registration) return

    console.log('📝 Service Worker 등록됨:', swScriptUrl)

    // 앱이 포커스될 때마다 업데이트 체크 (1분 간격 제한)
    let visibilityChangeTimeout: NodeJS.Timeout | null = null
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        if (visibilityChangeTimeout) {
          clearTimeout(visibilityChangeTimeout)
        }

        visibilityChangeTimeout = setTimeout(() => {
          const now = Date.now()
          const timeSinceLastCheck = now - lastUpdateCheckTime

          if (timeSinceLastCheck >= UPDATE_CHECK_INTERVAL) {
            console.log('👁️ 앱 포커스됨: 업데이트 체크')
            lastUpdateCheckTime = now
            registration.update()
          }
        }, 100)
      }
    })
  },
})

createRoot(document.getElementById('root')!).render(
  <BrowserRouter>
    <App />
  </BrowserRouter>,
)
