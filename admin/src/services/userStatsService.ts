import api from "./api";

/**
 * 사용자 통계 응답 타입
 */
export interface UserStatsResponse {
  totalUsers: number;
  totalClubs: number;
  dau: number;  // Daily Active Users
  wau: number;  // Weekly Active Users
  mau: number;  // Monthly Active Users
  newUsersToday: number;
  newUsersThisWeek: number;
  newUsersThisMonth: number;
}

/**
 * 사용자 통계 조회
 */
export async function getUserStats(): Promise<UserStatsResponse> {
  const { data } = await api.get<UserStatsResponse>("/admin/users/stats");
  return data;
}
