// src/services/notificationService.ts
import axios from "axios";
import axiosInstance from "./api/axiosInstance";

export interface NotificationItem {
  id: number;
  title: string;
  body: string;
  type: string;
  referenceId: number | null;
  referenceType: string | null;
  isRead: boolean;
  createdAt: string;
}

export interface UnreadCountResponse {
  count: number;
}

/**
 * 알림 목록 조회
 */
export const fetchNotifications = async (): Promise<NotificationItem[]> => {
  const response = await axiosInstance.get<NotificationItem[]>("/notifications");
  return response.data;
};

/**
 * 알림 읽음 처리
 */
export const markAsRead = async (id: number): Promise<void> => {
  await axiosInstance.patch(`/notifications/${id}/read`);
};

/**
 * 전체 알림 읽음 처리
 */
export const markAllAsRead = async (): Promise<void> => {
  await axiosInstance.patch("/notifications/read-all");
};

/**
 * 미읽음 알림 수 조회
 * - 401 에러는 아직 인증되지 않은 상태이므로 0으로 처리
 */
export const getUnreadCount = async (): Promise<number> => {
  try {
    const response =
      await axiosInstance.get<UnreadCountResponse>("/notifications/unread-count");
    return response.data.count;
  } catch (error) {
    // 401은 인증 전 상태 - 미읽음 수 0으로 처리
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      console.log("[Notification] 인증 대기 중, 미읽음 수 0으로 처리");
      return 0;
    }
    throw error;
  }
};
