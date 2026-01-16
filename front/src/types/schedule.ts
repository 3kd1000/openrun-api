export interface Schedule {
  id: number;
  clubId: number;
  clubName?: string;
  courtName: string;
  scheduledAt: string; // ISO 8601 format
  pinned?: boolean; // 공지성 고정 일정 (없으면 false로 간주)
  guestRecruitOpen?: boolean;
  guestRecruitNote?: string | null;
  interclubRecruitOpen?: boolean;
  interclubRecruitNote?: string | null;
  maxCapacity: number;
  currentParticipants: number;
  cost?: number;
  description?: string;
  reservedByUserId?: number;
  reservedByUserName?: string;
  participationStartAt?: string | null; // ISO 8601 format
  drawType?: 'AA' | 'AB' | 'SEED' | null;
  isDrawValid?: boolean | null;
  drawCreatedAt?: string | null;
  canManageSchedule?: boolean | null; // 권한 정보 (System Admin 또는 Club ADMIN 이상)
  createdAt: string;
  updatedAt: string;
}

export interface CreateScheduleRequest {
  clubId: number;
  courtName: string;
  scheduledAt: string; // ISO 8601 format: "2025-12-25T14:00:00"
  maxCapacity: number;
  cost?: number;
  description?: string;
  reservedByUserId?: number;
  participationStartAt?: string | null; // ISO 8601 format: "2025-12-25T14:00:00"
}

export interface Participant {
  id: number;
  scheduleId: number;
  userId: number;
  userName: string; // 추가
  status: 'CONFIRMED' | 'WAITING' | 'CANCELLED';
  position: number;
  joinedAt: string;
  asGuest: boolean;
}

/**
 * 내 참가 정보 (ScheduleParticipant)
 */
export interface MyParticipationInfo {
  status: 'CONFIRMED' | 'WAITING' | null;
  waitingNumber: number | null;  // WAITING일 때 대기 순번
  asGuest: boolean | null;       // 게스트로 참가했는지
}

/**
 * 내 외부 신청 정보 (ExternalRequest)
 */
export interface MyExternalRequestInfo {
  requestId: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
  type: 'GUEST' | 'INTERCLUB';
  createdAt: string;
}

/**
 * 내 일정 응답 (개인일정 조회용)
 * - 일정 기본 정보 + 내 참가 정보 + 내 외부 신청 정보
 */
export interface MyScheduleResponse {
  schedule: Schedule;
  myParticipation: MyParticipationInfo | null;
  myExternalRequest: MyExternalRequestInfo | null;
}
