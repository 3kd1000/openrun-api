import axiosInstance from "@/services/api/axiosInstance";
import type { MatchPageResponse } from "@/lib/types/match";

export interface DrawGame {
  gameNo: number;
  roundNo: number;
  teamA: string[];
  teamB: string[];
  matchId?: number;
  teamAScore?: number;
  teamBScore?: number;
  result?: "TEAM_A_WIN" | "TEAM_B_WIN" | "DRAW";
  playedAt?: string;
}

export interface DrawResponse {
  games: DrawGame[];
}

export type DrawType = "AA" | "AB" | "SEED" | "MANUAL";

export interface ManualGame {
  gameNo: number;
  roundNo: number;
  teamAUserIds: number[];
  teamBUserIds: number[];
}

export interface CreateDrawRequest {
  userNames: string[];
  seedUserNames?: string[];
  drawType: DrawType;
  groupAUserNames?: string[];
  groupBUserNames?: string[];
  numberOfTotalPlayer: number;
}

export interface CreateDrawRequestWithIds {
  userIds: number[];
  seedUserIds?: number[];
  drawType: DrawType;
  groupAUserIds?: number[];
  groupBUserIds?: number[];
  numberOfTotalPlayer: number;
  manualGames?: ManualGame[];
}

export interface UpdateMatchRequest {
  teamAScore: number;
  teamBScore: number;
  result: "TEAM_A_WIN" | "TEAM_B_WIN" | "DRAW";
  playedAt?: string;
}

export interface BatchUpdateMatchItem {
  matchId: number;
  request: UpdateMatchRequest;
}

export interface BatchUpdateMatchRequest {
  matches: BatchUpdateMatchItem[];
}

export interface MatchResponse {
  id: number;
  clubId: number;
  scheduleId: number;
  drawId: number;
  matchNumber: number;
  teamAPlayer1Name: string;
  teamAPlayer2Name?: string;
  teamBPlayer1Name: string;
  teamBPlayer2Name?: string;
  teamAScore?: number;
  teamBScore?: number;
  result?: string;
  playedAt?: string;
}

/** 일반 대진표 생성 (DB 미저장) */
export const createDraw = async (
  request: CreateDrawRequest
): Promise<DrawResponse> => {
  const response = await axiosInstance.post<DrawResponse>("/draws", request);
  return response.data;
};

/** 클럽 일정에 대진표 생성 (DB 저장, userName 기반) */
export const createDrawWithSchedule = async (
  scheduleId: number,
  request: CreateDrawRequest
): Promise<DrawResponse> => {
  const response = await axiosInstance.post<DrawResponse>(
    `/schedules/${scheduleId}/draws`,
    request
  );
  return response.data;
};

/** 클럽 일정에 대진표 생성 (DB 저장, userId 기반) */
export const createDrawWithScheduleByIds = async (
  scheduleId: number,
  request: CreateDrawRequestWithIds
): Promise<DrawResponse> => {
  const response = await axiosInstance.post<DrawResponse>(
    `/schedules/${scheduleId}/draws/by-ids`,
    request
  );
  return response.data;
};

/** 일정의 대진표 조회 */
export const getDraw = async (
  scheduleId: number
): Promise<DrawResponse> => {
  const response = await axiosInstance.get<DrawResponse>(
    `/schedules/${scheduleId}/draws`
  );
  return response.data;
};

/** 매치 결과 수정 */
export const updateMatchResult = async (
  clubId: number,
  matchId: number,
  request: UpdateMatchRequest
): Promise<MatchResponse> => {
  const response = await axiosInstance.put<MatchResponse>(
    `/clubs/${clubId}/matches/${matchId}`,
    request
  );
  return response.data;
};

/** 매치 결과 일괄 수정 */
export const updateMatchResultsBatch = async (
  clubId: number,
  request: BatchUpdateMatchRequest
): Promise<MatchResponse[]> => {
  const response = await axiosInstance.put<MatchResponse[]>(
    `/clubs/${clubId}/matches/batch`,
    request
  );
  return response.data;
};

/** 매치 결과 삭제 */
export const deleteMatchResult = async (
  clubId: number,
  matchId: number
): Promise<void> => {
  await axiosInstance.delete(`/clubs/${clubId}/matches/${matchId}`);
};

/** 매치 검색 */
export const searchMatches = async (
  clubId: number,
  params?: {
    playerName?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    size?: number;
  }
): Promise<MatchPageResponse> => {
  const response = await axiosInstance.get<MatchPageResponse>(
    `/clubs/${clubId}/matches`,
    { params }
  );
  return response.data;
};
