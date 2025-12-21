import axios from './api/axiosInstance';

export interface DrawGame {
  gameNo: number;
  roundNo: number;
  teamA: string[];
  teamB: string[];
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
}

export const drawService = new DrawService();
