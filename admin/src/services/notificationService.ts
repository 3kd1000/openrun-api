import api from "./api";

export type NotificationType =
  | "SYSTEM"
  | "SCHEDULE"
  | "DRAW"
  | "CLUB_INVITE"
  | "EXTERNAL_REQUEST"   // 외부 신청 도착 (운영진 수신)
  | "REQUEST_RESULT";    // 신청 결과 (신청자 수신)

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

/**
 * 일정 간소화 응답 (Admin 리소스 선택용)
 */
export interface ScheduleSimple {
  id: number;
  courtName: string;
  scheduledAt: string;
  maxCapacity: number;
  currentParticipants: number;
  isDrawValid: boolean;
}

/**
 * 클럽별 일정 목록 조회 (Admin, 페이징)
 */
export async function getSchedulesByClub(
  clubId: number,
  page: number = 0,
  size: number = 10
): Promise<PageResponse<ScheduleSimple>> {
  const { data } = await api.get<PageResponse<ScheduleSimple>>("/admin/schedules", {
    params: { clubId, page, size },
  });
  return data;
}

/**
 * 클럽의 ACTIVE 멤버 userId 목록 조회 (전체 선택용)
 */
export async function getClubMemberIds(clubId: number): Promise<number[]> {
  const { data } = await api.get<number[]>(`/admin/clubs/${clubId}/member-ids`);
  return data;
}

/**
 * 클럽 멤버 정보 (개별 선택용)
 */
export interface ClubMemberInfo {
  id: number;
  name: string;
}

/**
 * 클럽의 ACTIVE 멤버 목록 조회 (개별 선택용)
 */
export async function getClubMembers(clubId: number): Promise<ClubMemberInfo[]> {
  const { data } = await api.get<ClubMemberInfo[]>(`/admin/clubs/${clubId}/members`);
  return data;
}
