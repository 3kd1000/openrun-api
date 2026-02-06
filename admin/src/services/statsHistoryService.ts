import api from "./api";

/**
 * 일별 통계 아이템
 */
export interface DailyStatsItem {
  date: string;
  totalUsers: number;
  totalClubs: number;
  dau: number;
  wau: number;
  mau: number;
  newUsers: number;
  newClubs: number;
}

/**
 * 요약 정보
 */
export interface StatsSummary {
  startTotalUsers: number;
  endTotalUsers: number;
  userGrowth: number;
  startTotalClubs: number;
  endTotalClubs: number;
  clubGrowth: number;
  avgDau: number;
  avgMau: number;
  totalNewUsers: number;
  totalNewClubs: number;
}

/**
 * 통계 히스토리 응답
 */
export interface StatsHistoryResponse {
  period: string;
  startDate: string | null;
  endDate: string | null;
  items: DailyStatsItem[];
  summary: StatsSummary | null;
}

/**
 * 통계 히스토리 조회
 * @param period 조회 기간 (1M, 3M, 6M, 1Y)
 */
export async function getStatsHistory(period: string = "1M"): Promise<StatsHistoryResponse> {
  const { data } = await api.get<StatsHistoryResponse>("/admin/users/stats/history", {
    params: { period }
  });
  return data;
}
