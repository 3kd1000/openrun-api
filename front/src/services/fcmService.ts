// src/services/fcmService.ts
import { getMessaging, getToken, onMessage } from "firebase/messaging";
import type { MessagePayload } from "firebase/messaging";
import axios from "axios";
import { app } from "./firebase";
import axiosInstance from "./api/axiosInstance";
import { isMobile } from "../utils/platformDetection";

const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY;

let messagingInstance: ReturnType<typeof getMessaging> | null = null;

/**
 * FCM 지원 여부 확인
 */
export const isFcmSupported = (): boolean => {
  return (
    "Notification" in window &&
    "serviceWorker" in navigator &&
    "PushManager" in window
  );
};

/**
 * FCM Messaging 인스턴스 가져오기 (lazy init)
 */
const getMessagingInstance = () => {
  if (!messagingInstance) {
    messagingInstance = getMessaging(app);
  }
  return messagingInstance;
};

/**
 * 알림 권한 요청 및 FCM 토큰 발급
 * @returns FCM 토큰 또는 null (권한 거부/미지원)
 */
export const requestFcmToken = async (): Promise<string | null> => {
  if (!isFcmSupported()) {
    console.log("[FCM] 이 브라우저에서는 푸시 알림을 지원하지 않습니다.");
    return null;
  }

  if (!VAPID_KEY) {
    console.warn("[FCM] VAPID_KEY가 설정되지 않았습니다.");
    return null;
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      console.log("[FCM] 알림 권한이 거부되었습니다.");
      return null;
    }

    // Firebase SDK가 firebase-messaging-sw.js를 자동으로
    // /firebase-cloud-messaging-push-scope 스코프에 등록
    // (Workbox sw.js와 스코프 충돌 방지)
    const messaging = getMessagingInstance();
    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
    });

    console.log("[FCM] 토큰 발급 완료");
    return token;
  } catch (error) {
    console.error("[FCM] 토큰 발급 실패:", error);
    return null;
  }
};

/**
 * 디바이스 타입 판별 (MOBILE / DESKTOP)
 */
const getDeviceType = (): "MOBILE" | "DESKTOP" => {
  return isMobile() ? "MOBILE" : "DESKTOP";
};

/**
 * 백엔드에 FCM 토큰 등록
 */
export const registerTokenToServer = async (token: string): Promise<void> => {
  const deviceInfo = `${navigator.userAgent.substring(0, 200)}`;
  const deviceType = getDeviceType();
  await axiosInstance.post("/fcm/tokens", { token, deviceInfo, deviceType });
  console.log("[FCM] 서버에 토큰 등록 완료 (deviceType:", deviceType, ")");
};

/**
 * 백엔드에서 FCM 토큰 삭제
 */
export const removeTokenFromServer = async (token: string): Promise<void> => {
  try {
    await axiosInstance.delete("/fcm/tokens", { data: { token } });
    console.log("[FCM] 서버에서 토큰 삭제 완료");
  } catch (error) {
    console.error("[FCM] 서버 토큰 삭제 실패:", error);
  }
};

/**
 * 현재 디바이스 타입에 해당하는 FCM 토큰이 서버에 등록되어 있는지 확인
 * - 401 에러는 아직 인증되지 않은 상태이므로 "토큰 없음"으로 처리
 */
export const checkHasToken = async (): Promise<boolean> => {
  try {
    const response = await axiosInstance.get<{ hasToken: boolean; deviceTypes: string[] }>("/fcm/tokens/exists");
    const currentDeviceType = getDeviceType();
    return response.data.deviceTypes.includes(currentDeviceType);
  } catch (error) {
    // 401은 인증 전 상태 (로그인 직후 토큰 미설정) - 토큰 없음으로 처리
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      console.log("[FCM] 인증 대기 중, 토큰 없음으로 처리");
      return false;
    }
    console.error("[FCM] 토큰 존재 여부 확인 실패:", error);
    return false;
  }
};

/**
 * 포그라운드 메시지 수신 핸들러 등록
 * @returns 구독 해제 함수
 */
export const onForegroundMessage = (
  callback: (payload: MessagePayload) => void
): (() => void) => {
  if (!isFcmSupported()) {
    return () => {};
  }

  const messaging = getMessagingInstance();
  return onMessage(messaging, callback);
};
