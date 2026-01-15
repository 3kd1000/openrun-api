import axiosInstance from './axiosInstance';

export type ContactVisibility = 'PRIVATE' | 'CLUB_ONLY' | 'PUBLIC';

export interface UserProfile {
  id: number;
  email: string;
  name: string;
  imageUrl: string | null;
  phoneNumber?: string | null;
  phoneVisibility?: ContactVisibility;
  emailVisibility?: ContactVisibility;
  createdAt: string;
  updatedAt: string;
}

export type BackhandType = 'ONE_HAND' | 'TWO_HAND';

export interface UserTennisProfile {
  tennisStartedAt: string | null; // ISO date string (YYYY-MM-DD). UI에서는 YYYY-MM로 다룸
  backhandType: BackhandType | null;
  favoritePlayer: string | null;
  ntrp: string | null;
  tournamentHistory: string | null;
  formerPlayer: boolean;
}

export interface UpdateUserTennisProfileRequest {
  tennisStartedAt: string | null; // ISO date string (YYYY-MM-DD)
  backhandType: BackhandType | null;
  favoritePlayer: string | null;
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
