/* eslint-disable react-refresh/only-export-components */
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
  useCallback,
} from "react";
import type { User } from "firebase/auth";
import {
  auth,
  clearLoginSession,
  setLoginExpiry,
  isLoginExpired,
  restoreSessionIfValid,
} from "../services/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { getTimestamp } from "../utils/dateUtils";
import {
  getOpenRunSession,
  setOpenRunSession,
  getAutoLoginEnabled,
} from "../utils/openrunSession";
import { authBridge } from "../services/authBridge";
import { getCurrentUser } from "../services/api/userApi";

interface AuthContextType {
  isAuthReady: boolean; // Firebase 인증 상태 복원 완료 여부
  isTokenRefreshing: boolean; // 현재 토큰 갱신 중 여부
  user: User | null; // 현재 Firebase User
  refreshToken: () => Promise<void>; // 수동 토큰 갱신
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [isTokenRefreshing, setIsTokenRefreshing] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const activityCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityTimeRef = useRef(Date.now());

  // useRef로 최신 값 참조 (클로저 이슈 해결)
  const isTokenRefreshingRef = useRef(false);
  // refreshToken의 resolve를 외부에서 호출하기 위한 ref
  const resolveRefreshRef = useRef<(() => void) | null>(null);

  // state + ref + authBridge 동시 업데이트 헬퍼
  const updateTokenRefreshing = useCallback(
    (value: boolean, promise?: Promise<void>) => {
      setIsTokenRefreshing(value);
      isTokenRefreshingRef.current = value;
      if (value && promise) {
        authBridge.setRefreshing(promise);
      } else if (!value) {
        authBridge.clearRefreshing();
      }
    },
    []
  );

  /**
   * 세션에 userId가 없으면 /users/me API로 복원
   * 토큰 갱신 후 호출되어, clearLoginSession 이후에도 userId를 자동 복구
   */
  const restoreUserInfoIfNeeded = async () => {
    const session = getOpenRunSession();
    if (session.userId) return; // 이미 있으면 스킵

    const now = getTimestamp();
    try {
      console.log(`🔄 [${now}] 세션에 userId 없음 → /users/me API로 복원 시도`);
      const userInfo = await getCurrentUser();
      setOpenRunSession({
        userId: userInfo.id,
        userName: userInfo.name,
        userEmail: userInfo.email,
        userImageUrl: userInfo.imageUrl,
      });
      console.log(
        `✅ [${now}] userId 복원 완료: ${userInfo.id} (${userInfo.name})`
      );
    } catch (error) {
      console.warn(`⚠️ [${now}] userId 복원 실패 (계속 진행):`, error);
    }
  };

