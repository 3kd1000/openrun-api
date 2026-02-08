import api from "./api";

export type AuditEntityType =
  | "SCHEDULE"
  | "SCHEDULE_PARTICIPANT"
  | "MATCH"
  | "CLUB"
  | "CLUB_MEMBER";

export type AuditActionType = "CREATE" | "UPDATE" | "DELETE";

export interface AuditLogResponse {
  id: number;
  userId: number;
  userName: string;
  entityType: AuditEntityType;
  entityId: number;
  actionType: AuditActionType;
  changes: string; // JSON string containing before/after
  clubId: number;
  clubName: string;
  createdAt: string;
  // Schedule 관련 정보 (SCHEDULE, SCHEDULE_PARTICIPANT 타입용)
  scheduledAt: string | null;
  courtName: string | null;
}

export interface AuditLogChanges {
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
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

export interface AuditLogSearchParams {
  clubId?: number;
  entityType?: AuditEntityType;
  actionType?: AuditActionType;
  page?: number;
  size?: number;
}

/**
 * Audit 로그 목록 조회 (페이징 + 필터링)
 */
export async function getAuditLogs(
  params: AuditLogSearchParams = {}
): Promise<PageResponse<AuditLogResponse>> {
  const { data } = await api.get<PageResponse<AuditLogResponse>>(
    "/admin/audit-logs",
    { params }
  );
  return data;
}

/**
 * Audit 로그 단건 조회
 */
export async function getAuditLogById(id: number): Promise<AuditLogResponse> {
  const { data } = await api.get<AuditLogResponse>(`/admin/audit-logs/${id}`);
  return data;
}

/**
 * changes JSON 파싱
 */
export function parseChanges(changesJson: string): AuditLogChanges {
  try {
    return JSON.parse(changesJson);
  } catch {
    return {};
  }
}

/**
 * 클럽 간단 정보 (필터링용)
 */
export interface ClubSimple {
  id: number;
  name: string;
  regionDepth1: string;
  regionDepth2: string;
}

/**
 * 모든 클럽 조회 (Admin용, 로컬 필터링)
 */
export async function getAllClubs(): Promise<ClubSimple[]> {
  const { data } = await api.get<ClubSimple[]>("/admin/clubs/all");
  return data;
}
