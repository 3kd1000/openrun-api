import axiosInstance from "@/services/api/axiosInstance";
import type {
  Club,
  CreateClubRequest,
  UpdateClubRequest,
  UpdateClubPolicyRequest,
  ClubMembership,
  ClubRule,
  ClubNotice,
  ExternalRequestResponse,
  ExternalRequestType,
  ExternalRequestStatus,
} from "@/lib/types/club";

// ============ Club Read ============

export const getClub = async (clubId: number): Promise<Club> => {
  const response = await axiosInstance.get<Club>(`/clubs/${clubId}`);
  return response.data;
};

export const getClubMembership = async (
  clubId: number
): Promise<ClubMembership> => {
  const response = await axiosInstance.get<ClubMembership>(
    `/clubs/${clubId}/membership`,
    { params: { status: "ACTIVE" } }
  );
  return response.data;
};

// ============ Club CRUD ============

export const createClub = async (data: CreateClubRequest): Promise<Club> => {
  const response = await axiosInstance.post<Club>("/clubs", data);
  return response.data;
};

export const updateClub = async (
  clubId: number,
  data: UpdateClubRequest
): Promise<Club> => {
  const response = await axiosInstance.put<Club>(`/clubs/${clubId}`, data);
  return response.data;
};

export const updateClubPolicy = async (
  clubId: number,
  data: UpdateClubPolicyRequest
): Promise<Club> => {
  const response = await axiosInstance.patch<Club>(
    `/clubs/${clubId}/policy`,
    data
  );
  return response.data;
};

export const getClubMembers = async (
  clubId: number
): Promise<ClubMembership[]> => {
  const response = await axiosInstance.get<ClubMembership[]>(
    `/clubs/${clubId}/members`
  );
  return response.data;
};

// ============ Public Club List (신규회원 모집) ============

/** Spring Page<T> 응답 구조 */
interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

export const getRecruitingClubs = async (params?: {
  sort?: string;
  size?: number;
}): Promise<Club[]> => {
  const response = await axiosInstance.get<PageResponse<Club>>("/clubs", {
    params: {
      memberRecruitmentStatus: "OPEN",
      sort: params?.sort ?? "updatedAt,desc",
      size: params?.size ?? 100,
    },
  });
  // Spring Page<T> 응답에서 content 배열 추출
  return response.data.content ?? [];
};

// ============ External Requests ============

export const listExternalRequests = async (
  clubId: number,
  params?: {
    type?: ExternalRequestType;
    status?: ExternalRequestStatus;
    postId?: number;
  }
): Promise<ExternalRequestResponse[]> => {
  const response = await axiosInstance.get<ExternalRequestResponse[]>(
    `/clubs/${clubId}/external-requests`,
    { params }
  );
  return response.data;
};

export const approveExternalRequest = async (
  clubId: number,
  requestId: number,
  note?: string
): Promise<ExternalRequestResponse> => {
  const response = await axiosInstance.post<ExternalRequestResponse>(
    `/clubs/${clubId}/external-requests/${requestId}/approve`,
    { note }
  );
  return response.data;
};

export const rejectExternalRequest = async (
  clubId: number,
  requestId: number,
  note?: string
): Promise<ExternalRequestResponse> => {
  const response = await axiosInstance.post<ExternalRequestResponse>(
    `/clubs/${clubId}/external-requests/${requestId}/reject`,
    { note }
  );
  return response.data;
};

// ============ Guest Recruit ============

export const applyGuestRecruit = async (
  clubId: number,
  scheduleId: number
): Promise<ExternalRequestResponse> => {
  const response = await axiosInstance.post<ExternalRequestResponse>(
    `/clubs/${clubId}/guest-recruit/${scheduleId}/apply`
  );
  return response.data;
};

export const cancelGuestRecruit = async (
  clubId: number,
  scheduleId: number
): Promise<ExternalRequestResponse> => {
  const response = await axiosInstance.delete<ExternalRequestResponse>(
    `/clubs/${clubId}/guest-recruit/${scheduleId}/apply`
  );
  return response.data;
};

// ============ Interclub Recruit ============

export const applyInterclubRecruit = async (
  clubId: number,
  scheduleId: number
): Promise<ExternalRequestResponse> => {
  const response = await axiosInstance.post<ExternalRequestResponse>(
    `/clubs/${clubId}/interclub-recruit/${scheduleId}/apply`
  );
  return response.data;
};

export const cancelInterclubRecruit = async (
  clubId: number,
  scheduleId: number
): Promise<ExternalRequestResponse> => {
  const response = await axiosInstance.delete<ExternalRequestResponse>(
    `/clubs/${clubId}/interclub-recruit/${scheduleId}/apply`
  );
  return response.data;
};

// ============ Club Join ============

export const getMyJoinRequest = async (
  clubId: number
): Promise<ExternalRequestResponse> => {
  const response = await axiosInstance.get<ExternalRequestResponse>(
    `/clubs/${clubId}/join/my-request`
  );
  return response.data;
};

// ============ Club Notices & Rules ============

export const getClubNotices = async (
  clubId: number
): Promise<ClubNotice[]> => {
  const response = await axiosInstance.get<ClubNotice[]>(
    `/clubs/${clubId}/notices`
  );
  return response.data;
};

export const getClubRules = async (clubId: number): Promise<ClubRule[]> => {
  const response = await axiosInstance.get<ClubRule[]>(
    `/clubs/${clubId}/rules`
  );
  return response.data;
};

export const markClubNoticesRead = async (clubId: number): Promise<void> => {
  await axiosInstance.post(`/clubs/${clubId}/notices/read`);
};

export const markClubRulesRead = async (clubId: number): Promise<void> => {
  await axiosInstance.post(`/clubs/${clubId}/rules/read`);
};

export interface ClubContentUnreadCountResponse {
  noticeUnreadCount: number;
  ruleUnreadCount: number;
}

export const getClubContentUnreadCount = async (
  clubId: number
): Promise<ClubContentUnreadCountResponse> => {
  const response = await axiosInstance.get<ClubContentUnreadCountResponse>(
    `/clubs/${clubId}/content/unread-count`
  );
  return response.data;
};

// ============ Member Role Management ============

export interface UpdateMemberRolesRequest {
  updates: { memberId: number; role: string }[];
}

export const updateMemberRoles = async (
  clubId: number,
  data: UpdateMemberRolesRequest
): Promise<void> => {
  await axiosInstance.patch(`/clubs/${clubId}/members/roles`, data);
};

export const kickMember = async (
  clubId: number,
  memberId: number
): Promise<void> => {
  await axiosInstance.delete(`/clubs/${clubId}/members/${memberId}`);
};

// ============ Club Join (Public) ============

export const joinClub = async (
  clubId: number
): Promise<ExternalRequestResponse> => {
  const response = await axiosInstance.post<ExternalRequestResponse>(
    `/clubs/${clubId}/join`
  );
  return response.data;
};
