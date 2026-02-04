import api from "./api";

export type NotificationType =
  | "SYSTEM"
  | "SCHEDULE"
  | "DRAW"
  | "CLUB_INVITE"
  | "CLUB_JOIN";

export interface AdminNotificationResponse {
  id: number;
  userId: number;
  userName: string;
  clubId: number;
  clubName: string;
  title: string;
  body: string;
  type: NotificationType;
  referenceId: number | null;
  referenceType: string | null;
  isRead: boolean;
  createdAt: string;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
}

export interface NotificationSearchParams {
  clubId?: number;
  type?: NotificationType;
  page?: number;
  size?: number;
}

export interface SendNotificationPayload {
  clubId: number;
  userIds: number[];
  title: string;
  body: string;
  type: string;
  referenceId?: number | null;
  referenceType?: string | null;
}

export interface ClubItem {
  id: number;
  name: string;
}

/**
 * 알림 발송 이력 조회 (Admin)
 */
export async function getNotificationHistory(
  params: NotificationSearchParams = {}
): Promise<PageResponse<AdminNotificationResponse>> {
  const { data } = await api.get<PageResponse<AdminNotificationResponse>>(
    "/admin/notifications",
    { params }
  );
  return data;
}

/**
 * 알림 발송 (Admin)
 */
export async function sendNotification(
  payload: SendNotificationPayload
): Promise<void> {
  await api.post("/admin/notifications/send", payload);
}

/**
 * 클럽 목록 조회 (드롭다운용)
 */
export async function getClubs(): Promise<ClubItem[]> {
  const { data } = await api.get<PageResponse<ClubItem>>("/clubs", {
    params: { size: 100 },
  });
  return data.content;
}
