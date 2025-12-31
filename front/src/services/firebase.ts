// src/services/firebase.ts
import { initializeApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  setPersistence,
  browserLocalPersistence,
  onAuthStateChanged,
} from "firebase/auth";
import type { User } from "firebase/auth";
import { getTimestamp } from "../utils/dateUtils";

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export auth instance and provider for use in other components
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Set persistence to LOCAL (브라우저 종료해도 로그인 상태 유지)
setPersistence(auth, browserLocalPersistence).catch((error) => {
  console.error("❌ Firebase persistence 설정 실패:", error);
});

// 자동 로그인 유효 기간 (일 단위, 환경변수에서 가져오기)
const AUTO_LOGIN_DAYS = Number(import.meta.env.VITE_AUTO_LOGIN_DAYS) || 30;
// 자동 로그인 비활성화 시 유효 기간 (시간 단위)
const SHORT_LOGIN_HOURS = 1;

/**
 * 로그인 세션 만료 시간 설정
 * @param autoLoginEnabled - true: 슬라이딩 윈도우 30일, false: 절대 1시간
 */
export const setLoginExpiry = (autoLoginEnabled: boolean = true) => {
  const expiryDate = new Date();
  const now = getTimestamp();

  if (autoLoginEnabled) {
    // 슬라이딩 윈도우 방식: 접속 시마다 30일 연장
    expiryDate.setDate(expiryDate.getDate() + AUTO_LOGIN_DAYS);
    localStorage.setItem("login_expiry", expiryDate.toISOString());
    const expiryStr = expiryDate.toLocaleString("ko-KR", {
      timeZone: "Asia/Seoul",
    });
    console.log(
      `✅ [${now}] 로그인 만료 시간 설정 (슬라이딩 30일): ${expiryStr}`
    );
  } else {
    // 절대 만료 방식: 최초 로그인 시각 기준 1시간 고정
    expiryDate.setHours(expiryDate.getHours() + SHORT_LOGIN_HOURS);
    localStorage.setItem("login_expiry", expiryDate.toISOString());
    const expiryStr = expiryDate.toLocaleString("ko-KR", {
      timeZone: "Asia/Seoul",
    });
    console.log(`✅ [${now}] 로그인 만료 시간 설정 (절대 1시간): ${expiryStr}`);
  }
};

/**
 * 로그인 세션이 만료되었는지 체크
 * @returns true: 만료됨, false: 유효함
 */
export const isLoginExpired = (): boolean => {
  const expiryStr = localStorage.getItem("login_expiry");
  if (!expiryStr) {
    // login_expiry가 없으면 만료된 것으로 간주하지 않음
    // (새로 로그인한 경우일 수 있으므로 호출하는 쪽에서 처리)
    return false;
  }

  const expiryDate = new Date(expiryStr);
  const now = new Date();
  const nowStr = getTimestamp();
  const expiryStrFormatted = expiryDate.toLocaleString("ko-KR", {
    timeZone: "Asia/Seoul",
  });

  if (now > expiryDate) {
    console.warn(
      `⏰ [${nowStr}] 로그인 세션 만료: 만료 시간(${expiryStrFormatted}) < 현재(${nowStr})`
    );
    return true;
  }

  return false;
};

/**
 * 로그인 세션 정보 클리어
 */
export const clearLoginSession = () => {
  const now = getTimestamp();
  localStorage.removeItem("firebase_token");
  localStorage.removeItem("firebase_uid");
  localStorage.removeItem("user_id");
  localStorage.removeItem("user_name");
  localStorage.removeItem("user_email");
  localStorage.removeItem("user_image_url");
  localStorage.removeItem("login_expiry");
  localStorage.removeItem("token_last_refresh");
  console.log(`🧹 [${now}] 로그인 세션 클리어`);
};

/**
 * Firebase 인증 상태 변화 감지 및 자동 토큰 갱신
 * 앱 시작 시 한 번만 호출하면 됩니다 (App.tsx에서 호출)
 */
