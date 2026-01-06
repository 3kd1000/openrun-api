import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { BrowserRouter } from 'react-router-dom'
import { registerSW } from 'virtual:pwa-register'

let lastUpdateCheckTime = 0
const UPDATE_CHECK_INTERVAL = 60 * 1000 // 1분
const PROMPT_TRIGGERED_KEY = 'pwa_prompt_triggered'
const PROMPT_COOLDOWN_KEY = 'pwa_last_prompt_time'
const PROMPT_COOLDOWN_DURATION = 5 * 60 * 1000 // 5분

const updateSW = registerSW({
  onNeedRefresh() {
    // localStorage에서 중복 호출 방지 플래그 확인 (페이지 새로고침에도 유지)
    const promptTriggered = localStorage.getItem(PROMPT_TRIGGERED_KEY)
    if (promptTriggered === 'true') {
      console.log('⏱️ 업데이트 프롬프트 이미 표시됨 → 스킵')
      return
    }

    // localStorage에서 마지막 프롬프트 표시 시간 확인
    const lastPromptTime = localStorage.getItem(PROMPT_COOLDOWN_KEY)
    if (lastPromptTime) {
      const timeSinceLastPrompt = Date.now() - parseInt(lastPromptTime, 10)
      if (timeSinceLastPrompt < PROMPT_COOLDOWN_DURATION) {
        console.log(`⏱️ 업데이트 프롬프트 표시 대기 중 (${Math.floor((PROMPT_COOLDOWN_DURATION - timeSinceLastPrompt) / 1000)}초 후 재표시 가능)`)
        return
      }
    }

    // localStorage에 플래그 설정 (페이지 새로고침에도 유지)
    localStorage.setItem(PROMPT_TRIGGERED_KEY, 'true')
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
    let visibilityChangeTimeout: NodeJS.Timeout | null = null
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        // debounce: 100ms 내에 여러 번 호출되면 마지막 호출만 실행
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
          } else {
            console.log(`👁️ 앱 포커스됨: 업데이트 체크 스킵 (${Math.floor((UPDATE_CHECK_INTERVAL - timeSinceLastCheck) / 1000)}초 후 체크 가능)`)
          }
        }, 100)
      }
    })
  },
})

// window 객체에 updateSW 함수 등록 (hook에서 사용)
window.updatePWA = async () => {
  await updateSW(true)
  // 업데이트 완료 후 플래그 및 쿨다운 리셋
  localStorage.removeItem(PROMPT_TRIGGERED_KEY)
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
