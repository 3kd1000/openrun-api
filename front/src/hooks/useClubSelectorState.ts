import { useState, useEffect, useCallback } from "react";
import { getMyClubs, type MyClub } from "../services/api/userApi";
import { getOpenRunSession, setOpenRunSession } from "../utils/openrunSession";
import { useAuth } from "../contexts/AuthContext";
import { normalizeClubRole } from "../utils/role";

/**
 * useClubSelectorState
 * - ClubLayout 외부(탐색, 더보기 등)에서 ClubSelector 상태를 제공
 * - 로그인 시: 클럽 목록 로드 + 선택 상태 관리
 * - 비로그인 시: 빈 상태 반환
 * - ClubLayout과 달리 클럽 변경 시 navigate하지 않음 (세션만 업데이트)
 */
export function useClubSelectorState() {
  const { isAuthReady, user } = useAuth();
  const [clubs, setClubs] = useState<MyClub[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  const session = getOpenRunSession();
  const selectedClubId = session.currentClubId
    ? parseInt(session.currentClubId)
    : null;

  const isLoggedIn = isAuthReady && !!user;

  useEffect(() => {
    if (!isAuthReady) return;
    if (!user) {
      setIsLoading(false);
      return;
    }
    loadClubs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthReady, user]);

  const loadClubs = async () => {
    try {
      setIsLoading(true);
      const data = await getMyClubs();
      setClubs(data);

      // 클럽이 있는데 선택된 클럽이 없으면 첫 번째 클럽 자동 선택
      if (data.length > 0 && !selectedClubId) {
        handleClubChangeInternal(data[0].id, data);
      }
    } catch (err) {
      console.error("클럽 목록 조회 실패:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClubChangeInternal = (clubId: number, clubsOverride?: MyClub[]) => {
    const clubsToSearch = clubsOverride ?? clubs;
    const selectedClub = clubsToSearch.find((club) => club.id === clubId);
    const role = normalizeClubRole(selectedClub?.role ?? "REGULAR");

    setOpenRunSession({
      currentClubId: clubId.toString(),
      currentClubRole: role,
    });

    setRefreshKey((prev) => prev + 1);
  };

  const handleClubChange = useCallback((clubId: number | null) => {
    if (!clubId) return;
    handleClubChangeInternal(clubId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clubs]);

  return { clubs, selectedClubId, isLoading, handleClubChange, isLoggedIn, refreshKey };
}