export const setupAuthListener = (
  onTokenRefresh?: (token: string) => void
): (() => void) => {
  onAuthStateChanged(auth, async (user: User | null) => {
    const now = getTimestamp();
    if (user) {
      // login_expiry가 없으면 새로 로그인한 것으로 간주하고 만료 체크 건너뛰기
      const loginExpiryStr = localStorage.getItem("login_expiry");
      const isNewLogin = !loginExpiryStr;

      // 세션 만료 체크 (login_expiry가 있을 때만)
      // 단, 자동 로그인이 활성화되어 있으면 토큰 갱신으로 만료 시간을 연장할 수 있으므로
      // 만료 체크를 건너뛰고 토큰 갱신을 먼저 시도
      const autoLoginEnabled =
        localStorage.getItem("auto_login_enabled") === "true";

      if (!isNewLogin && !autoLoginEnabled && isLoginExpired()) {
        console.warn(`⏰ [${now}] 로그인 세션 만료 감지 → 자동 로그아웃`);
        await handleSessionExpiry();
        return;
      }

      // 사용자가 로그인된 상태
      try {
        // forceRefresh=true로 항상 최신 토큰 가져오기
        const idToken = await user.getIdToken(true);

        // localStorage 업데이트
        localStorage.setItem("firebase_token", idToken);
        localStorage.setItem("firebase_uid", user.uid);

        // 토큰 갱신 시간 저장 (디버깅용)
        const refreshTime = getTimestamp();
        localStorage.setItem("token_last_refresh", refreshTime);

        // 토큰 만료 시간 계산 (Firebase 토큰은 1시간 유효)
        const tokenExpiry = new Date();
        tokenExpiry.setHours(tokenExpiry.getHours() + 1);
        const tokenExpiryStr = tokenExpiry.toLocaleString("ko-KR", {
          timeZone: "Asia/Seoul",
        });

        // 자동 로그인 설정 확인
        const autoLoginEnabled =
          localStorage.getItem("auto_login_enabled") === "true";

        // 새로 로그인한 경우 또는 자동 로그인 활성화 시 만료 시간 설정/갱신
        if (isNewLogin || autoLoginEnabled) {
          setLoginExpiry(autoLoginEnabled);
          const updatedLoginExpiryStr = localStorage.getItem("login_expiry");
          const loginExpiry = updatedLoginExpiryStr
            ? new Date(updatedLoginExpiryStr).toLocaleString("ko-KR", {
                timeZone: "Asia/Seoul",
              })
            : "N/A";
          console.log(
            `✅ [${refreshTime}] Firebase 토큰 자동 갱신${
              isNewLogin ? " (신규 로그인)" : " + 만료 시간 연장"
            }`
          );
          console.log(`   → 토큰 만료 예상: ${tokenExpiryStr} (약 1시간 후)`);
          console.log(
            `   → 로그인 세션 만료: ${loginExpiry} (${
              autoLoginEnabled ? "30일" : "1시간"
            } 후)`
          );
        } else {
          const loginExpiry = loginExpiryStr
            ? new Date(loginExpiryStr).toLocaleString("ko-KR", {
                timeZone: "Asia/Seoul",
              })
            : "N/A";
          console.log(
            `✅ [${refreshTime}] Firebase 토큰 자동 갱신 (만료 시간 유지)`
          );
          console.log(`   → 토큰 만료 예상: ${tokenExpiryStr} (약 1시간 후)`);
          console.log(`   → 로그인 세션 만료: ${loginExpiry}`);
        }

        // 콜백이 있으면 실행 (필요시 axiosInstance 헤더 업데이트 등)
        if (onTokenRefresh) {
          onTokenRefresh(idToken);
        }
      } catch (error) {
        console.error(`❌ [${now}] 토큰 갱신 실패:`, error);
      }
    } else {
      // 로그아웃 상태
      console.log(`ℹ️ [${now}] Firebase 로그아웃 상태`);
    }
  });

  // 토큰 갱신 함수 (재사용)
  const refreshToken = async () => {
    const now = getTimestamp();

    // 먼저 사용자 확인 (Firebase 인증 상태가 아직 설정되지 않았을 수 있음)
    const user = auth.currentUser;
    if (!user) {
      // 사용자가 없으면 토큰 갱신 불가
      // 하지만 페이지 새로고침 직후일 수 있으므로 조용히 반환
      console.log(
        `ℹ️ [${now}] 토큰 갱신 시도했으나 사용자 없음 (인증 상태 확인 중일 수 있음)`
      );
      return;
    }

    // 사용자가 있으면 세션 만료 체크
    // 단, 토큰 갱신이 성공하면 만료 시간을 연장할 수 있으므로
    // 자동 로그인이 활성화되어 있으면 만료 체크를 건너뛰고 토큰 갱신 시도
    const autoLoginEnabled =
      localStorage.getItem("auto_login_enabled") === "true";

    if (!autoLoginEnabled && isLoginExpired()) {
      console.warn(
        `⏰ [${now}] 로그인 세션 만료 감지 (자동 갱신 중) → 로그아웃`
      );
      await handleSessionExpiry();
      return;
    }

    // 사용자가 있고 세션이 유효하면 토큰 갱신 시도
    try {
      const idToken = await user.getIdToken(true);
      localStorage.setItem("firebase_token", idToken);

      // 토큰 갱신 시간 저장 (디버깅용)
      const refreshTime = getTimestamp();
      localStorage.setItem("token_last_refresh", refreshTime);

      // 토큰 만료 시간 계산 (Firebase 토큰은 1시간 유효)
      const tokenExpiry = new Date();
      tokenExpiry.setHours(tokenExpiry.getHours() + 1);
      const tokenExpiryStr = tokenExpiry.toLocaleString("ko-KR", {
        timeZone: "Asia/Seoul",
      });

      // 슬라이딩 윈도우: 자동 로그인 활성화 시 만료 시간도 갱신
      if (autoLoginEnabled) {
        setLoginExpiry(true);
        const loginExpiryStr = localStorage.getItem("login_expiry");
        const loginExpiry = loginExpiryStr
          ? new Date(loginExpiryStr).toLocaleString("ko-KR", {
              timeZone: "Asia/Seoul",
            })
          : "N/A";
        console.log(
          `🔄 [${refreshTime}] Firebase 토큰 자동 갱신 + 만료 시간 연장`
        );
        console.log(`   → 토큰 만료 예상: ${tokenExpiryStr} (약 1시간 후)`);
        console.log(`   → 로그인 세션 만료: ${loginExpiry} (30일 후)`);
      } else {
        // 자동 로그인이 비활성화되어 있으면 만료 시간은 유지
        // 하지만 토큰 갱신은 성공했으므로 세션은 유지됨
        const loginExpiryStr = localStorage.getItem("login_expiry");
        const loginExpiry = loginExpiryStr
          ? new Date(loginExpiryStr).toLocaleString("ko-KR", {
              timeZone: "Asia/Seoul",
            })
          : "N/A";
        console.log(
          `🔄 [${refreshTime}] Firebase 토큰 자동 갱신 (만료 시간 유지)`
        );
        console.log(`   → 토큰 만료 예상: ${tokenExpiryStr} (약 1시간 후)`);
        console.log(`   → 로그인 세션 만료: ${loginExpiry}`);
      }

      if (onTokenRefresh) {
        onTokenRefresh(idToken);
      }
    } catch (error) {
      console.error(`❌ [${now}] 토큰 자동 갱신 실패:`, error);
    }
  };

  // 토큰 자동 갱신 (50분마다 - 더 짧은 주기로 변경)
  const intervalId = setInterval(() => {
    const now = getTimestamp();
    console.log(`⏰ [${now}] 정기 토큰 갱신 (50분 주기) → 갱신 시도`);
    refreshToken();
  }, 50 * 60 * 1000); // 50분

  // 탭이 활성화될 때 토큰 갱신 (visibility API)
  const handleVisibilityChange = () => {
    if (!document.hidden) {
      const now = getTimestamp();
      console.log(`👁️ [${now}] 탭 활성화 감지 → 토큰 갱신 시도`);
      // 탭이 다시 활성화되면 토큰 갱신
      refreshToken();
    }
  };
  document.addEventListener("visibilitychange", handleVisibilityChange);

  // 사용자 활동 감지 (클릭, 스크롤 등) - 마지막 활동 후 지정된 시간 경과 시 토큰 갱신
  let lastActivityTime = Date.now();

  const updateActivityTime = () => {
    lastActivityTime = Date.now();
  };

  // 사용자 활동 이벤트 리스너
  const events = [
    "mousedown",
    "mousemove",
    "keypress",
    "scroll",
    "touchstart",
    "click",
  ];
  events.forEach((event) => {
    document.addEventListener(event, updateActivityTime, { passive: true });
  });

  // 활동 체크 (5분마다)
  const activityCheckInterval = setInterval(() => {
    const timeSinceLastActivity = Date.now() - lastActivityTime;
    const minutesSinceActivity = Math.floor(timeSinceLastActivity / 60000);
    // 마지막 활동 후 50분이 지났고, 탭이 활성화되어 있으면 토큰 갱신
    if (timeSinceLastActivity >= 50 * 60 * 1000 && !document.hidden) {
      const now = getTimestamp();
      console.log(
        `⏱️ [${now}] 사용자 활동 없음 ${minutesSinceActivity}분 경과 → 토큰 갱신 시도`
      );
      refreshToken();
    }
  }, 5 * 60 * 1000); // 5분마다 체크

  // 정리 함수 반환 (필요시)
  return () => {
    clearInterval(intervalId);
    clearInterval(activityCheckInterval);
    document.removeEventListener("visibilitychange", handleVisibilityChange);
    events.forEach((event) => {
      document.removeEventListener(event, updateActivityTime);
    });
  };
};

