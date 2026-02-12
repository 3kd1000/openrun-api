import axios from 'axios';
import { getCurrentToken } from '../firebase';
import { getOpenRunSession, setOpenRunSession } from '../../utils/openrunSession';
import { authBridge } from '../authBridge';

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080',
  headers: {
    'Content-Type': 'application/json',
  },
});

function sanitizeToken(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const t = String(raw).trim();
  if (!t) return null;
  if (t === "undefined" || t === "null") return null;
  return t;
}

axiosInstance.interceptors.request.use((config) => {
  // Firebase token 추가 (OAuth 로그인 사용 시)
  const session = getOpenRunSession();
  const firebaseToken = sanitizeToken(session.firebaseToken);
  if (firebaseToken) {
    config.headers['Authorization'] = `Bearer ${firebaseToken}`;
  }

  return config;
});

// 401 에러 시 토큰 리프레시 후 재시도
let isRefreshing = false;
interface QueuedRequest {
  resolve: (token: string | null) => void;
  reject: (error: unknown) => void;
}
let failedQueue: QueuedRequest[] = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });

  failedQueue = [];
};

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // 401 에러 처리 - 단, 토큰이 없는 상태(비로그인)에서는 리프레시 시도하지 않음
    const session = getOpenRunSession();
    const hasToken = sanitizeToken(session.firebaseToken) !== null;

    if (error.response?.status === 401 && !originalRequest._retry && hasToken) {

      // AuthContext에서 토큰 갱신 중이면 완료를 대기한 후 재시도
      if (authBridge.isTokenRefreshing) {
        try {
          await authBridge.waitForRefresh();
          // 갱신 완료 후 세션에서 새 토큰 읽기
          const updatedSession = getOpenRunSession();
          const newToken = sanitizeToken(updatedSession.firebaseToken);
          if (newToken) {
            originalRequest._retry = true;
            originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
            return axiosInstance(originalRequest);
          }
        } catch {
          // 갱신 대기 실패(타임아웃 등) 시 아래 로직으로 계속
        }
      }

      if (isRefreshing) {
        // 이미 토큰 리프레시 중이면 큐에 추가
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers['Authorization'] = `Bearer ${token}`;
            return axiosInstance(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Firebase에서 최신 토큰 가져오기
        const newToken = await getCurrentToken();

        if (newToken) {
          // session 업데이트
          setOpenRunSession({
            firebaseToken: newToken,
            tokenLastRefresh: new Date().toISOString(),
          });

          // 큐에 있는 요청들 처리
          processQueue(null, newToken);

          // 원래 요청 재시도
          originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
          return axiosInstance(originalRequest);
        } else {
          // 토큰 리프레시 실패 → 로그아웃
          throw new Error('토큰 갱신 실패');
        }
      } catch (refreshError) {
        // 토큰 리프레시 실패 → 로그인 페이지로 (세션 데이터는 보존)
        // clearLoginSession()은 명시적 로그아웃 시에만 호출
        // 네트워크 복구 시 다음 토큰 갱신 주기에서 자동 복구 가능
        processQueue(refreshError, null);

        console.warn('❌ 토큰 갱신 실패 (세션 만료 또는 네트워크 오류), 로그인 페이지로 이동 (세션 보존)');

        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }

        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
