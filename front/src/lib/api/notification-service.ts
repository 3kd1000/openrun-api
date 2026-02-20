import axiosInstance from "@/services/api/axiosInstance";

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

export const fetchNotifications = async (): Promise<NotificationItem[]> => {
  const response = await axiosInstance.get<NotificationItem[]>("/notifications");
  return response.data;
};

export const markAsRead = async (id: number): Promise<void> => {
  await axiosInstance.patch(`/notifications/${id}/read`);
};

export const markAllAsRead = async (): Promise<void> => {
  await axiosInstance.patch("/notifications/read-all");
};

export const deleteNotifications = async (ids: number[]): Promise<number> => {
  const response = await axiosInstance.post<{ deleted: number }>(
    "/notifications/delete",
    { ids }
  );
  return response.data.deleted;
};

export const deleteReadNotifications = async (): Promise<number> => {
  const response = await axiosInstance.delete<{ deleted: number }>(
    "/notifications/read"
  );
  return response.data.deleted;
};

export const deleteAllNotifications = async (): Promise<void> => {
  await axiosInstance.delete("/notifications/all");
};

export const getUnreadCount = async (): Promise<number> => {
  try {
    const response = await axiosInstance.get<UnreadCountResponse>(
      "/notifications/unread-count"
    );
    return response.data.count;
  } catch {
    return 0;
  }
};
