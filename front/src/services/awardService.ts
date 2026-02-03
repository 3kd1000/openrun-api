import axiosInstance from "./api/axiosInstance";
import type { AwardRankingResponse, AwardType, AwardPeriod } from "../types/club";

export interface AwardPeriodOption {
  label: string;
  startDate: string;  // YYYY-MM-DD
  endDate: string;    // YYYY-MM-DD
}

export interface WinnerDetail {
  type: AwardType;
  userId: number;
  userName: string;
  value: number;
}

export interface AwardWinnersResponse {
  period: AwardPeriod;
  startDate: string;
  endDate: string;
  winnerUserIds: number[];  // 모든 어워드 1등 user ID
  winners: WinnerDetail[];
}

/**
 * 수상자 저장 요청 DTO
 */
export interface SaveAwardWinnerRequest {
  awardType: AwardType;
  userId: number;
  periodStart: string;  // YYYY-MM-DD
  periodEnd: string;    // YYYY-MM-DD
  value?: number;       // 기록값 (선택)
}

/**
 * 수상자 수정 요청 DTO
 */
export interface UpdateAwardWinnerRequest {
  userId: number;
  value?: number;  // 기록값 (선택)
}

/**
 * 수상자 응답 DTO
 */
export interface AwardWinnerResponse {
  id: number;
  clubId: number;
  awardType: AwardType;
  userId: number;
  userName: string;
  periodStart: string;
  periodEnd: string;
  value: number;
  confirmedAt: string;
  confirmedByUserId: number;
}

/**
 * 어워드 관련 서비스
 */
export const awardService = {
  /**
   * 어워드 랭킹 조회
   * @param clubId 클럽 ID
   * @param type 어워드 타입 (생략 시 활성화된 모든 타입)
   * @param startDate 시작일 (생략 시 현재 정산 주기)
   * @param endDate 종료일 (생략 시 현재 정산 주기)
   * @param limit 조회 개수 (기본 10)
   */
  async getAwardRankings(
    clubId: number,
    type?: AwardType,
    startDate?: string,
    endDate?: string,
    limit: number = 10
  ): Promise<AwardRankingResponse[]> {
    const params: Record<string, string | number> = { limit };
    if (type) params.type = type;
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;

    const response = await axiosInstance.get<AwardRankingResponse[]>(
      `/clubs/${clubId}/awards`,
      { params }
    );
    return response.data;
  },

  /**
   * 과거 완료된 정산 기간 목록 생성
   * 현재 진행 중인 시즌은 제외하고 직전 완료 시즌부터 N개 반환
   */
  generatePeriodOptions(
    periodType: "HALF_YEAR" | "YEARLY",
    count: number = 5
  ): AwardPeriodOption[] {
    const options: AwardPeriodOption[] = [];
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    if (periodType === "HALF_YEAR") {
      // 현재 시즌 건너뛰고 직전 완료 시즌부터 시작
      let year: number;
      let isFirstHalf: boolean;

      if (currentMonth <= 6) {
        // 현재 상반기 → 직전 완료는 전년 하반기
        year = currentYear - 1;
        isFirstHalf = false;
      } else {
        // 현재 하반기 → 직전 완료는 올해 상반기
        year = currentYear;
        isFirstHalf = true;
      }

      for (let i = 0; i < count; i++) {
        if (isFirstHalf) {
          options.push({
            label: `${year}년 상반기`,
            startDate: `${year}-01-01`,
            endDate: `${year}-06-30`,
          });
          // 다음 반복: 전년 하반기
          isFirstHalf = false;
          year--;
        } else {
          options.push({
            label: `${year}년 하반기`,
            startDate: `${year}-07-01`,
            endDate: `${year}-12-31`,
          });
          // 다음 반복: 같은 연도 상반기
          isFirstHalf = true;
        }
      }
    } else {
      // 연간 옵션: 현재 연도 제외, 전년부터 시작
      for (let i = 0; i < count; i++) {
        const year = currentYear - 1 - i;
        options.push({
          label: `${year}년`,
          startDate: `${year}-01-01`,
          endDate: `${year}-12-31`,
        });
      }
    }

    return options;
  },

  /**
   * 어워드 타입 한글명
   */
  getAwardTypeName(type: AwardType): string {
    switch (type) {
      case "ATTENDANCE":
        return "최다 참석";
      case "POINTS":
        return "최다 승점";
      case "BOOKING":
        return "최다 예약";
      default:
        return type;
    }
  },

  /**
   * 어워드 타입 단위
   */
  getAwardTypeUnit(type: AwardType): string {
    switch (type) {
      case "ATTENDANCE":
        return "회";
      case "POINTS":
        return "점";
      case "BOOKING":
        return "회";
      default:
        return "";
    }
  },

  /**
   * 현재 정산 주기 어워드 수상자 조회
   * 크라운 배지 표시에 사용
   */
  async getCurrentWinners(clubId: number): Promise<AwardWinnersResponse> {
    const response = await axiosInstance.get<AwardWinnersResponse>(
      `/clubs/${clubId}/awards/winners`
    );
    return response.data;
  },

  // ==================== 수상자 관리 API ====================

  /**
   * 수상자 저장 (Admin용)
   */
  async saveAwardWinner(
    clubId: number,
    request: SaveAwardWinnerRequest
  ): Promise<AwardWinnerResponse> {
    const response = await axiosInstance.post<AwardWinnerResponse>(
      `/clubs/${clubId}/awards/manage`,
      request
    );
    return response.data;
  },

  /**
   * 특정 기간 수상자 조회 (Admin용)
   */
  async getAwardWinners(
    clubId: number,
    periodStart: string,
    periodEnd: string
  ): Promise<AwardWinnerResponse[]> {
    const response = await axiosInstance.get<AwardWinnerResponse[]>(
      `/clubs/${clubId}/awards/manage`,
      { params: { periodStart, periodEnd } }
    );
    return response.data;
  },

  /**
   * 모든 수상 기록 조회 (Admin용)
   */
  async getAllAwardWinners(clubId: number): Promise<AwardWinnerResponse[]> {
    const response = await axiosInstance.get<AwardWinnerResponse[]>(
      `/clubs/${clubId}/awards/manage/all`
    );
    return response.data;
  },

  /**
   * 수상자 수정 (Admin용)
   */
  async updateAwardWinner(
    clubId: number,
    winnerId: number,
    request: UpdateAwardWinnerRequest
  ): Promise<AwardWinnerResponse> {
    const response = await axiosInstance.put<AwardWinnerResponse>(
      `/clubs/${clubId}/awards/manage/${winnerId}`,
      request
    );
    return response.data;
  },

  /**
   * 수상자 삭제 (Admin용)
   */
  async deleteAwardWinner(clubId: number, winnerId: number): Promise<void> {
    await axiosInstance.delete(`/clubs/${clubId}/awards/manage/${winnerId}`);
  },

  /**
   * 어워드 타입 배지 라벨 (짧은 형태)
   */
  getAwardBadgeLabel(type: AwardType): string {
    switch (type) {
      case "ATTENDANCE":
        return "참여왕";
      case "POINTS":
        return "승점왕";
      case "BOOKING":
        return "예약왕";
      default:
        return type;
    }
  },
};
