import axiosInstance from './api/axiosInstance';

export interface UserResponse {
  id: number;
  name: string;
  email: string | null;
  imageUrl: string | null;
}

export interface UserTotalStats {
  wins: number;
  draws: number;
  losses: number;
  totalMatches: number;
}

export interface MyAllMatch {
  matchId: number;
  clubId: number;
  clubName: string;
  playedAt: string;
  teamAPlayer1Name: string;
  teamAPlayer2Name: string | null;
  teamAScore: number;
  teamBPlayer1Name: string;
  teamBPlayer2Name: string | null;
  teamBScore: number;
  result: string;
}

export interface MyAllMatchPageResponse {
  content: MyAllMatch[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  hasMore: boolean;
}

export interface UserPublicProfile {
  id: number;
  displayName: string;
  region: string | null;
  publicScheduleCount: number;
  createdAt: string;
}

export const userService = {
  // 게스트 사용자 목록 조회 (게스트1~16)
  getGuestUsers: async (): Promise<UserResponse[]> => {
    const response = await axiosInstance.get('/users/guests');
    return response.data;
  },

  // 개인 전체 통계 조회 (모든 클럽 합산)
  getMyTotalStats: async (): Promise<UserTotalStats> => {
    const response = await axiosInstance.get<UserTotalStats>('/users/me/stats/total');
    return response.data;
  },

  // 개인 전체 경기 기록 조회 (모든 클럽, 페이징)
  getMyAllMatches: async (page: number, size: number): Promise<MyAllMatchPageResponse> => {
    const response = await axiosInstance.get<MyAllMatchPageResponse>('/users/me/matches/all', {
      params: { page, size }
    });
    return response.data;
  },

  // 사용자 공개 프로필 조회
  getUserPublicProfile: async (userId: number): Promise<UserPublicProfile> => {
    const response = await axiosInstance.get<UserPublicProfile>(`/users/${userId}/public-profile`);
    return response.data;
  },

  // 운영자 공개 프로필 조회 (인증 불필요)
  getOperatorProfile: async (): Promise<UserPublicProfile> => {
    const response = await axiosInstance.get<UserPublicProfile>("/users/operator-profile");
    return response.data;
  },
};
