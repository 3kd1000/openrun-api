import type { MyClub } from "../services/api/userApi";

/**
 * 내 클럽 목록 LocalStorage 캐싱
 *
 * - 통합 저장소 키: my_clubs_cache
 * - 빠른 반응속도를 위해 클럽 목록을 LocalStorage에 캐싱
 * - 로그인/로그아웃 시 자동으로 갱신/삭제
 */

export const MY_CLUBS_CACHE_KEY = "my_clubs_cache";

export interface MyClubsCache {
  clubs: MyClub[];
  lastUpdated: string; // ISO timestamp
}

function safeJsonParse<T>(value: string | null): T | null {
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

/**
 * LocalStorage에서 내 클럽 목록 가져오기
 */
export function getMyClubsCache(): MyClub[] {
  const cached = safeJsonParse<MyClubsCache>(
    localStorage.getItem(MY_CLUBS_CACHE_KEY)
  );

  if (!cached || !cached.clubs) {
    return [];
  }

  return cached.clubs;
}

/**
 * LocalStorage에 내 클럽 목록 저장
 */
export function setMyClubsCache(clubs: MyClub[]) {
  const cache: MyClubsCache = {
    clubs,
    lastUpdated: new Date().toISOString(),
  };

  localStorage.setItem(MY_CLUBS_CACHE_KEY, JSON.stringify(cache));
  console.log(`✅ 내 클럽 목록 캐싱 완료: ${clubs.length}개 클럽`);
}

/**
 * LocalStorage에서 내 클럽 목록 삭제
 */
export function clearMyClubsCache() {
  localStorage.removeItem(MY_CLUBS_CACHE_KEY);
  console.log("🧹 내 클럽 목록 캐시 삭제");
}

/**
 * 특정 클럽이 내 클럽 목록에 있는지 확인
 */
export function hasClubInCache(clubId: number): boolean {
  const clubs = getMyClubsCache();
  return clubs.some((club) => club.id === clubId);
}

/**
 * 캐시가 유효한지 확인 (1시간 이내)
 */
export function isCacheValid(): boolean {
  const cached = safeJsonParse<MyClubsCache>(
    localStorage.getItem(MY_CLUBS_CACHE_KEY)
  );

  if (!cached || !cached.lastUpdated) {
    return false;
  }

  const lastUpdated = new Date(cached.lastUpdated);
  const now = new Date();
  const hoursSinceUpdate = (now.getTime() - lastUpdated.getTime()) / (1000 * 60 * 60);

  return hoursSinceUpdate < 1; // 1시간 이내면 유효
}