// Google 로그인 함수 (user 정보도 함께 반환)
export const signInWithGooglePopup = async (): Promise<{
  user: User;
  idToken: string;
} | null> => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const idToken = await result.user.getIdToken();
    return {
      user: result.user,
      idToken: idToken,
    };
  } catch (error) {
    console.error("Authentication failed:", error);
    alert("Error: " + (error as Error).message);
    return null;
  }
};

/**
 * 현재 로그인된 사용자의 최신 토큰 가져오기
 * 로그인 세션 만료 체크도 함께 수행
 */
export const getCurrentToken = async (): Promise<string | null> => {
  const now = getTimestamp();
  // 1. 로그인 세션 만료 체크
  if (isLoginExpired()) {
    console.warn(
      `⏰ [${now}] 로그인 세션 만료됨 (${AUTO_LOGIN_DAYS}일 경과) → 자동 로그아웃`
    );
    await handleSessionExpiry();
    return null;
  }

  // 2. Firebase 사용자 확인
  const user = auth.currentUser;
  if (user) {
    try {
      // 3. 토큰 갱신 (만료 시간은 갱신하지 않음 - 최초 로그인 기준 유지)
      const token = await user.getIdToken(true);
      console.log(`🔑 [${now}] 현재 토큰 가져오기 성공`);
      return token;
    } catch (error) {
      console.error(`❌ [${now}] 토큰 가져오기 실패:`, error);
      return null;
    }
  }
  console.log(`ℹ️ [${now}] 현재 토큰 가져오기 시도했으나 사용자 없음`);
  return null;
};

/**
 * 세션 만료 처리 (Firebase 로그아웃 + localStorage 클리어)
 */
const handleSessionExpiry = async () => {
  const now = getTimestamp();
  try {
    await auth.signOut();
    console.log(`🚪 [${now}] Firebase 로그아웃 완료`);
  } catch (error) {
    console.error(`❌ [${now}] Firebase signOut 실패:`, error);
  }
  clearLoginSession();
};
