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
  checkHasToken,
} from "../services/fcmService";
import {
  fetchNotifications,
  markAsRead as markAsReadApi,
  markAllAsRead as markAllAsReadApi,
  deleteNotifications as deleteNotificationsApi,
  deleteReadNotifications as deleteReadNotificationsApi,
  deleteAllNotifications as deleteAllNotificationsApi,
  getUnreadCount,
} from "../services/notificationService";
import type { NotificationItem } from "../services/notificationService";

interface NotificationContextType {
  notifications: NotificationItem[];
  unreadCount: number;
  loading: boolean;
  /** 푸시 알림 권한이 아직 요청되지 않은 상태 (iOS에서 배너 표시용) */
  needsPermission: boolean;
  /** 푸시 알림 권한이 해제된 상태 (기기 설정에서 재활성화 필요) */
  permissionRevoked: boolean;
  /** 사용자 제스처(탭/클릭) 안에서 호출해야 하는 권한 요청 함수 (iOS 필수) */
  requestPushPermission: () => Promise<void>;
  refreshNotifications: () => Promise<void>;
  refreshUnreadCount: () => Promise<void>;
  markAsRead: (id: number) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteSelected: (ids: number[]) => Promise<void>;
  deleteRead: () => Promise<void>;
  deleteAll: () => Promise<void>;
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
  const [permissionRevoked, setPermissionRevoked] = useState(false);
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

  // FCM 초기화 및 토큰 등록
  // DB에 등록된 토큰이 없으면 배너 표시, 있으면 자동 초기화
  useEffect(() => {
    if (!isAuthReady || !user || fcmInitializedRef.current) return;

    const initFcm = async () => {
      // DB에서 등록된 토큰 존재 여부 확인
      const hasToken = await checkHasToken();

      if (hasToken) {
        if (isFcmSupported() && Notification.permission === "denied") {
          // DB에 토큰은 있지만 브라우저 알림 권한이 해제됨 → 설정 안내 필요
          setPermissionRevoked(true);
          setNeedsPermission(false);
        } else {
          setPermissionRevoked(false);
          setNeedsPermission(false);
          // 현재 브라우저에서 권한이 있으면 포그라운드 수신을 위해 초기화
          if (isFcmSupported() && Notification.permission === "granted") {
            await initFcmToken();
          }
        }
      } else {
        setPermissionRevoked(false);
        // 등록된 토큰 없음 → FCM 지원 + 권한 미거부 시 배너 표시
        if (isFcmSupported() && Notification.permission !== "denied") {
          setNeedsPermission(true);
        }
      }
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
      const data = payload.data || {};
      const title = data.title || payload.notification?.title || "알림";
      const body = data.body || payload.notification?.body || "";
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
      const [data, count] = await Promise.all([
        fetchNotifications(),
        getUnreadCount(),
      ]);
      setNotifications(data);
      setUnreadCount(count);
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

  const deleteSelected = useCallback(async (ids: number[]) => {
    try {
      await deleteNotificationsApi(ids);
      await refreshNotifications();
    } catch (error) {
      console.error("[Notification] 선택 삭제 실패:", error);
    }
  }, [refreshNotifications]);

  const deleteRead = useCallback(async () => {
    try {
      await deleteReadNotificationsApi();
      await refreshNotifications();
    } catch (error) {
      console.error("[Notification] 읽은 알림 삭제 실패:", error);
    }
  }, [refreshNotifications]);

  const deleteAll = useCallback(async () => {
    try {
      await deleteAllNotificationsApi();
      setNotifications([]);
      setUnreadCount(0);
    } catch (error) {
      console.error("[Notification] 전체 삭제 실패:", error);
    }
  }, []);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        needsPermission,
        permissionRevoked,
        requestPushPermission,
        refreshNotifications,
        refreshUnreadCount,
        markAsRead,
        markAllAsRead,
        deleteSelected,
        deleteRead,
        deleteAll,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};
