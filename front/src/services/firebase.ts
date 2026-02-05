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
import {
  getOpenRunSession,
  setOpenRunSession,
} from "../utils/openrunSession";

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
export const app = initializeApp(firebaseConfig);

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
  localStorage.removeItem("openrun_session_v1");
  localStorage.removeItem("login_expiry");
  console.log(`🧹 [${now}] 로그인 세션 클리어`);
};

/**
 * 앱 시작 시 세션 복원 (PWA 재시작 시 Firebase 토큰이 만료되어도 자동 갱신)
 * localStorage의 expiry를 확인하고, 아직 만료되지 않았으면 Firebase 토큰을 갱신
 * PWA 앱 재시작 시 Firebase 인증 상태가 복원되기까지 최대 3초 대기
 */
export const restoreSessionIfValid = async (): Promise<boolean> => {
  const now = getTimestamp();
  const loginExpiryStr = localStorage.getItem("login_expiry");
  const autoLoginEnabled = getOpenRunSession().autoLoginEnabled ?? false;

  // login_expiry가 없으면 복원할 세션이 없음
  if (!loginExpiryStr) {
    console.log(`ℹ️ [${now}] 복원할 세션 없음 (login_expiry 없음)`);
    return false;
  }

  // 세션이 만료되었는지 확인
  if (isLoginExpired()) {
    console.log(`⏰ [${now}] 세션 만료됨 → 복원 불가`);
    return false;
  }

  // 자동 로그인이 활성화되어 있지 않으면 복원하지 않음
  if (!autoLoginEnabled) {
    console.log(`ℹ️ [${now}] 자동 로그인 비활성화 → 복원 불가`);
    return false;
  }

  // Firebase 인증 상태가 복원될 때까지 대기 (PWA 재시작 시)
  // 최대 3초까지 대기, 100ms 간격으로 체크
  let user = auth.currentUser;
  let waitCount = 0;
  const maxWaitCount = 30; // 3초 (30 * 100ms)

  while (!user && waitCount < maxWaitCount) {
    await new Promise((resolve) => setTimeout(resolve, 100));
    user = auth.currentUser;
    waitCount++;
  }

  if (!user) {
    console.log(
      `ℹ️ [${now}] Firebase 사용자 없음 (인증 상태 복원 실패) → 복원 불가`
    );
    return false;
  }

  // 세션이 유효하고 사용자가 있으면 토큰 갱신 시도 (최대 3회 재시도)
  let retryCount = 0;
  const maxRetries = 3;

  while (retryCount < maxRetries) {
    try {
      console.log(
        `🔄 [${now}] 세션 복원 시도 (토큰 갱신) - 시도 ${
          retryCount + 1
        }/${maxRetries}`
      );
      const idToken = await user.getIdToken(true);

      // 세션 업데이트
      const refreshTime = getTimestamp();
      setOpenRunSession({
        firebaseToken: idToken,
        firebaseUid: user.uid,
        tokenLastRefresh: refreshTime,
      });

      // 만료 시간 연장 (자동 로그인 활성화 시)
      setLoginExpiry(true);

      console.log(`✅ [${refreshTime}] 세션 복원 성공 (토큰 갱신 완료)`);
      return true;
    } catch (error) {
      retryCount++;
      if (retryCount < maxRetries) {
        const waitTime = retryCount * 500; // 500ms, 1000ms, 1500ms
        console.warn(
          `⚠️ [${now}] 세션 복원 실패 (시도 ${retryCount}/${maxRetries}), ${waitTime}ms 후 재시도...`,
          error
        );
        await new Promise((resolve) => setTimeout(resolve, waitTime));
        // 사용자 재확인 (재시도 전에 다시 확인)
        user = auth.currentUser;
        if (!user) {
          console.error(`❌ [${now}] 재시도 중 사용자 없음 → 복원 실패`);
          return false;
        }
      } else {
        console.error(
          `❌ [${now}] 세션 복원 실패 (최대 재시도 횟수 초과):`,
          error
        );
        return false;
      }
    }
  }

  return false;
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
      const autoLoginEnabled = getOpenRunSession().autoLoginEnabled ?? false;

      if (!isNewLogin && !autoLoginEnabled && isLoginExpired()) {
        console.warn(`⏰ [${now}] 로그인 세션 만료 감지 → 자동 로그아웃`);
        await handleSessionExpiry();
        return;
      }

      // 사용자가 로그인된 상태
      // 토큰 갱신 시도 (최대 3회 재시도)
      let retryCount = 0;
      const maxRetries = 3;
      let tokenRefreshSuccess = false;

      while (retryCount < maxRetries && !tokenRefreshSuccess) {
        try {
          // forceRefresh=true로 항상 최신 토큰 가져오기
          const idToken = await user.getIdToken(true);

          // 세션 업데이트
          const refreshTime = getTimestamp();
          setOpenRunSession({
            firebaseToken: idToken,
            firebaseUid: user.uid,
            tokenLastRefresh: refreshTime,
          });

          // 토큰 만료 시간 계산 (Firebase 토큰은 1시간 유효)
          const tokenExpiry = new Date();
          tokenExpiry.setHours(tokenExpiry.getHours() + 1);
          const tokenExpiryStr = tokenExpiry.toLocaleString("ko-KR", {
            timeZone: "Asia/Seoul",
          });

          // 자동 로그인 설정 확인
          const autoLoginEnabled = getOpenRunSession().autoLoginEnabled ?? false;

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

          tokenRefreshSuccess = true;
        } catch (error) {
          retryCount++;
          if (retryCount < maxRetries) {
            const waitTime = retryCount * 500; // 500ms, 1000ms, 1500ms
            console.warn(
              `⚠️ [${now}] 토큰 갱신 실패 (시도 ${retryCount}/${maxRetries}), ${waitTime}ms 후 재시도...`,
              error
            );
            await new Promise((resolve) => setTimeout(resolve, waitTime));
            // 재시도 전에 사용자 재확인
            user = auth.currentUser;
            if (!user) {
              console.error(
                `❌ [${now}] 재시도 중 사용자 없음 → 토큰 갱신 중단`
              );
              break;
            }
          } else {
            console.error(
              `❌ [${now}] 토큰 갱신 실패 (최대 재시도 횟수 초과):`,
              error
            );
          }
        }
      }
    } else {
      // 로그아웃 상태
      console.log(`ℹ️ [${now}] Firebase 로그아웃 상태`);
    }
  });

  // 토큰 갱신 함수 (재사용, 재시도 로직 포함)
  const refreshToken = async () => {
    const now = getTimestamp();

    // 먼저 사용자 확인 (Firebase 인증 상태가 아직 설정되지 않았을 수 있음)
    let user = auth.currentUser;
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
    const autoLoginEnabled = getOpenRunSession().autoLoginEnabled ?? false;

    if (!autoLoginEnabled && isLoginExpired()) {
      console.warn(
        `⏰ [${now}] 로그인 세션 만료 감지 (자동 갱신 중) → 로그아웃`
      );
      await handleSessionExpiry();
      return;
    }

    // 사용자가 있고 세션이 유효하면 토큰 갱신 시도 (최대 3회 재시도)
    let retryCount = 0;
    const maxRetries = 3;

    while (retryCount < maxRetries) {
      try {
        // 재시도 전에 사용자 재확인
        user = auth.currentUser;
        if (!user) {
          console.warn(`⚠️ [${now}] 재시도 중 사용자 없음 → 토큰 갱신 중단`);
          return;
        }

        const idToken = await user.getIdToken(true);

        // 세션 업데이트
        const refreshTime = getTimestamp();
        setOpenRunSession({
          firebaseToken: idToken,
          firebaseUid: user.uid,
          tokenLastRefresh: refreshTime,
        });

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

        // 성공하면 반환
        return;
      } catch (error) {
        retryCount++;
        if (retryCount < maxRetries) {
          const waitTime = retryCount * 500; // 500ms, 1000ms, 1500ms
          console.warn(
            `⚠️ [${now}] 토큰 자동 갱신 실패 (시도 ${retryCount}/${maxRetries}), ${waitTime}ms 후 재시도...`,
            error
          );
          await new Promise((resolve) => setTimeout(resolve, waitTime));
        } else {
          console.error(
            `❌ [${now}] 토큰 자동 갱신 실패 (최대 재시도 횟수 초과):`,
            error
          );
        }
      }
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
 * Firebase 토큰 유효성 검증
 * auth.currentUser 존재 여부와 토큰의 실제 만료 시간 확인
 * @returns true: 토큰 유효, false: 토큰 무효 또는 사용자 없음
 */
export const isTokenValid = async (): Promise<boolean> => {
  const user = auth.currentUser;
  if (!user) {
    return false;
  }

  try {
    // 토큰 정보 가져오기 (만료 시간 포함)
    const tokenResult = await user.getIdTokenResult(false);

    // 토큰 만료 시간 확인
    const expirationTime = new Date(tokenResult.expirationTime).getTime();
    const now = Date.now();
    const timeUntilExpiry = expirationTime - now;

    // 안전 마진: 만료 시간이 5분 이내면 false 반환
    const safetyMargin = 5 * 60 * 1000; // 5분

    if (timeUntilExpiry < safetyMargin) {
      const minutesLeft = Math.floor(timeUntilExpiry / 60000);
      console.warn(`⚠️ 토큰 만료 임박 (${minutesLeft}분 남음) → 유효하지 않음으로 처리`);
      return false;
    }

    return true;
  } catch (error) {
    console.error("토큰 유효성 검증 실패:", error);
    return false;
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
