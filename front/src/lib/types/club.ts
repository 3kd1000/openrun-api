export type AwardType = "ATTENDANCE" | "POINTS" | "BOOKING";

export interface Club {
  id: number;
  name: string;
  description: string;
  region: string;
  regionDepth1?: string | null;
  regionDepth2?: string | null;
  ownerUserId: number;
  autoJoinEnabled?: boolean | null;
  interclubRecruitmentOpen?: boolean | null;
  memberRecruitmentOpen?: boolean | null;
  memberRecruitmentNote?: string | null;
  activitySummary?: string | null;
  memberCount?: number;
  logoUrl?: string | null;
  logoThumbnailUrl?: string | null;
  awardAttendanceEnabled?: boolean | null;
  awardPointsEnabled?: boolean | null;
  awardBookingEnabled?: boolean | null;
  createdAt: string;
  updatedAt: string;
}

export interface ClubMembership {
  memberId: number;
  role: "OWNER" | "ADMIN" | "REGULAR";
  status: "PENDING" | "ACTIVE" | "REJECTED";
  joinedAt: string;
  userId: number;
  name: string;
  email: string | null;
  imageUrl: string | null;
  tennisStartedAt: string | null;
  isBallKeeper?: boolean;
  ballQuantity?: number;
}

export interface CreateClubRequest {
  name: string;
  description?: string;
  region?: string;
  regionDepth1?: string;
  regionDepth2?: string;
}

export interface UpdateClubRequest {
  name?: string;
  description?: string;
  region?: string;
  regionDepth1?: string;
  regionDepth2?: string;
}

export interface UpdateClubPolicyRequest {
  autoJoinEnabled: boolean;
  interclubRecruitmentOpen: boolean;
  memberRecruitmentOpen: boolean;
  memberRecruitmentNote?: string | null;
}

export interface ClubRule {
  id: number;
  clubId: number;
  title: string;
  content: string;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface ClubNotice {
  id: number;
  clubId: number;
  title: string;
  content: string;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
}

export type ExternalRequestType = "JOIN" | "GUEST" | "INTERCLUB";
export type ExternalRequestStatus =
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "CANCELLED";

export interface ExternalRequestResponse {
  id: number;
  clubId: number;
  scheduleId?: number | null;
  postId?: number | null;
  type: ExternalRequestType;
  status: ExternalRequestStatus;
  requesterUserId: number;
  requesterName: string;
  createdAt: string;
  decidedAt?: string | null;
  decisionNote?: string | null;
}
