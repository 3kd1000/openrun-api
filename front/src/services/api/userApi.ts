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
  birthDate?: string | null; // YYMMDD 형식
  birthDateVisibility?: ContactVisibility;
  regionDepth1?: string | null;
  regionDepth2?: string | null;
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
  birthDate?: string | null; // YYMMDD 형식
  birthDateVisibility?: ContactVisibility;
  regionDepth1?: string | null;
  regionDepth2?: string | null;
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
  role: string;  // 해당 클럽에서 나의 역할 (OWNER, ADMIN, REGULAR)
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
 * 사용자 활동 기록 업데이트
 * - 앱 활성화 시 (토큰 갱신 후) 호출
 * - DAU 집계에 사용됨
 */
export const updateUserActivity = async (): Promise<void> => {
  await axiosInstance.post('/users/me/activity');
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
 * 클럽 목록을 조회해서 세션에 저장 (로그인/토큰갱신/가입/탈퇴 시 호출)
 * @returns 클럽 목록
 */
export const syncClubList = async (): Promise<MyClub[]> => {
  const { updateClubList } = await import('../../utils/openrunSession');
  try {
    const clubs = await getMyClubs();
    updateClubList(clubs.map(c => ({ id: c.id, name: c.name })));
    console.log(`✅ clubList 동기화 완료: ${clubs.length}개 클럽`);
    return clubs;
  } catch (error) {
    console.error('❌ clubList 동기화 실패:', error);
    // 실패해도 기존 세션 유지
    return [];
  }
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
 * 내 최근 전적 응답 타입
 */
export interface MyRecentMatchResponse {
  matchId: number;
  scheduleId: number | null;
  playedAt: string | null;
  myPartnerName: string | null;
  opponent1Name: string;
  opponent2Name: string | null;
  myTeamScore: number;
  opponentTeamScore: number;
  result: 'WIN' | 'LOSE' | 'DRAW';
}

/**
 * 특정 클럽에서의 내 최근 전적 조회
 *
 * @param clubId 클럽 ID
 * @param limit 조회할 경기 수 (기본 5)
 */
export const getMyRecentMatches = async (clubId: number, limit?: number): Promise<MyRecentMatchResponse[]> => {
  const response = await axiosInstance.get<MyRecentMatchResponse[]>('/users/me/matches', {
    params: { clubId, limit: limit ?? 5 }
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
  birthDate: string | null;      // 공개범위에 따라 null 가능 (YYMMDD)
  regionDepth1: string | null;   // 지역 (시/도)
  regionDepth2: string | null;   // 지역 (시/군/구)

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

// ==================== 회원 탈퇴 관련 ====================

/**
 * 소유한 클럽 정보 (탈퇴 체크용)
 */
export interface OwnedClubInfo {
  clubId: number;
  clubName: string;
  memberCount: number;
}

/**
 * 회원 탈퇴 가능 여부 체크 응답
 */
export interface WithdrawalCheckResponse {
  canWithdraw: boolean;
  reason?: string;
  ownedClubsWithMembers?: OwnedClubInfo[];  // 양도가 필요한 클럽 (다른 멤버 있음)
  ownedClubsToDelete?: OwnedClubInfo[];     // 탈퇴 시 삭제될 클럽 (본인만 있음)
}

/**
 * 회원 탈퇴 가능 여부 체크
 * - 클럽 소유자인 경우: 다른 멤버가 있으면 탈퇴 불가 (양도 필요)
 * - 탈퇴 시 삭제될 클럽 목록 반환
 */
export const checkWithdrawal = async (): Promise<WithdrawalCheckResponse> => {
  const response = await axiosInstance.get<WithdrawalCheckResponse>('/users/me/withdrawal');
  return response.data;
};

/**
 * 회원 탈퇴 실행
 * - 소유한 클럽 중 본인만 있는 클럽 삭제
 * - 모든 클럽 멤버십 삭제
 * - 관련 데이터 익명화 (경기 기록 등)
 * - 사용자 계정 삭제
 */
export const withdrawUser = async (): Promise<void> => {
  await axiosInstance.delete('/users/me');
};
