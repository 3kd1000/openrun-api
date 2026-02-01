import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { getMyClubs, type MyClub } from "../services/api/userApi";
import { getMyClubsCache, setMyClubsCache } from "../utils/myClubsCache";

/**
 * 인증 상태와 클럽 목록을 함께 관리하는 Custom Hook
 *
 * - Firebase 인증 준비될 때까지 대기 (타이밍 이슈 방지)
 * - LocalStorage 캐시 활용 (없으면 API 호출)
 * - 모든 페이지에서 일관된 클럽 로딩 로직 제공
 *
 * @returns {Object} clubs, loading, error, isAuthReady, user
 */
export const useClubsWithAuth = () => {
  const { isAuthReady, user } = useAuth();
  const [clubs, setClubs] = useState<MyClub[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadClubs = async () => {
      // Firebase 인증이 준비될 때까지 대기 (타이밍 이슈 방지)
      if (!isAuthReady) {
        console.log("⏳ Firebase 인증 준비 중... 클럽 목록 로딩 대기");
        return;
      }

      // 로그인되지 않았으면 빈 배열
      if (!user) {
        console.log("ℹ️ 로그인되지 않음 → 클럽 목록 빈 배열");
        setClubs([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // LocalStorage 캐시에서 클럽 목록 가져오기
        let cachedClubs = getMyClubsCache();

        // 캐시가 없으면 API 호출
        if (cachedClubs.length === 0) {
          console.log("📋 클럽 캐시 없음 → API로 클럽 목록 조회");
          cachedClubs = await getMyClubs();
          setMyClubsCache(cachedClubs);
          console.log(`✅ 클럽 목록 조회 완료: ${cachedClubs.length}개 클럽`);
        } else {
          console.log(`📦 클럽 캐시 사용: ${cachedClubs.length}개 클럽`);
        }

        setClubs(cachedClubs);
      } catch (err) {
        console.error("❌ 클럽 목록 조회 실패:", err);
        setError("클럽 목록을 불러오는데 실패했습니다");
        setClubs([]);
      } finally {
        setLoading(false);
      }
    };

    loadClubs();
  }, [isAuthReady, user]);

  return {
    clubs,
    hasClubs: clubs.length > 0,
    loading,
    error,
    isAuthReady,
    user
  };
};
