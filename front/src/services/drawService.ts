import axios from './api/axiosInstance';

export interface DrawGame {
  gameNo: number;
  roundNo: number;
  teamA: string[];
  teamB: string[];
  matchId?: number;  // 경기 결과 입력을 위한 Match ID
}

export interface DrawResponse {
  games: DrawGame[];
}

export interface CreateDrawRequest {
  userNames: string[];
  seedUserNames?: string[];
  drawType: 'AA' | 'AB' | 'SEED';
  groupAUserNames?: string[];
  groupBUserNames?: string[];
  numberOfTotalPlayer: number;
}

export interface UpdateMatchRequest {
  teamAScore: number;
  teamBScore: number;
  result: 'TEAM_A_WIN' | 'TEAM_B_WIN' | 'DRAW';
  playedAt?: string;
}

class DrawService {
  // 일반 사용자용 대진 생성 (DB 저장 안함)
  async createDraw(request: CreateDrawRequest): Promise<DrawResponse> {
    const response = await axios.post<DrawResponse>('/draw', request);
    return response.data;
  }

  // 클럽용 대진 생성 (DB 저장)
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
  ): Promise<void> {
    await axios.put(
      `/clubs/${clubId}/matches/${matchId}`,
      request
    );
  }
}

export const drawService = new DrawService();
