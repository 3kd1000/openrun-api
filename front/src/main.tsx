import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { BrowserRouter } from 'react-router-dom'
import { registerSW } from 'virtual:pwa-register'

let needRefreshTriggered = false

const updateSW = registerSW({
  onNeedRefresh() {
    // 중복 호출 방지
    if (needRefreshTriggered) return
    needRefreshTriggered = true

    console.log('🔄 새로운 버전 감지: 업데이트 프롬프트 표시')

    // React hook으로 상태 전달
    if (window.triggerPWAUpdate) {
      window.triggerPWAUpdate()
    }
  },
  onOfflineReady() {
    console.log('✅ 앱이 오프라인에서 사용 가능합니다.')
  },
  onRegisteredSW(swScriptUrl, registration) {
    if (!registration) return

    console.log('📝 Service Worker 등록됨:', swScriptUrl)

    // 앱이 포커스될 때마다 업데이트 체크
    // - PWA 앱 실행 시
    // - 백그라운드에서 다시 포그라운드로 전환 시
    // - 브라우저 탭 전환 시
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        console.log('👁️ 앱 포커스됨: 업데이트 체크')
        registration.update()
      }
    })
  },
})

// window 객체에 updateSW 함수 등록 (hook에서 사용)
window.updatePWA = async () => {
  await updateSW(true)
  needRefreshTriggered = false
}

// TypeScript를 위한 window 타입 확장
declare global {
  interface Window {
    updatePWA: () => Promise<void>
    triggerPWAUpdate?: () => void
  }
}

createRoot(document.getElementById('root')!).render(
  <BrowserRouter>
    <App />
  </BrowserRouter>,
)
