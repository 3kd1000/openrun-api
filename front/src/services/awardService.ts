import axiosInstance from "./api/axiosInstance";
import type { AwardRankingResponse, AwardType, AwardPeriod, RankingPeriod, RankingCustomSeason } from "../types/club";

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
 * 멤버별 누적 업적
 */
export interface MemberAchievement {
  userId: number;
  userName: string;
  awardCounts: Record<AwardType, number>;  // 어워드 타입별 수상 횟수
  primaryAward: AwardType | null;  // 대표 업적 (가장 높은 티어)
  primaryTier: number;  // 대표 티어 (1~5)
}

/**
 * 누적 업적 응답 DTO
 */
export interface CumulativeAchievementResponse {
  members: MemberAchievement[];
}

/**
 * 티어 정보
 */
export type TierLevel = 1 | 2 | 3 | 4 | 5;
export type TierName = "bronze" | "silver" | "gold" | "platinum" | "rainbow";

export const TIER_CONFIG: Record<TierLevel, { name: TierName; label: string; color: string }> = {
  1: { name: "bronze", label: "브론즈", color: "#CD7F32" },
  2: { name: "silver", label: "실버", color: "#C0C0C0" },
  3: { name: "gold", label: "골드", color: "#FFD700" },
  4: { name: "platinum", label: "플래티넘", color: "#E5E4E2" },
  5: { name: "rainbow", label: "레인보우", color: "linear-gradient(90deg, #ff0000, #ff7f00, #ffff00, #00ff00, #0000ff, #4b0082, #9400d3)" },
};

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
    count: number = 5,
    clubCreatedAt?: string
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

    // 클럽 생성일 이전 시즌 필터링
    if (clubCreatedAt) {
      const createdDate = clubCreatedAt.substring(0, 10);
      return options.filter((opt) => opt.endDate >= createdDate);
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

  // ==================== 누적 업적 API ====================

  /**
   * 클럽 내 전체 멤버의 누적 업적 조회
   */
  async getCumulativeAchievements(clubId: number): Promise<CumulativeAchievementResponse> {
    const response = await axiosInstance.get<CumulativeAchievementResponse>(
      `/clubs/${clubId}/awards/achievements`
    );
    return response.data;
  },

  /**
   * 특정 사용자의 상세 업적 조회 (수상 이력)
   */
  async getUserAchievements(clubId: number, userId: number): Promise<AwardWinnerResponse[]> {
    const response = await axiosInstance.get<AwardWinnerResponse[]>(
      `/clubs/${clubId}/awards/achievements/${userId}`
    );
    return response.data;
  },

  /**
   * 수상 횟수에 따른 티어 계산
   * 1회 = 브론즈 (Tier 1)
   * 2회 = 실버 (Tier 2)
   * 3회 = 골드 (Tier 3)
   * 4회 = 플래티넘 (Tier 4)
   * 5회+ = 레인보우 (Tier 5)
   */
  calculateTier(awardCount: number): TierLevel {
    if (awardCount <= 0) return 1;
    if (awardCount >= 5) return 5;
    return awardCount as TierLevel;
  },

  /**
   * 티어 정보 반환
   */
  getTierInfo(tier: TierLevel): { name: TierName; label: string; color: string } {
    return TIER_CONFIG[tier];
  },

  /**
   * 티어 이름 반환 (영문)
   */
  getTierName(tier: number): TierName {
    const validTier = Math.min(5, Math.max(1, tier)) as TierLevel;
    return TIER_CONFIG[validTier].name;
  },

  /**
   * 랭킹 주기별 기간 옵션 생성
   * 어워드와 달리 현재 진행 중인 기간을 첫 번째로 포함
   */
  generateRankingPeriodOptions(
    periodType: RankingPeriod,
    count: number = 6,
    customSeasons?: RankingCustomSeason[],
    clubCreatedAt?: string
  ): AwardPeriodOption[] {
    const options: AwardPeriodOption[] = [];
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1; // 1~12

    const pad = (n: number) => String(n).padStart(2, "0");
    const lastDay = (year: number, month: number) =>
      new Date(year, month, 0).getDate();

    if (periodType === "MONTHLY") {
      let year = currentYear;
      let month = currentMonth;
      for (let i = 0; i < count; i++) {
        options.push({
          label: `${year}년 ${month}월`,
          startDate: `${year}-${pad(month)}-01`,
          endDate: `${year}-${pad(month)}-${lastDay(year, month)}`,
        });
        month--;
        if (month < 1) { month = 12; year--; }
      }
    } else if (periodType === "QUARTERLY") {
      const currentQ = Math.ceil(currentMonth / 3);
      let year = currentYear;
      let q = currentQ;
      const qLabels = ["1분기", "2분기", "3분기", "4분기"];
      for (let i = 0; i < count; i++) {
        const startMonth = (q - 1) * 3 + 1;
        const endMonth = q * 3;
        options.push({
          label: `${year}년 ${qLabels[q - 1]}`,
          startDate: `${year}-${pad(startMonth)}-01`,
          endDate: `${year}-${pad(endMonth)}-${lastDay(year, endMonth)}`,
        });
        q--;
        if (q < 1) { q = 4; year--; }
      }
    } else if (periodType === "HALF_YEAR") {
      const isFirstHalf = currentMonth <= 6;
      let year = currentYear;
      let first = isFirstHalf;
      for (let i = 0; i < count; i++) {
        if (first) {
          options.push({
            label: `${year}년 상반기`,
            startDate: `${year}-01-01`,
            endDate: `${year}-06-30`,
          });
          first = false;
          year--;
        } else {
          options.push({
            label: `${year}년 하반기`,
            startDate: `${year}-07-01`,
            endDate: `${year}-12-31`,
          });
          first = true;
        }
      }
    } else if (periodType === "YEARLY") {
      for (let i = 0; i < count; i++) {
        const year = currentYear - i;
        options.push({
          label: `${year}년`,
          startDate: `${year}-01-01`,
          endDate: `${year}-12-31`,
        });
      }
    } else if (periodType === "CUSTOM" && customSeasons && customSeasons.length > 0) {
      // 현재 날짜가 속하는 시즌 찾기, 그 시즌부터 과거 순으로 나열
      const findCurrentSeasonIndex = (): number => {
        for (let i = 0; i < customSeasons.length; i++) {
          const s = customSeasons[i];
          if (s.startMonth <= s.endMonth) {
            // 같은 연도 시즌 (예: 2~5월)
            if (currentMonth >= s.startMonth && currentMonth <= s.endMonth) return i;
          } else {
            // 연도 경계 시즌 (예: 12~1월)
            if (currentMonth >= s.startMonth || currentMonth <= s.endMonth) return i;
          }
        }
        return 0;
      };

      const currentIdx = findCurrentSeasonIndex();
      let year = currentYear;
      let idx = currentIdx;

      for (let i = 0; i < count; i++) {
        const season = customSeasons[idx];
        const isWrapAround = season.startMonth > season.endMonth;

        let startYear = year;
        let endYear = year;
        if (isWrapAround) {
          // 연도 경계: 현재월이 endMonth 이하면 시작은 전년도
          if (i === 0 && currentMonth <= season.endMonth) {
            startYear = year - 1;
          } else {
            endYear = year + 1;
            // 첫 번째가 아닌 경우 과거로 이동 중이므로 endYear = year, startYear = year -1 이 아니라
            // 이미 year가 감소되어 있으므로 endYear = year + 1
          }
        }

        options.push({
          label: `${startYear} ${season.name} (${season.startMonth}~${season.endMonth}월)`,
          startDate: `${startYear}-${pad(season.startMonth)}-01`,
          endDate: `${endYear}-${pad(season.endMonth)}-${lastDay(endYear, season.endMonth)}`,
        });

        // 과거로 이동
        idx--;
        if (idx < 0) {
          idx = customSeasons.length - 1;
          year--;
        }
      }
    }

    // 클럽 생성일 이전 시즌 필터링
    if (clubCreatedAt) {
      const createdDate = clubCreatedAt.substring(0, 10); // YYYY-MM-DD
      return options.filter((opt) => opt.endDate >= createdDate);
    }

    return options;
  },
};
