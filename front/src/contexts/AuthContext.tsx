/* eslint-disable react-refresh/only-export-components */
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
} from "react";
import type { User } from "firebase/auth";
import {
  auth,
  clearLoginSession,
  setLoginExpiry,
  isLoginExpired,
} from "../services/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { getTimestamp } from "../utils/dateUtils";
import {
  getOpenRunSession,
  setOpenRunSession,
} from "../utils/openrunSession";

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

  // 토큰 갱신 함수 (재사용 가능)
  const refreshToken = async () => {
    const now = getTimestamp();

    // 이미 갱신 중이면 중복 호출 방지
    if (isTokenRefreshing) {
      console.log(`ℹ️ [${now}] 토큰 갱신 이미 진행 중 → 스킵`);
      return;
    }

    let currentUser = auth.currentUser;
    if (!currentUser) {
      console.log(`ℹ️ [${now}] 토큰 갱신 시도했으나 사용자 없음`);
      return;
    }

    const autoLoginEnabled = getOpenRunSession().autoLoginEnabled ?? false;

    // 자동 로그인 비활성화 시 세션 만료 체크
    if (!autoLoginEnabled && isLoginExpired()) {
      console.warn(`⏰ [${now}] 로그인 세션 만료 감지 → 로그아웃`);
      await handleSessionExpiry();
      return;
    }

    setIsTokenRefreshing(true);

    // 최대 3회 재시도
    let retryCount = 0;
    const maxRetries = 3;

    while (retryCount < maxRetries) {
      try {
        currentUser = auth.currentUser;
        if (!currentUser) {
          console.warn(`⚠️ [${now}] 재시도 중 사용자 없음 → 토큰 갱신 중단`);
          setIsTokenRefreshing(false);
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

        setIsTokenRefreshing(false);
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
          setIsTokenRefreshing(false);
        }
      }
    }

    setIsTokenRefreshing(false);
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
          const autoLoginEnabled = getOpenRunSession().autoLoginEnabled ?? false;

          // 자동 로그인 비활성화 시 세션 만료 체크
          if (!isNewLogin && !autoLoginEnabled && isLoginExpired()) {
            console.warn(
              `⏰ [${timestamp}] 로그인 세션 만료 감지 → 자동 로그아웃`
            );
            await handleSessionExpiry();
            setIsAuthReady(true);
            return;
          }

          setUser(firebaseUser);

          // 토큰 갱신 (중복 방지 플래그 사용)
          if (!isTokenRefreshing) {
            setIsTokenRefreshing(true);

            let retryCount = 0;
            const maxRetries = 3;
            let tokenRefreshSuccess = false;

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

                if (isNewLogin || autoLoginEnabled) {
                  setLoginExpiry(autoLoginEnabled);
                  const updatedLoginExpiryStr =
                    localStorage.getItem("login_expiry");
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
                  console.log(
                    `   → 토큰 만료 예상: ${tokenExpiryStr} (약 1시간 후)`
                  );
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
                  console.log(
                    `   → 토큰 만료 예상: ${tokenExpiryStr} (약 1시간 후)`
                  );
                  console.log(`   → 로그인 세션 만료: ${loginExpiry}`);
                }

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

            setIsTokenRefreshing(false);

            // 토큰 갱신 실패 시 로그아웃 처리
            if (!tokenRefreshSuccess) {
              console.error(`❌ [${timestamp}] 토큰 갱신 실패 → 로그아웃 처리`);
              await handleSessionExpiry();
              setIsAuthReady(true);
              return;
            }
          }
        } else {
          console.log(`ℹ️ [${timestamp}] Firebase 로그아웃 상태`);
          setUser(null);
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
      value={{ isAuthReady, isTokenRefreshing, user, refreshToken }}
    >
      {children}
    </AuthContext.Provider>
  );
};
