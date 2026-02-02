/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { awardService, type AwardWinnersResponse, type WinnerDetail } from "../services/awardService";
import { getOpenRunSession } from "../utils/openrunSession";

interface AwardWinnersContextType {
  winnerUserIds: Set<number>;  // 현재 어워드 수상자 ID Set
  winners: WinnerDetail[];      // 수상자 상세 정보
  isLoading: boolean;
  isWinner: (userId: number) => boolean;  // 수상자 여부 확인
  getWinnerAwardTypes: (userId: number) => string[];  // 수상 타입 목록 반환
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
      isLoading: false,
      isWinner: () => false,
      getWinnerAwardTypes: () => [],
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
  const [isLoading, setIsLoading] = useState(false);
  const [currentClubId, setCurrentClubId] = useState<number | null>(null);

  const fetchWinners = useCallback(async (clubId: number) => {
    try {
      setIsLoading(true);
      const response: AwardWinnersResponse = await awardService.getCurrentWinners(clubId);
      setWinnerUserIds(new Set(response.winnerUserIds));
      setWinners(response.winners);
    } catch (error) {
      console.error("Failed to fetch award winners:", error);
      setWinnerUserIds(new Set());
      setWinners([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 클럽 변경 감지 및 수상자 조회
  useEffect(() => {
    const checkClubChange = () => {
      const session = getOpenRunSession();
      const clubId = session.currentClubId ? parseInt(session.currentClubId) : null;

      if (clubId && clubId !== currentClubId) {
        setCurrentClubId(clubId);
        fetchWinners(clubId);
      } else if (!clubId && currentClubId) {
        // 클럽 선택 해제 시 초기화
        setCurrentClubId(null);
        setWinnerUserIds(new Set());
        setWinners([]);
      }
    };

    // 초기 체크
    checkClubChange();

    // 주기적으로 클럽 변경 체크 (session storage 변경 감지용)
    const interval = setInterval(checkClubChange, 1000);

    return () => clearInterval(interval);
  }, [currentClubId, fetchWinners]);

  const isWinner = useCallback((userId: number): boolean => {
    return winnerUserIds.has(userId);
  }, [winnerUserIds]);

  const getWinnerAwardTypes = useCallback((userId: number): string[] => {
    return winners
      .filter((w) => w.userId === userId)
      .map((w) => w.type);
  }, [winners]);

  const refetch = useCallback(async () => {
    if (currentClubId) {
      await fetchWinners(currentClubId);
    }
  }, [currentClubId, fetchWinners]);

  return (
    <AwardWinnersContext.Provider
      value={{
        winnerUserIds,
        winners,
        isLoading,
        isWinner,
        getWinnerAwardTypes,
        refetch,
      }}
    >
      {children}
    </AwardWinnersContext.Provider>
  );
};
