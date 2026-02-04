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
  const fcmTokenRef = useRef<string | null>(null);
  const fcmInitializedRef = useRef(false);

  // FCM 초기화 및 토큰 등록
  useEffect(() => {
    if (!isAuthReady || !user || fcmInitializedRef.current) return;
    if (!isFcmSupported()) return;

    const initFcm = async () => {
      try {
        const token = await requestFcmToken();
        if (token) {
          fcmTokenRef.current = token;
          await registerTokenToServer(token);
          fcmInitializedRef.current = true;
        }
      } catch (error) {
        console.error("[Notification] FCM 초기화 실패:", error);
      }
    };

    initFcm();
  }, [isAuthReady, user]);

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
