// src/services/notificationService.ts
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
 */
export const getUnreadCount = async (): Promise<number> => {
  const response =
    await axiosInstance.get<UnreadCountResponse>("/notifications/unread-count");
  return response.data.count;
};
