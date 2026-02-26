export type MatchType =
  | "NONE"
  | "MEN_DOUBLES"
  | "WOMEN_DOUBLES"
  | "MIXED_DOUBLES"
  | "SINGLES"
  | null;

export interface Schedule {
  id: number;
  clubId: number;
  clubName?: string;
  courtName: string;
  scheduledAt: string;
  durationMinutes?: number;
  numberOfCourts?: number | null;
  pinned?: boolean;
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
  participationStartAt?: string | null;
  drawType?: "AA" | "AB" | "SEED" | null;
  matchType?: MatchType;
  isDrawValid?: boolean | null;
  drawCreatedAt?: string | null;
  isScheduleAdmin?: boolean | null;
  canManageSchedule?: boolean | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateScheduleRequest {
  clubId: number;
  courtName: string;
  scheduledAt: string;
  durationMinutes?: number;
  numberOfCourts?: number;
  maxCapacity: number;
  cost?: number;
  description?: string;
  reservedByUserId?: number;
  participationStartAt?: string | null;
  matchType?: MatchType;
}

export interface Participant {
  id: number;
  scheduleId: number;
  userId: number;
  userName: string;
  status: "CONFIRMED" | "WAITING" | "CANCELLED";
  position: number;
  joinedAt: string;
  asGuest: boolean;
  awardTypes?: string[];
}

export interface MyParticipationInfo {
  status: "CONFIRMED" | "WAITING" | null;
  waitingNumber: number | null;
  asGuest: boolean | null;
}

export interface MyExternalRequestInfo {
  requestId: number;
  status: "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";
  type: "GUEST" | "INTERCLUB";
  createdAt: string;
}

export interface MyScheduleResponse {
  schedule: Schedule;
  myParticipation: MyParticipationInfo | null;
  myExternalRequest: MyExternalRequestInfo | null;
}

export interface ScheduleCursorResponse {
  content: Schedule[];
  hasMore: boolean;
  nextCursor: string | null;
  size: number;
}

export interface PublicRecruitSchedule {
  scheduleId: number;
  clubId: number | null;
  clubName: string;
  clubRegion: string;
  recruitType: "GUEST" | "INTERCLUB";
  matchType: string;
  scheduledAt: string;
  durationMinutes: number;
  courtName: string;
  currentParticipants: number;
  maxCapacity: number;
  cost: number;
  note: string | null;
}
