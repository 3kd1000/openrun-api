/* eslint-disable react-refresh/only-export-components */
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from "react";
import { useAuth } from "./AuthContext";
import { useToast } from "./ToastContext";
import {
  requestFcmToken,
  registerTokenToServer,
  removeTokenFromServer,
  onForegroundMessage,
  isFcmSupported,
} from "../services/fcmService";
import {
  fetchNotifications,
  markAsRead as markAsReadApi,
  markAllAsRead as markAllAsReadApi,
  getUnreadCount,
} from "../services/notificationService";
import type { NotificationItem } from "../services/notificationService";

interface NotificationContextType {
  notifications: NotificationItem[];
  unreadCount: number;
  loading: boolean;
  /** 푸시 알림 권한이 아직 요청되지 않은 상태 (iOS에서 배너 표시용) */
  needsPermission: boolean;
  /** 사용자 제스처(탭/클릭) 안에서 호출해야 하는 권한 요청 함수 (iOS 필수) */
  requestPushPermission: () => Promise<void>;
  refreshNotifications: () => Promise<void>;
  refreshUnreadCount: () => Promise<void>;
  markAsRead: (id: number) => Promise<void>;
  markAllAsRead: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined
);

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error(
      "useNotification must be used within NotificationProvider"
    );
  }
  return context;
};

interface NotificationProviderProps {
  children: React.ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({
  children,
}) => {
  const { isAuthReady, user } = useAuth();
  const { showToast } = useToast();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [needsPermission, setNeedsPermission] = useState(false);
  const fcmTokenRef = useRef<string | null>(null);
  const fcmInitializedRef = useRef(false);

  // FCM 토큰 등록 공통 로직
  const initFcmToken = useCallback(async () => {
    try {
      const token = await requestFcmToken();
      if (token) {
        fcmTokenRef.current = token;
        await registerTokenToServer(token);
        fcmInitializedRef.current = true;
        setNeedsPermission(false);
        return true;
      }
    } catch (error) {
      console.error("[Notification] FCM 초기화 실패:", error);
    }
    return false;
  }, []);

  // FCM 초기화 및 토큰 등록 (데스크톱에서는 자동으로 동작, iOS에서는 권한 미허용 시 needsPermission 설정)
  useEffect(() => {
    if (!isAuthReady || !user || fcmInitializedRef.current) return;
    if (!isFcmSupported()) return;

    const initFcm = async () => {
      // 이미 권한이 부여된 경우에만 자동 초기화 (데스크톱 재방문, 이미 허용한 iOS)
      if (Notification.permission === "granted") {
        await initFcmToken();
      } else if (Notification.permission === "default") {
        // 아직 권한 요청 안 됨 → 배너 표시 (iOS는 사용자 제스처 필요)
        setNeedsPermission(true);
      }
      // "denied"면 아무것도 하지 않음
    };

    initFcm();
  }, [isAuthReady, user, initFcmToken]);

  // 사용자 제스처에서 호출하는 권한 요청 (iOS에서 필수)
  const requestPushPermission = useCallback(async () => {
    const success = await initFcmToken();
    if (!success) {
      // 권한이 거부됐거나 토큰 발급 실패
      setNeedsPermission(false);
    }
  }, [initFcmToken]);

  // 포그라운드 메시지 수신 처리
  useEffect(() => {
    if (!isAuthReady || !user) return;
    if (!isFcmSupported()) return;

    const unsubscribe = onForegroundMessage((payload) => {
      const title = payload.notification?.title || "알림";
      const body = payload.notification?.body || "";
      showToast(`${title}: ${body}`, "default", 5000);
      // 미읽음 수 갱신
      refreshUnreadCount();
    });

    return () => unsubscribe();
  }, [isAuthReady, user, showToast]);

  // 로그인 시 미읽음 수 조회
  useEffect(() => {
    if (!isAuthReady || !user) {
      setUnreadCount(0);
      setNotifications([]);
      return;
    }

    refreshUnreadCount();
  }, [isAuthReady, user]);

  // 로그아웃 시 FCM 토큰 삭제
  useEffect(() => {
    if (!isAuthReady) return;

    // user가 null이 되면 (로그아웃) 토큰 삭제
    if (!user && fcmTokenRef.current) {
      removeTokenFromServer(fcmTokenRef.current).finally(() => {
        fcmTokenRef.current = null;
        fcmInitializedRef.current = false;
      });
    }
  }, [isAuthReady, user]);

  const refreshNotifications = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await fetchNotifications();
      setNotifications(data);
    } catch (error) {
      console.error("[Notification] 알림 목록 조회 실패:", error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const refreshUnreadCount = useCallback(async () => {
    if (!user) return;
    try {
      const count = await getUnreadCount();
      setUnreadCount(count);
    } catch (error) {
      console.error("[Notification] 미읽음 수 조회 실패:", error);
    }
  }, [user]);

  const markAsRead = useCallback(
    async (id: number) => {
      try {
        await markAsReadApi(id);
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } catch (error) {
        console.error("[Notification] 읽음 처리 실패:", error);
      }
    },
    []
  );

  const markAllAsRead = useCallback(async () => {
    try {
      await markAllAsReadApi();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error("[Notification] 전체 읽음 처리 실패:", error);
    }
  }, []);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        needsPermission,
        requestPushPermission,
        refreshNotifications,
        refreshUnreadCount,
        markAsRead,
        markAllAsRead,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};
