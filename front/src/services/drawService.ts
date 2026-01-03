import axios from "./api/axiosInstance";

export interface DrawGame {
  gameNo: number;
  roundNo: number;
  teamA: string[];
  teamB: string[];
  matchId?: number; // 경기 결과 입력을 위한 Match ID
  teamAScore?: number;
  teamBScore?: number;
  result?: "TEAM_A_WIN" | "TEAM_B_WIN" | "DRAW";
  playedAt?: string;
}

export interface DrawResponse {
  games: DrawGame[];
}

export interface CreateDrawRequest {
  userNames: string[];
  seedUserNames?: string[];
  drawType: "AA" | "AB" | "SEED";
  groupAUserNames?: string[];
  groupBUserNames?: string[];
  numberOfTotalPlayer: number;
}

export interface CreateDrawRequestWithIds {
  userIds: number[];
  seedUserIds?: number[];
  drawType: "AA" | "AB" | "SEED";
  groupAUserIds?: number[];
  groupBUserIds?: number[];
  numberOfTotalPlayer: number;
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

class DrawService {
  // 일반 사용자용 대진 생성 (DB 저장 안함)
  async createDraw(request: CreateDrawRequest): Promise<DrawResponse> {
    const response = await axios.post<DrawResponse>("/draw", request);
    return response.data;
  }

  // 클럽용 대진 생성 (DB 저장) - userName 기반 (기존 API)
  async createDrawWithSchedule(
    scheduleId: number,
    request: CreateDrawRequest
  ): Promise<DrawResponse> {
    const response = await axios.post<DrawResponse>(
      `/schedules/${scheduleId}/draw`,
      request
    );
    return response.data;
  }

  // 클럽용 대진 생성 (DB 저장) - userId 기반 (신규 API, 동명이인 문제 해결)
  async createDrawWithScheduleByIds(
    scheduleId: number,
    request: CreateDrawRequestWithIds
  ): Promise<DrawResponse> {
    const response = await axios.post<DrawResponse>(
      `/schedules/${scheduleId}/draw/with-ids`,
      request
    );
    return response.data;
  }

  // 일정의 대진표 조회
  async getDraw(scheduleId: number): Promise<DrawResponse> {
    const response = await axios.get<DrawResponse>(
      `/schedules/${scheduleId}/draw`
    );
    return response.data;
  }

  // 경기 결과 업데이트
  async updateMatchResult(
    clubId: number,
    matchId: number,
    request: UpdateMatchRequest
  ): Promise<MatchResponse> {
    const response = await axios.put<MatchResponse>(
      `/clubs/${clubId}/matches/${matchId}`,
      request
    );
    return response.data;
  }

  // 경기 결과 배치 업데이트
  async updateMatchResultsBatch(
    clubId: number,
    request: BatchUpdateMatchRequest
  ): Promise<MatchResponse[]> {
    const response = await axios.put<MatchResponse[]>(
      `/clubs/${clubId}/matches/batch`,
      request
    );
    return response.data;
  }

  // 경기 결과 삭제 (초기화)
  async deleteMatchResult(clubId: number, matchId: number): Promise<void> {
    await axios.delete(`/clubs/${clubId}/matches/${matchId}/result`);
  }
}

export const drawService = new DrawService();
