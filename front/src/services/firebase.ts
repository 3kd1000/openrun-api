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
const AUTO_LOGIN_DAYS = Number(import.meta.env.VITE_AUTO_LOGIN_DAYS) || 7;

/**
 * 로그인 세션 만료 시간 계산 및 저장
 * @param isNewLogin 새로운 로그인인지 여부 (true면 만료시간 새로 생성, false면 기존 유지)
 */
export const setLoginExpiry = (isNewLogin: boolean = true) => {
  if (isNewLogin) {
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + AUTO_LOGIN_DAYS);
    localStorage.setItem("login_expiry", expiryDate.toISOString());
    console.log(
      `✅ 로그인 만료 시간 설정: ${expiryDate.toLocaleString()} (${AUTO_LOGIN_DAYS}일 후)`
    );
  }
};

/**
 * 로그인 세션이 만료되었는지 체크
 * @returns true: 만료됨, false: 유효함
 */
export const isLoginExpired = (): boolean => {
  const expiryStr = localStorage.getItem("login_expiry");
  if (!expiryStr) {
    return true; // 만료 시간이 없으면 만료된 것으로 간주
  }

  const expiryDate = new Date(expiryStr);
  const now = new Date();

  if (now > expiryDate) {
    console.warn(
      `⏰ 로그인 세션 만료: ${expiryDate.toLocaleString()} < 현재 ${now.toLocaleString()}`
    );
    return true;
  }

  return false;
};

/**
 * 로그인 세션 정보 클리어
 */
export const clearLoginSession = () => {
  localStorage.removeItem("firebase_token");
  localStorage.removeItem("firebase_uid");
  localStorage.removeItem("user_id");
  localStorage.removeItem("user_name");
  localStorage.removeItem("user_email");
  localStorage.removeItem("user_image_url");
  localStorage.removeItem("login_expiry");
  console.log("🧹 로그인 세션 클리어");
};

/**
 * Firebase 인증 상태 변화 감지 및 자동 토큰 갱신
 * 앱 시작 시 한 번만 호출하면 됩니다 (App.tsx에서 호출)
 */
export const setupAuthListener = (onTokenRefresh?: (token: string) => void) => {
  onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      // 세션 만료 체크
      if (isLoginExpired()) {
        console.warn(`⏰ 로그인 세션 만료 감지 → 자동 로그아웃`);
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

        console.log("✅ Firebase 토큰 자동 갱신:", user.email);

        // 콜백이 있으면 실행 (필요시 axiosInstance 헤더 업데이트 등)
        if (onTokenRefresh) {
          onTokenRefresh(idToken);
        }
      } catch (error) {
        console.error("❌ 토큰 갱신 실패:", error);
      }
    } else {
      // 로그아웃 상태
      console.log("ℹ️ Firebase 로그아웃 상태");
    }
  });

  // 토큰 자동 갱신 (55분마다 - 만료 5분 전)
  setInterval(async () => {
    // 세션 만료 체크
    if (isLoginExpired()) {
      console.warn(`⏰ 로그인 세션 만료 감지 (자동 갱신 중) → 로그아웃`);
      await handleSessionExpiry();
      return;
    }

    const user = auth.currentUser;
    if (user) {
      try {
        const idToken = await user.getIdToken(true);
        localStorage.setItem("firebase_token", idToken);
        console.log("🔄 Firebase 토큰 자동 갱신 (55분 주기)");

        if (onTokenRefresh) {
          onTokenRefresh(idToken);
        }
      } catch (error) {
        console.error("❌ 토큰 자동 갱신 실패:", error);
      }
    }
  }, 55 * 60 * 1000); // 55분
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
  // 1. 로그인 세션 만료 체크
  if (isLoginExpired()) {
    console.warn(
      `⏰ 로그인 세션 만료됨 (${AUTO_LOGIN_DAYS}일 경과) → 자동 로그아웃`
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
      return token;
    } catch (error) {
      console.error("❌ 토큰 가져오기 실패:", error);
      return null;
    }
  }
  return null;
};

/**
 * 세션 만료 처리 (Firebase 로그아웃 + localStorage 클리어)
 */
const handleSessionExpiry = async () => {
  try {
    await auth.signOut();
  } catch (error) {
    console.error("❌ Firebase signOut 실패:", error);
  }
  clearLoginSession();
};
