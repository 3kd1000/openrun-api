/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import {
  awardService,
  type WinnerDetail,
  type MemberAchievement,
  type TierName,
} from "../services/awardService";
import type { AwardType } from "../types/club";
import { getOpenRunSession } from "../utils/openrunSession";

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
  const [winnerUserIds, setWinnerUserIds] = useState<Set<number>>(new Set());
  const [winners, setWinners] = useState<WinnerDetail[]>([]);
  const [achievements, setAchievements] = useState<Map<number, MemberAchievement>>(new Map());
  const [isLoading, setIsLoading] = useState(false);
  const [currentClubId, setCurrentClubId] = useState<number | null>(null);

  const fetchData = useCallback(async (clubId: number) => {
    try {
      setIsLoading(true);

      // 현재 시즌 수상자와 누적 업적 동시 조회
      const [winnersResponse, achievementsResponse] = await Promise.all([
        awardService.getCurrentWinners(clubId),
        awardService.getCumulativeAchievements(clubId),
      ]);

      // 현재 시즌 수상자
      setWinnerUserIds(new Set(winnersResponse.winnerUserIds));
      setWinners(winnersResponse.winners);

      // 누적 업적 Map으로 변환
      const achievementMap = new Map<number, MemberAchievement>();
      for (const member of achievementsResponse.members) {
        achievementMap.set(member.userId, member);
      }
      setAchievements(achievementMap);
    } catch (error) {
      console.error("Failed to fetch award data:", error);
      setWinnerUserIds(new Set());
      setWinners([]);
      setAchievements(new Map());
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 클럽 변경 감지 및 데이터 조회
  useEffect(() => {
    const checkClubChange = () => {
      const session = getOpenRunSession();
      const clubId = session.currentClubId ? parseInt(session.currentClubId) : null;

      if (clubId && clubId !== currentClubId) {
        setCurrentClubId(clubId);
        fetchData(clubId);
      } else if (!clubId && currentClubId) {
        // 클럽 선택 해제 시 초기화
        setCurrentClubId(null);
        setWinnerUserIds(new Set());
        setWinners([]);
        setAchievements(new Map());
      }
    };

    // 초기 체크
    checkClubChange();

    // 주기적으로 클럽 변경 체크 (session storage 변경 감지용)
    const interval = setInterval(checkClubChange, 1000);

    return () => clearInterval(interval);
  }, [currentClubId, fetchData]);

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

  const refetch = useCallback(async () => {
    if (currentClubId) {
      await fetchData(currentClubId);
    }
  }, [currentClubId, fetchData]);

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
