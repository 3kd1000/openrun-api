import axiosInstance from './axiosInstance';

/**
 * 연락처 공개 범위
 * - PRIVATE: 비공개 (나만 볼 수 있음)
 * - PUBLIC: 공개 (클럽원 및 게스트 참여 시 공유)
 */
export type ContactVisibility = 'PRIVATE' | 'PUBLIC';

export interface UserProfile {
  id: number;
  email: string;
  name: string;
  imageUrl: string | null;
  phoneNumber?: string | null;
  phoneVisibility?: ContactVisibility;
  emailVisibility?: ContactVisibility;
  gender?: 'MALE' | 'FEMALE' | 'PRIVATE';
  createdAt: string;
  updatedAt: string;
}

export interface UserTennisProfile {
  tennisStartedAt: string | null; // ISO date string (YYYY-MM-DD). UI에서는 YYYY-MM로 다룸
  ntrp: string | null;
  tournamentHistory: string | null;
  formerPlayer: boolean;
}

export interface UpdateUserTennisProfileRequest {
  tennisStartedAt: string | null; // ISO date string (YYYY-MM-DD)
  ntrp: string | null;
  tournamentHistory: string | null;
  formerPlayer: boolean | null;
}

export interface UpdateUserRequest {
  name: string;
  imageUrl: string | null;
  phoneNumber?: string | null;
  phoneVisibility?: ContactVisibility;
  emailVisibility?: ContactVisibility;
  gender?: 'MALE' | 'FEMALE' | 'PRIVATE';
}

export interface OAuthProvider {
  id: number;
  provider: string;
  createdAt: string;
}

export interface MyClub {
  id: number;
  name: string;
  description: string | null;
  createdAt: string;
}

/**
 * 현재 사용자 정보 조회
 */
export const getCurrentUser = async (): Promise<UserProfile> => {
  const response = await axiosInstance.get<UserProfile>('/users/me');
  return response.data;
};

/**
 * 사용자 정보 수정
 */
export const updateUser = async (data: UpdateUserRequest): Promise<UserProfile> => {
  const response = await axiosInstance.put<UserProfile>('/users/me', data);
  return response.data;
};

/**
 * 내 테니스 프로필(user_profile) 조회
 */
export const getMyTennisProfile = async (): Promise<UserTennisProfile> => {
  const response = await axiosInstance.get<UserTennisProfile>('/users/me/profile');
  return response.data;
};

/**
 * 내 테니스 프로필(user_profile) 수정
 */
export const updateMyTennisProfile = async (data: UpdateUserTennisProfileRequest): Promise<UserTennisProfile> => {
  const response = await axiosInstance.put<UserTennisProfile>('/users/me/profile', data);
  return response.data;
};

/**
 * OAuth 제공자 목록 조회
 */
export const getOAuthProviders = async (): Promise<OAuthProvider[]> => {
  const response = await axiosInstance.get<OAuthProvider[]>('/users/me/oauth-providers');
  return response.data;
};

/**
 * 내가 가입한 클럽 목록 조회
 */
export const getMyClubs = async (): Promise<MyClub[]> => {
  const response = await axiosInstance.get<MyClub[]>('/users/me/clubs');
  return response.data;
};

/**
 * 내가 참가한 모든 일정 조회 (개인일정)
 * - ScheduleParticipant + ExternalRequest 조합
 * - 클럽 멤버로 참가한 일정 + 게스트로 신청한 일정
 *
 * @param upcoming true면 미래 일정만 조회
 */
export const getMySchedules = async (upcoming?: boolean): Promise<import('../../types/schedule').MyScheduleResponse[]> => {
  const response = await axiosInstance.get<import('../../types/schedule').MyScheduleResponse[]>('/users/me/schedules', {
    params: upcoming !== undefined ? { upcoming } : undefined
  });
  return response.data;
};

/**
 * 클럽 멤버 프로필 (user + user_profile + membership 통합)
 */
export interface MemberProfile {
  // User 기본 정보
  id: number;
  name: string;
  email: string | null;         // 공개범위에 따라 null 가능
  imageUrl: string | null;
  phoneNumber: string | null;    // 공개범위에 따라 null 가능
  gender: 'MALE' | 'FEMALE' | 'PRIVATE' | null;

  // Tennis Profile (user_profile)
  tennisStartedAt: string | null;
  ntrp: string | null;
  tournamentHistory: string | null;
  formerPlayer: boolean;

  // Club Membership 정보
  role: 'OWNER' | 'ADMIN' | 'MEMBER' | 'REGULAR';
  joinedAt: string;
}

/**
 * 클럽 멤버의 프로필 조회
 * - 공개범위(PRIVATE/PUBLIC)에 따라 email/phoneNumber 필터링됨
 * - PUBLIC: 클럽원 + 게스트 참여 시 공유
 */
export const getClubMemberProfile = async (
  clubId: number,
  userId: number
): Promise<MemberProfile> => {
  const response = await axiosInstance.get<MemberProfile>(
    `/clubs/${clubId}/members/${userId}`
  );
  return response.data;
};
