import axiosInstance from './api/axiosInstance';
import type { UserResponse } from './userService';
import type {
  ClubRule,
  CreateClubRuleRequest,
  UpdateClubRuleRequest,
  ReorderClubRulesRequest,
  ClubNotice,
  CreateClubNoticeRequest,
  UpdateClubNoticeRequest
} from '../types/club';
import type { Club, CreateClubRequest, UpdateClubRequest, UpdateClubPolicyRequest, UpdateAwardPolicyRequest, AwardRankingResponse, AwardType } from '../types/club';
import type { Post } from '../types/post';

export type ExternalRequestType = 'JOIN' | 'GUEST' | 'INTERCLUB';
export type ExternalRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';

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
  scheduleAt?: string | null;
  courtName?: string | null;
  currentParticipants?: number | null;
  maxCapacity?: number | null;
  matchType?: string | null;
  tennisStartedAt?: string | null;
  ntrp?: string | null;
  formerPlayer?: boolean | null;
  tournamentHistory?: string | null;
}

export interface ClubNoticeUnreadCountResponse {
  unreadCount: number;
}

export interface ClubContentUnreadCountResponse {
  noticeUnreadCount: number;
  ruleUnreadCount: number;
  totalUnreadCount: number;
}

export const clubService = {
  // 클럽 생성 (로그인 필요)
  createClub: async (data: CreateClubRequest): Promise<Club> => {
    const response = await axiosInstance.post('/clubs', data);
    return response.data;
  },

  // 클럽 정보 수정 (운영진 이상)
  updateClub: async (clubId: number, data: UpdateClubRequest): Promise<Club> => {
    const response = await axiosInstance.put(`/clubs/${clubId}`, data);
    return response.data;
  },

  // 클럽 운영 정책 수정 (운영진 이상)
  updateClubPolicy: async (clubId: number, data: UpdateClubPolicyRequest): Promise<Club> => {
    const response = await axiosInstance.patch(`/clubs/${clubId}/policy`, data);
    return response.data;
  },

  // 클럽 어워드 정책 수정 (운영진 이상)
  updateAwardPolicy: async (clubId: number, data: UpdateAwardPolicyRequest): Promise<Club> => {
    const response = await axiosInstance.patch(`/clubs/${clubId}/award-policy`, data);
    return response.data;
  },

  // ---- 외부요청 / 게스트 모집 ----
  listExternalRequests: async (
    clubId: number,
    params?: { type?: ExternalRequestType; status?: ExternalRequestStatus; postId?: number }
  ): Promise<ExternalRequestResponse[]> => {
    const response = await axiosInstance.get(`/clubs/${clubId}/external-requests`, { params });
    return response.data;
  },

  approveExternalRequest: async (clubId: number, requestId: number, note?: string): Promise<ExternalRequestResponse> => {
    const response = await axiosInstance.post(`/clubs/${clubId}/external-requests/${requestId}/approve`, { note: note ?? null });
    return response.data;
  },

  rejectExternalRequest: async (clubId: number, requestId: number, note?: string): Promise<ExternalRequestResponse> => {
    const response = await axiosInstance.post(`/clubs/${clubId}/external-requests/${requestId}/reject`, { note: note ?? null });
    return response.data;
  },

  applyGuestRecruit: async (clubId: number, scheduleId: number): Promise<ExternalRequestResponse> => {
    const response = await axiosInstance.post(`/clubs/${clubId}/guest-recruit/${scheduleId}/apply`);
    return response.data;
  },

  cancelGuestRecruit: async (clubId: number, scheduleId: number): Promise<ExternalRequestResponse> => {
    const response = await axiosInstance.delete(`/clubs/${clubId}/guest-recruit/${scheduleId}/apply`);
    return response.data;
  },

  getMyGuestRecruitRequest: async (clubId: number, scheduleId: number): Promise<ExternalRequestResponse> => {
    const response = await axiosInstance.get(`/clubs/${clubId}/guest-recruit/${scheduleId}/my-request`);
    return response.data;
  },

  createGuestRecruitInquiry: async (clubId: number, scheduleId: number, content: string): Promise<Post> => {
    const response = await axiosInstance.post(`/clubs/${clubId}/guest-recruit/${scheduleId}/inquiry`, { content });
    return response.data;
  },

  // ---- 교류전 모집 ----
  applyInterclubRecruit: async (clubId: number, scheduleId: number): Promise<ExternalRequestResponse> => {
    const response = await axiosInstance.post(`/clubs/${clubId}/interclub-recruit/${scheduleId}/apply`);
    return response.data;
  },

  cancelInterclubRecruit: async (clubId: number, scheduleId: number): Promise<ExternalRequestResponse> => {
    const response = await axiosInstance.delete(`/clubs/${clubId}/interclub-recruit/${scheduleId}/apply`);
    return response.data;
  },

  getMyInterclubRecruitRequest: async (clubId: number, scheduleId: number): Promise<ExternalRequestResponse> => {
    const response = await axiosInstance.get(`/clubs/${clubId}/interclub-recruit/${scheduleId}/my-request`);
    return response.data;
  },

  createInterclubRecruitInquiry: async (clubId: number, scheduleId: number, content: string): Promise<Post> => {
    const response = await axiosInstance.post(`/clubs/${clubId}/interclub-recruit/${scheduleId}/inquiry`, { content });
    return response.data;
  },

  // ---- 가입 문의 (클럽 단위, 1 사용자 1 스레드) ----
  getMyJoinRequest: async (clubId: number): Promise<ExternalRequestResponse> => {
    const response = await axiosInstance.get(`/clubs/${clubId}/join/my-request`);
    return response.data;
  },

  createJoinInquiry: async (clubId: number, content: string): Promise<Post> => {
    const response = await axiosInstance.post(`/clubs/${clubId}/join/inquiry`, { content });
    return response.data;
  },

  // 클럽 회원 목록 조회 (ACTIVE 상태만)
  getClubMembers: async (clubId: number): Promise<UserResponse[]> => {
    const response = await axiosInstance.get(`/clubs/${clubId}/members`, {
      params: { status: 'ACTIVE' }
    });
    return response.data;
  },

  // 클럽 회칙 관련
  getClubRules: async (clubId: number): Promise<ClubRule[]> => {
    const response = await axiosInstance.get(`/clubs/${clubId}/rules`);
    return response.data;
  },

  createClubRule: async (clubId: number, data: CreateClubRuleRequest): Promise<ClubRule> => {
    const response = await axiosInstance.post(`/clubs/${clubId}/rules`, data);
    return response.data;
  },

  updateClubRule: async (clubId: number, ruleId: number, data: UpdateClubRuleRequest): Promise<ClubRule> => {
    const response = await axiosInstance.put(`/clubs/${clubId}/rules/${ruleId}`, data);
    return response.data;
  },

  deleteClubRule: async (clubId: number, ruleId: number): Promise<void> => {
    await axiosInstance.delete(`/clubs/${clubId}/rules/${ruleId}`);
  },

  reorderClubRules: async (clubId: number, data: ReorderClubRulesRequest): Promise<void> => {
    await axiosInstance.patch(`/clubs/${clubId}/rules/reorder`, data);
  },

  // 클럽 공지사항 관련
  getClubNotices: async (clubId: number): Promise<ClubNotice[]> => {
    const response = await axiosInstance.get(`/clubs/${clubId}/notices`);
    return response.data;
  },

  createClubNotice: async (clubId: number, data: CreateClubNoticeRequest): Promise<ClubNotice> => {
    const response = await axiosInstance.post(`/clubs/${clubId}/notices`, data);
    return response.data;
  },

  updateClubNotice: async (clubId: number, noticeId: number, data: UpdateClubNoticeRequest): Promise<ClubNotice> => {
    const response = await axiosInstance.put(`/clubs/${clubId}/notices/${noticeId}`, data);
    return response.data;
  },

  deleteClubNotice: async (clubId: number, noticeId: number): Promise<void> => {
    await axiosInstance.delete(`/clubs/${clubId}/notices/${noticeId}`);
  },

  getClubNoticeUnreadCount: async (clubId: number): Promise<ClubNoticeUnreadCountResponse> => {
    const response = await axiosInstance.get(`/clubs/${clubId}/notices/unread-count`);
    return response.data;
  },

  markClubNoticesRead: async (clubId: number, upToNoticeId?: number): Promise<void> => {
    await axiosInstance.post(`/clubs/${clubId}/notices/mark-read`, {
      upToNoticeId: upToNoticeId ?? null,
    });
  },

  // 회칙 unread count 조회
  getClubRuleUnreadCount: async (clubId: number): Promise<number> => {
    const response = await axiosInstance.get(`/clubs/${clubId}/rules/unread-count`);
    return response.data;
  },

  // 공지사항 + 회칙 통합 unread count (프론트엔드에서 합산)
  getClubContentUnreadCount: async (clubId: number): Promise<ClubContentUnreadCountResponse> => {
    const [noticeRes, ruleCount] = await Promise.all([
      axiosInstance.get(`/clubs/${clubId}/notices/unread-count`),
      axiosInstance.get(`/clubs/${clubId}/rules/unread-count`),
    ]);
    const noticeUnreadCount = noticeRes.data.unreadCount;
    const ruleUnreadCount = ruleCount.data;
    return {
      noticeUnreadCount,
      ruleUnreadCount,
      totalUnreadCount: noticeUnreadCount + ruleUnreadCount,
    };
  },

  // 회칙 읽음 처리
  markClubRulesRead: async (clubId: number, upToRuleId?: number): Promise<void> => {
    await axiosInstance.post(`/clubs/${clubId}/rules/mark-read`, {
      upToRuleId: upToRuleId ?? null,
    });
  },

  // 어워드 랭킹 조회
  getAwardRankings: async (
    clubId: number,
    params?: {
      type?: AwardType;
      startDate?: string;
      endDate?: string;
      limit?: number;
    }
  ): Promise<AwardRankingResponse[]> => {
    const response = await axiosInstance.get(`/clubs/${clubId}/awards`, { params });
    return response.data;
  },
};
