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
   * 과거 정산 기간 목록 생성
   * 현재 기간 + 과거 N개 기간 반환
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
      // 반기별 옵션
      let year = currentYear;
      let isFirstHalf = currentMonth <= 6;

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
      // 연간 옵션
      for (let i = 0; i < count; i++) {
        const year = currentYear - i;
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
};
