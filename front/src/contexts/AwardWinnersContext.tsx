/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  awardService,
  type WinnerDetail,
  type MemberAchievement,
  type TierName,
} from "../services/awardService";
import type { AwardType, Club } from "../types/club";
import { getOpenRunSession } from "../utils/openrunSession";
import axiosInstance from "../services/api/axiosInstance";

interface AwardWinnersContextType {
  winnerUserIds: Set<number>;  // 현재 어워드 수상자 ID Set
  winners: WinnerDetail[];      // 수상자 상세 정보
  achievements: Map<number, MemberAchievement>;  // userId -> 누적 업적
  isLoading: boolean;
  isWinner: (userId: number) => boolean;  // 수상자 여부 확인
  getWinnerAwardTypes: (userId: number) => string[];  // 수상 타입 목록 반환
  getUserAchievement: (userId: number) => MemberAchievement | null;  // 누적 업적 조회
  getUserTier: (userId: number, awardType: AwardType) => number;  // 특정 타입의 티어
  getUserPrimaryBadge: (userId: number) => { awardType: AwardType; tier: number; tierName: TierName } | null;  // 대표 뱃지
  refetch: () => Promise<void>;  // 수동 갱신
}

const AwardWinnersContext = createContext<AwardWinnersContextType | undefined>(undefined);

export const useAwardWinners = () => {
  const context = useContext(AwardWinnersContext);
  if (!context) {
    // Context 없이 사용될 경우 기본값 반환 (에러 방지)
    return {
      winnerUserIds: new Set<number>(),
      winners: [],
      achievements: new Map<number, MemberAchievement>(),
      isLoading: false,
      isWinner: () => false,
      getWinnerAwardTypes: () => [],
      getUserAchievement: () => null,
      getUserTier: () => 0,
      getUserPrimaryBadge: () => null,
      refetch: async () => {},
    };
  }
  return context;
};

interface AwardWinnersProviderProps {
  children: React.ReactNode;
}

export const AwardWinnersProvider: React.FC<AwardWinnersProviderProps> = ({ children }) => {
  const queryClient = useQueryClient();

  // sessionStorage에서 초기값 읽어 즉시 세팅
  const [currentClubId, setCurrentClubId] = useState<number | null>(() => {
    const session = getOpenRunSession();
    return session.currentClubId ? parseInt(session.currentClubId) : null;
  });

  // 1초 폴링으로 클럽 변경 감지 (sessionStorage 변경 감지용)
  useEffect(() => {
    const check = () => {
      const session = getOpenRunSession();
      const clubId = session.currentClubId ? parseInt(session.currentClubId) : null;
      setCurrentClubId((prev) => (prev !== clubId ? clubId : prev));
    };
    const interval = setInterval(check, 1000);
    return () => clearInterval(interval);
  }, []);

  // React Query로 어워드 데이터 캐싱 (staleTime 5분)
  const { data: awardsData, isLoading } = useQuery({
    queryKey: ["awards", currentClubId] as const,
    queryFn: async () => {
      // 클럽의 awardEnabled 체크 → OFF이면 빈 데이터 반환
      const clubRes = await axiosInstance.get<Club>(`/clubs/${currentClubId}`);
      if (clubRes.data.awardEnabled === false) {
        return null; // 어워드 비활성화
      }

      const [winnersResponse, achievementsResponse] = await Promise.all([
        awardService.getCurrentWinners(currentClubId!),
        awardService.getCumulativeAchievements(currentClubId!),
      ]);
      return { winnersResponse, achievementsResponse };
    },
    enabled: !!currentClubId && !!getOpenRunSession().userId,
    staleTime: 5 * 60 * 1000, // 5분: 이 시간 내 재방문 시 API 호출 없이 캐시 반환
    gcTime: 10 * 60 * 1000,   // 10분: 언마운트 후 메모리 유지 시간
  });

  // 쿼리 데이터에서 상태 파생
  const winnerUserIds = useMemo(
    () => (awardsData ? new Set(awardsData.winnersResponse.winnerUserIds) : new Set<number>()),
    [awardsData]
  );

  const winners = useMemo(
    () => awardsData?.winnersResponse.winners ?? [],
    [awardsData]
  );

  const achievements = useMemo(
    () =>
      awardsData
        ? new Map(awardsData.achievementsResponse.members.map((m) => [m.userId, m]))
        : new Map<number, MemberAchievement>(),
    [awardsData]
  );

  const isWinner = useCallback((userId: number): boolean => {
    return winnerUserIds.has(userId);
  }, [winnerUserIds]);

  const getWinnerAwardTypes = useCallback((userId: number): string[] => {
    return winners
      .filter((w) => w.userId === userId)
      .map((w) => w.type);
  }, [winners]);

  const getUserAchievement = useCallback((userId: number): MemberAchievement | null => {
    return achievements.get(userId) || null;
  }, [achievements]);

  const getUserTier = useCallback((userId: number, awardType: AwardType): number => {
    const achievement = achievements.get(userId);
    if (!achievement) return 0;
    return awardService.calculateTier(achievement.awardCounts[awardType] || 0);
  }, [achievements]);

  const getUserPrimaryBadge = useCallback((userId: number): { awardType: AwardType; tier: number; tierName: TierName } | null => {
    const achievement = achievements.get(userId);
    if (!achievement || !achievement.primaryAward || achievement.primaryTier === 0) return null;

    return {
      awardType: achievement.primaryAward,
      tier: achievement.primaryTier,
      tierName: awardService.getTierName(achievement.primaryTier),
    };
  }, [achievements]);

  // 수동 갱신: 캐시 무효화 후 재요청
  const refetch = useCallback(async () => {
    if (currentClubId) {
      await queryClient.invalidateQueries({ queryKey: ["awards", currentClubId] });
    }
  }, [currentClubId, queryClient]);

  return (
    <AwardWinnersContext.Provider
      value={{
        winnerUserIds,
        winners,
        achievements,
        isLoading,
        isWinner,
        getWinnerAwardTypes,
        getUserAchievement,
        getUserTier,
        getUserPrimaryBadge,
        refetch,
      }}
    >
      {children}
    </AwardWinnersContext.Provider>
  );
};
