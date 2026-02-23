/* eslint-disable react-refresh/only-export-components */
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { useAuth } from "./AuthContext";
import { messageService } from "../services/messageService";
import { onForegroundMessage, isFcmSupported } from "../services/fcmService";

interface MessageContextType {
  unreadCount: number;
  refreshUnreadCount: () => Promise<void>;
}

const MessageContext = createContext<MessageContextType | undefined>(undefined);

export const useMessage = () => {
  const context = useContext(MessageContext);
  if (!context) {
    throw new Error("useMessage must be used within MessageProvider");
  }
  return context;
};

interface MessageProviderProps {
  children: React.ReactNode;
}

export const MessageProvider: React.FC<MessageProviderProps> = ({
  children,
}) => {
  const { isAuthReady, user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  const refreshUnreadCount = useCallback(async () => {
    if (!user) return;
    try {
      const count = await messageService.getUnreadCount();
      setUnreadCount(count);
    } catch (error) {
      console.error("[Message] 미읽음 수 조회 실패:", error);
    }
  }, [user]);

  // 로그인 시 미읽음 수 조회
  useEffect(() => {
    if (!isAuthReady || !user) {
      setUnreadCount(0);
      return;
    }
    refreshUnreadCount();
  }, [isAuthReady, user, refreshUnreadCount]);

  // FCM 포그라운드 수신: MESSAGE 타입이면 메시지 dot 즉시 갱신
  useEffect(() => {
    if (!isAuthReady || !user) return;
    if (!isFcmSupported()) return;

    const unsubscribe = onForegroundMessage((payload) => {
      const type = payload.data?.type;
      if (type === "MESSAGE") {
        void refreshUnreadCount();
      }
    });

    return () => unsubscribe();
  }, [isAuthReady, user, refreshUnreadCount]);

  return (
    <MessageContext.Provider
      value={{
        unreadCount,
        refreshUnreadCount,
      }}
    >
      {children}
    </MessageContext.Provider>
  );
};