  // 토큰 갱신 함수 (재사용 가능)
  const refreshToken = async () => {
    const now = getTimestamp();

    // useRef로 최신 값 체크 (클로저 이슈 해결)
    if (isTokenRefreshingRef.current) {
      console.log(`ℹ️ [${now}] 토큰 갱신 이미 진행 중 → 스킵`);
      return;
    }

    let currentUser = auth.currentUser;
    if (!currentUser) {
      console.log(`ℹ️ [${now}] 토큰 갱신 시도했으나 사용자 없음`);
      return;
    }

    const autoLoginEnabled = getAutoLoginEnabled();

    // 자동 로그인 비활성화 시에만 세션 만료 체크
    if (!autoLoginEnabled && isLoginExpired()) {
      console.warn(`⏰ [${now}] 로그인 세션 만료 감지 (자동 로그인 비활성화) → 로그아웃`);
      await handleSessionExpiry();
      return;
    }

    // Promise를 생성하여 authBridge에 등록 (외부에서 대기 가능)
    let resolveRefresh: () => void;
    const refreshPromise = new Promise<void>((resolve) => {
      resolveRefresh = resolve;
    });
    resolveRefreshRef.current = resolveRefresh!;

    updateTokenRefreshing(true, refreshPromise);

    // 최대 3회 재시도
    let retryCount = 0;
    const maxRetries = 3;

    try {
      while (retryCount < maxRetries) {
        try {
          currentUser = auth.currentUser;
          if (!currentUser) {
            console.warn(`⚠️ [${now}] 재시도 중 사용자 없음 → 토큰 갱신 중단`);
            return;
          }

          const idToken = await currentUser.getIdToken(true);
          setOpenRunSession({
            firebaseToken: idToken,
            firebaseUid: currentUser.uid,
            tokenLastRefresh: getTimestamp(),
          });

          const refreshTime = getTimestamp();

          // 토큰 만료 시간 계산
          const tokenExpiry = new Date();
          tokenExpiry.setHours(tokenExpiry.getHours() + 1);
          const tokenExpiryStr = tokenExpiry.toLocaleString("ko-KR", {
            timeZone: "Asia/Seoul",
          });

          // 토큰 갱신 성공 시 항상 30일로 연장 (세션 유지 개선)
          setLoginExpiry(true);
          const loginExpiryStr = localStorage.getItem("login_expiry");
          const loginExpiry = loginExpiryStr
            ? new Date(loginExpiryStr).toLocaleString("ko-KR", {
                timeZone: "Asia/Seoul",
              })
            : "N/A";
          console.log(
            `🔄 [${refreshTime}] Firebase 토큰 자동 갱신 + 세션 연장`
          );
          console.log(`   → 토큰 만료 예상: ${tokenExpiryStr} (약 1시간 후)`);
          console.log(`   → 로그인 세션 만료: ${loginExpiry} (30일 후)`);

          return;
        } catch (error) {
          retryCount++;
          if (retryCount < maxRetries) {
            const waitTime = retryCount * 500;
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
    } finally {
      // 성공/실패 모두 갱신 상태 해제 + 대기 중인 요청 해제
      updateTokenRefreshing(false);
      resolveRefresh!();
    }
  };

  // 세션 만료 처리
  const handleSessionExpiry = async () => {
    const now = getTimestamp();
    try {
      await auth.signOut();
      console.log(`🚪 [${now}] Firebase 로그아웃 완료`);
    } catch (error) {
      console.error(`❌ [${now}] Firebase signOut 실패:`, error);
    }
    clearLoginSession();
    setUser(null);
  };

  // Firebase 인증 상태 변화 감지 및 초기 세션 복원
  useEffect(() => {
    const now = getTimestamp();
    console.log(`🔧 [${now}] Firebase 인증 리스너 설정`);

    const unsubscribe = onAuthStateChanged(
      auth,
      async (firebaseUser: User | null) => {
        const timestamp = getTimestamp();

        if (firebaseUser) {
          const loginExpiryStr = localStorage.getItem("login_expiry");
          const isNewLogin = !loginExpiryStr;
          const autoLoginEnabled = getAutoLoginEnabled();

          // 자동 로그인 비활성화 시에만 세션 만료 체크
          if (!isNewLogin && !autoLoginEnabled && isLoginExpired()) {
            console.warn(
              `⏰ [${timestamp}] 로그인 세션 만료 감지 → 자동 로그아웃`
            );
            await handleSessionExpiry();
            setIsAuthReady(true);
            return;
          }

          setUser(firebaseUser);

          // 토큰 갱신 (중복 방지 - useRef로 최신 값 체크)
          if (!isTokenRefreshingRef.current) {
            // Promise를 생성하여 authBridge에 등록
            let resolveRefresh: () => void;
            const refreshPromise = new Promise<void>((resolve) => {
              resolveRefresh = resolve;
            });
            resolveRefreshRef.current = resolveRefresh!;

            updateTokenRefreshing(true, refreshPromise);

            let retryCount = 0;
            const maxRetries = 3;
            let tokenRefreshSuccess = false;

            try {
              while (retryCount < maxRetries && !tokenRefreshSuccess) {
                try {
                  const idToken = await firebaseUser.getIdToken(true);
                  setOpenRunSession({
                    firebaseToken: idToken,
                    firebaseUid: firebaseUser.uid,
                    tokenLastRefresh: getTimestamp(),
                  });

                  const refreshTime = getTimestamp();

                  const tokenExpiry = new Date();
                  tokenExpiry.setHours(tokenExpiry.getHours() + 1);
                  const tokenExpiryStr = tokenExpiry.toLocaleString("ko-KR", {
                    timeZone: "Asia/Seoul",
                  });

                  // 토큰 갱신 성공 시 항상 30일로 연장 (세션 유지 개선)
                  setLoginExpiry(true);
                  const updatedLoginExpiryStr =
                    localStorage.getItem("login_expiry");
                  const loginExpiry = updatedLoginExpiryStr
                    ? new Date(updatedLoginExpiryStr).toLocaleString("ko-KR", {
                        timeZone: "Asia/Seoul",
                      })
                    : "N/A";
                  console.log(
                    `✅ [${refreshTime}] Firebase 토큰 자동 갱신${
                      isNewLogin ? " (신규 로그인)" : ""
                    } + 세션 연장`
                  );
                  console.log(
                    `   → 토큰 만료 예상: ${tokenExpiryStr} (약 1시간 후)`
                  );
                  console.log(`   → 로그인 세션 만료: ${loginExpiry} (30일 후)`);

                  tokenRefreshSuccess = true;
                } catch (error) {
                  retryCount++;
                  if (retryCount < maxRetries) {
                    const waitTime = retryCount * 500;
                    console.warn(
                      `⚠️ [${timestamp}] 토큰 갱신 실패 (시도 ${retryCount}/${maxRetries}), ${waitTime}ms 후 재시도...`,
                      error
                    );
                    await new Promise((resolve) => setTimeout(resolve, waitTime));
                  } else {
                    console.error(
                      `❌ [${timestamp}] 토큰 갱신 실패 (최대 재시도 횟수 초과):`,
                      error
                    );
                  }
                }
              }
            } finally {
              // 성공/실패 모두 갱신 상태 해제
              updateTokenRefreshing(false);
              resolveRefresh!();
            }

            // 토큰 갱신 실패 시 로그아웃 처리
            if (!tokenRefreshSuccess) {
              console.error(`❌ [${timestamp}] 토큰 갱신 실패 → 로그아웃 처리`);
              await handleSessionExpiry();
              setIsAuthReady(true);
              return;
            }

            // 토큰 갱신 성공 후 userId가 없으면 자동 복원
            await restoreUserInfoIfNeeded();
          }
        } else {
          console.log(`ℹ️ [${timestamp}] Firebase 로그아웃 상태`);

          // 자동 로그인 세션이 유효하면 복원 시도 (앱 리빌드/SW 업데이트 시 IndexedDB 복원 지연 대응)
          const autoLoginEnabled = getAutoLoginEnabled();
          const loginExpiryStr = localStorage.getItem("login_expiry");

          if (autoLoginEnabled && loginExpiryStr && !isLoginExpired()) {
            console.log(`🔄 [${timestamp}] 자동 로그인 세션 유효 → 복원 시도`);
            const restored = await restoreSessionIfValid();

            if (restored && auth.currentUser) {
              console.log(`✅ [${timestamp}] 세션 복원 성공 → 사용자 설정`);
              setUser(auth.currentUser);
              await restoreUserInfoIfNeeded();
            } else {
              console.warn(`⚠️ [${timestamp}] 세션 복원 실패 → 로그아웃 상태 유지`);
              setUser(null);
            }
          } else {
            setUser(null);
          }
        }

        // 인증 상태 복원 완료 표시 (로그인 여부와 무관하게)
        setIsAuthReady(true);
      }
    );

    // 정리 함수
    return () => {
      unsubscribe();
    };
  }, []);

  // 토큰 자동 갱신 설정 (45분마다 - 안전 마진 확보)
  useEffect(() => {
    if (!isAuthReady || !user) return;

    const now = getTimestamp();
    console.log(`⏰ [${now}] 정기 토큰 갱신 타이머 설정 (45분 주기)`);

    refreshIntervalRef.current = setInterval(() => {
      const timestamp = getTimestamp();
      console.log(`⏰ [${timestamp}] 정기 토큰 갱신 (45분 주기) → 갱신 시도`);
      refreshToken();
    }, 45 * 60 * 1000); // 45분 (안전 마진)

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [isAuthReady, user]);

  // 탭 활성화 시 토큰 갱신
  useEffect(() => {
    if (!isAuthReady || !user) return;

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        const now = getTimestamp();
        console.log(`👁️ [${now}] 탭 활성화 감지 → 토큰 갱신 시도`);
        refreshToken();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [isAuthReady, user]);

  // 사용자 활동 감지
  useEffect(() => {
    if (!isAuthReady || !user) return;

    const updateActivityTime = () => {
      lastActivityTimeRef.current = Date.now();
    };

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
    activityCheckIntervalRef.current = setInterval(() => {
      const timeSinceLastActivity = Date.now() - lastActivityTimeRef.current;
      const minutesSinceActivity = Math.floor(timeSinceLastActivity / 60000);

      // 마지막 활동 후 45분이 지났고, 탭이 활성화되어 있으면 토큰 갱신
      if (timeSinceLastActivity >= 45 * 60 * 1000 && !document.hidden) {
        const now = getTimestamp();
        console.log(
          `⏱️ [${now}] 사용자 활동 없음 ${minutesSinceActivity}분 경과 → 토큰 갱신 시도`
        );
        refreshToken();
      }
    }, 5 * 60 * 1000); // 5분마다 체크

    return () => {
      events.forEach((event) => {
        document.removeEventListener(event, updateActivityTime);
      });
      if (activityCheckIntervalRef.current) {
        clearInterval(activityCheckIntervalRef.current);
      }
    };
  }, [isAuthReady, user]);

  return (
    <AuthContext.Provider
      value={{
        isAuthReady,
        isTokenRefreshing,
        user,
        refreshToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
