import axiosInstance from "@/services/api/axiosInstance";

export interface AwardRankingResponse {
  userId: number;
  userName: string;
  imageUrl: string | null;
  type: string;
  count: number;
  rank: number;
}

export interface AwardWinnersResponse {
  periodStart: string;
  periodEnd: string;
  winners: AwardWinnerResponse[];
}

export interface AwardWinnerResponse {
  id: number;
  userId: number;
  userName: string;
  imageUrl: string | null;
  awardType: string;
  periodStart: string;
  periodEnd: string;
  note: string | null;
}

export interface SaveAwardWinnerRequest {
  userId: number;
  awardType: string;
  periodStart: string;
  periodEnd: string;
  note?: string;
}

export const getAwardRankings = async (
  clubId: number,
  type?: string,
  startDate?: string,
  endDate?: string,
  limit: number = 10
): Promise<AwardRankingResponse[]> => {
  const response = await axiosInstance.get<AwardRankingResponse[]>(
    `/clubs/${clubId}/awards`,
    { params: { type, startDate, endDate, limit } }
  );
  return response.data;
};

export const getCurrentWinners = async (
  clubId: number
): Promise<AwardWinnersResponse> => {
  const response = await axiosInstance.get<AwardWinnersResponse>(
    `/clubs/${clubId}/awards/winners`
  );
  return response.data;
};

export const saveAwardWinner = async (
  clubId: number,
  request: SaveAwardWinnerRequest
): Promise<AwardWinnerResponse> => {
  const response = await axiosInstance.post<AwardWinnerResponse>(
    `/clubs/${clubId}/awards/manage`,
    request
  );
  return response.data;
};

export const getAwardWinners = async (
  clubId: number,
  periodStart?: string,
  periodEnd?: string
): Promise<AwardWinnerResponse[]> => {
  const response = await axiosInstance.get<AwardWinnerResponse[]>(
    `/clubs/${clubId}/awards/manage`,
    { params: { periodStart, periodEnd } }
  );
  return response.data;
};

export const getAllAwardWinners = async (
  clubId: number
): Promise<AwardWinnerResponse[]> => {
  const response = await axiosInstance.get<AwardWinnerResponse[]>(
    `/clubs/${clubId}/awards/manage/all`
  );
  return response.data;
};

export const deleteAwardWinner = async (
  clubId: number,
  winnerId: number
): Promise<void> => {
  await axiosInstance.delete(`/clubs/${clubId}/awards/manage/${winnerId}`);
};

export interface CumulativeAchievementResponse {
  achievements: {
    userId: number;
    userName: string;
    imageUrl: string | null;
    awardCount: number;
    tier: number;
  }[];
}

export const getCumulativeAchievements = async (
  clubId: number
): Promise<CumulativeAchievementResponse> => {
  const response = await axiosInstance.get<CumulativeAchievementResponse>(
    `/clubs/${clubId}/awards/achievements`
  );
  return response.data;
};

export const getUserAchievements = async (
  clubId: number,
  userId: number
): Promise<AwardWinnerResponse[]> => {
  const response = await axiosInstance.get<AwardWinnerResponse[]>(
    `/clubs/${clubId}/awards/achievements/${userId}`
  );
  return response.data;
};

/** 어워드 타입 한글 이름 */
export const getAwardTypeName = (type: string): string => {
  const names: Record<string, string> = {
    ATTENDANCE: "출석왕",
    WIN: "다승왕",
    LOSS: "다패왕",
    SCORE: "득점왕",
    MVP: "MVP",
  };
  return names[type] ?? type;
};
