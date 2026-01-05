import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { BrowserRouter } from 'react-router-dom'
import { registerSW } from 'virtual:pwa-register'

let needRefreshTriggered = false
let lastUpdateCheckTime = 0
const UPDATE_CHECK_INTERVAL = 60 * 1000 // 1분
const PROMPT_COOLDOWN_KEY = 'pwa_last_prompt_time'
const PROMPT_COOLDOWN_DURATION = 5 * 60 * 1000 // 5분

const updateSW = registerSW({
  onNeedRefresh() {
    // 중복 호출 방지
    if (needRefreshTriggered) return

    // localStorage에서 마지막 프롬프트 표시 시간 확인
    const lastPromptTime = localStorage.getItem(PROMPT_COOLDOWN_KEY)
    if (lastPromptTime) {
      const timeSinceLastPrompt = Date.now() - parseInt(lastPromptTime, 10)
      if (timeSinceLastPrompt < PROMPT_COOLDOWN_DURATION) {
        console.log(`⏱️ 업데이트 프롬프트 표시 대기 중 (${Math.floor((PROMPT_COOLDOWN_DURATION - timeSinceLastPrompt) / 1000)}초 후 재표시 가능)`)
        return
      }
    }

    needRefreshTriggered = true
    localStorage.setItem(PROMPT_COOLDOWN_KEY, Date.now().toString())

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

    // 앱이 포커스될 때마다 업데이트 체크 (1분 간격 제한)
    // - PWA 앱 실행 시
    // - 백그라운드에서 다시 포그라운드로 전환 시
    // - 브라우저 탭 전환 시
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        const now = Date.now()
        const timeSinceLastCheck = now - lastUpdateCheckTime

        if (timeSinceLastCheck >= UPDATE_CHECK_INTERVAL) {
          console.log('👁️ 앱 포커스됨: 업데이트 체크')
          lastUpdateCheckTime = now
          registration.update()
        } else {
          console.log(`👁️ 앱 포커스됨: 업데이트 체크 스킵 (${Math.floor((UPDATE_CHECK_INTERVAL - timeSinceLastCheck) / 1000)}초 후 체크 가능)`)
        }
      }
    })
  },
})

// window 객체에 updateSW 함수 등록 (hook에서 사용)
window.updatePWA = async () => {
  await updateSW(true)
  needRefreshTriggered = false
  // 업데이트 완료 후 쿨다운 리셋
  localStorage.removeItem(PROMPT_COOLDOWN_KEY)
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
