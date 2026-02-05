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

// 이전에 localStorage에 남아있던 플래그 정리 (sessionStorage로 전환)
localStorage.removeItem(PROMPT_TRIGGERED_KEY)

const updateSW = registerSW({
  onNeedRefresh() {
    // sessionStorage로 같은 세션 내 중복 표시 방지 (앱 재실행 시 자동 초기화)
    if (sessionStorage.getItem(PROMPT_TRIGGERED_KEY) === 'true') {
      console.log('⏱️ 업데이트 프롬프트 이미 표시됨 → 스킵')
      return
    }

    // 마지막 프롬프트 표시 후 5분 쿨다운
    const lastPromptTime = localStorage.getItem(PROMPT_COOLDOWN_KEY)
    if (lastPromptTime) {
      const timeSinceLastPrompt = Date.now() - parseInt(lastPromptTime, 10)
      if (timeSinceLastPrompt < PROMPT_COOLDOWN_DURATION) {
        console.log(`⏱️ 업데이트 프롬프트 표시 대기 중 (${Math.floor((PROMPT_COOLDOWN_DURATION - timeSinceLastPrompt) / 1000)}초 후 재표시 가능)`)
        return
      }
    }

    // sessionStorage에 플래그 설정 (같은 세션 내 중복 방지, 앱 종료 시 자동 초기화)
    sessionStorage.setItem(PROMPT_TRIGGERED_KEY, 'true')
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
  sessionStorage.removeItem(PROMPT_TRIGGERED_KEY)
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
