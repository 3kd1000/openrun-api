import api from "./api";

/** 클럽 목록 아이템 (GET /api/admin/clubs/all) */
export interface AdminClubItem {
  id: number;
  name: string;
  regionDepth1: string;
  regionDepth2: string;
  memberCount: number;
  ownerName: string;
  logoUrl: string | null;
  createdAt: string | null;
}

/** 클럽 상세 (GET /api/admin/clubs/{id}) — ClubResponse DTO 그대로 */
export interface ClubDetail {
  id: number;
  name: string;
  description: string | null;
  region: string | null;
  regionDepth1: string | null;
  regionDepth2: string | null;
  ownerUserId: number;
  activitySummary: string | null;
  memberCount: number | null;
  logoUrl: string | null;
  logoThumbnailUrl: string | null;
  createdAt: string;
  // Policy fields
  autoJoinEnabled: boolean | null;
  interclubRecruitmentOpen: boolean | null;
  memberRecruitmentOpen: boolean | null;
  memberRecruitmentNote: string | null;
  awardEnabled: boolean | null;
  awardPeriod: string | null;
  awardAttendanceEnabled: boolean | null;
  awardPointsEnabled: boolean | null;
  awardBookingEnabled: boolean | null;
}

/** 클럽 멤버 상세 (GET /api/admin/clubs/{id}/membership) */
export interface ClubMemberItem {
  memberId: number;
  userId: number;
  name: string;
  email: string | null;
  imageUrl: string | null;
  role: string;
  status: string;
  joinedAt: string;
  tennisStartedAt: string | null;
}

/** 클럽 목록 조회 */
export async function getAdminClubs(): Promise<AdminClubItem[]> {
  const { data } = await api.get<AdminClubItem[]>("/admin/clubs/all");
  return data;
}

/** 클럽 상세 조회 */
export async function getAdminClubDetail(clubId: number): Promise<ClubDetail> {
  const { data } = await api.get<ClubDetail>(`/admin/clubs/${clubId}`);
  return data;
}

/** 클럽 멤버십 조회 */
export async function getAdminClubMembership(
  clubId: number
): Promise<ClubMemberItem[]> {
  const { data } = await api.get<ClubMemberItem[]>(
    `/admin/clubs/${clubId}/membership`
  );
  return data;
}
