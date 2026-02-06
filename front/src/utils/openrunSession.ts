import { normalizeClubRole, type ClubRoleOrUnknown } from "../utils/role";

/**
 * OpenRun Session Storage (localStorage 기반)
 *
 * - 통합 저장소 키: openrun_session_v1
 * - 사용자 정보, Firebase 인증, 현재 클럽 컨텍스트를 모두 포함
 */

export const OPENRUN_SESSION_KEY = "openrun_session_v1";
export const OPENRUN_AUTO_LOGIN_KEY = "openrun_auto_login";

export interface ClubSummary {
  id: number;
  name: string;
}

export interface OpenRunSessionV1 {
  version: 1;
  userId?: number;
  userName?: string;
  userEmail?: string | null;
  userImageUrl?: string | null;
  firebaseToken?: string;
  firebaseUid?: string;
  tokenLastRefresh?: string;
  autoLoginEnabled?: boolean;
  currentClubId?: string;
  currentClubRole?: ClubRoleOrUnknown;
  /** 가입한 클럽 목록 (로그인/토큰갱신/가입/탈퇴 시 업데이트) */
  clubList?: ClubSummary[];
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
 * 레거시 localStorage 키를 통합 세션으로 마이그레이션
 */
function migrateLegacySession(): OpenRunSessionV1 | null {
  // 레거시 키 체크 (하나라도 있으면 마이그레이션 시도)
  const firebaseToken = localStorage.getItem("firebase_token");
  const userId = localStorage.getItem("user_id");

  if (!firebaseToken && !userId) {
    return null;  // 레거시 데이터 없음
  }

  console.log("🔄 레거시 localStorage 마이그레이션 시작...");

  const migrated: OpenRunSessionV1 = {
    version: 1,
    firebaseToken: firebaseToken || undefined,
    firebaseUid: localStorage.getItem("firebase_uid") || undefined,
    userId: userId ? parseInt(userId) : undefined,
    userName: localStorage.getItem("user_name") || undefined,
    userEmail: localStorage.getItem("user_email") || undefined,
    userImageUrl: localStorage.getItem("user_image_url") || undefined,
    currentClubId: localStorage.getItem("current_club_id") || undefined,
    currentClubRole: normalizeClubRole(
      localStorage.getItem("current_club_role") || "UNKNOWN"
    ),
    tokenLastRefresh: localStorage.getItem("token_last_refresh") || undefined,
    autoLoginEnabled: localStorage.getItem("auto_login_enabled") === "true",
  };

  // 새 형식으로 저장
  localStorage.setItem(OPENRUN_SESSION_KEY, JSON.stringify(migrated));

  // 레거시 키 삭제
  const legacyKeys = [
    "firebase_token", "firebase_uid", "user_id", "user_name",
    "user_email", "user_image_url", "current_club_id", "current_club_role",
    "token_last_refresh", "auto_login_enabled"
  ];
  legacyKeys.forEach(key => {
    localStorage.removeItem(key);
    console.log(`  ✓ 레거시 키 삭제: ${key}`);
  });

  console.log("✅ 레거시 localStorage 마이그레이션 완료");
  console.log("  → openrun_session_v1로 통합됨");

  return migrated;
}

export function getOpenRunSession(): OpenRunSessionV1 {
  const stored = safeJsonParse<OpenRunSessionV1>(
    localStorage.getItem(OPENRUN_SESSION_KEY)
  );

  if (stored?.version === 1) {
    return {
      ...stored,
      currentClubRole: normalizeClubRole(stored.currentClubRole ?? "UNKNOWN"),
    };
  }

  // 🔧 레거시 마이그레이션 (한 번만 실행)
  const legacyMigrated = migrateLegacySession();
  if (legacyMigrated) {
    return legacyMigrated;
  }

  return { version: 1 };
}

/**
 * session 부분 업데이트
 */
export function setOpenRunSession(patch: Partial<OpenRunSessionV1>) {
  const current = getOpenRunSession();
  const next: OpenRunSessionV1 = {
    ...current,
    ...patch,
    version: 1,
    currentClubRole: normalizeClubRole(
      patch.currentClubRole ?? current.currentClubRole ?? "UNKNOWN"
    ),
  };

  localStorage.setItem(OPENRUN_SESSION_KEY, JSON.stringify(next));
}

export function clearOpenRunSession() {
  localStorage.removeItem(OPENRUN_SESSION_KEY);
}

/**
 * 가입한 클럽이 있는지 확인 (clubList 기반)
 * @returns true: 클럽 있음, false: 클럽 없음, undefined: 아직 로드 안 됨
 */
export function hasJoinedClub(): boolean | undefined {
  const session = getOpenRunSession();
  // clubList가 undefined면 아직 로드 안 됨 (기존 사용자)
  if (session.clubList === undefined) {
    return undefined;
  }
  return session.clubList.length > 0;
}

/**
 * 현재 선택된 클럽이 clubList에 있는지 확인
 * 없으면 첫 번째 클럽으로 변경하거나 null로 설정
 */
export function validateAndFixCurrentClub(): void {
  const session = getOpenRunSession();
  const clubList = session.clubList ?? [];
  const currentClubId = session.currentClubId;

  if (clubList.length === 0) {
    // 가입한 클럽이 없으면 currentClubId 제거
    if (currentClubId) {
      setOpenRunSession({ currentClubId: undefined, currentClubRole: undefined });
    }
    return;
  }

  // currentClubId가 clubList에 있는지 확인
  const isValid = currentClubId && clubList.some(c => String(c.id) === currentClubId);
  if (!isValid) {
    // 첫 번째 클럽으로 변경
    const firstClub = clubList[0];
    setOpenRunSession({ currentClubId: String(firstClub.id) });
    console.log(`⚠️ currentClubId 수정: ${currentClubId} → ${firstClub.id} (${firstClub.name})`);
  }
}

/**
 * clubList 업데이트 (가입/탈퇴 시 호출)
 */
export function updateClubList(clubList: ClubSummary[]): void {
  setOpenRunSession({ clubList });
  validateAndFixCurrentClub();
}

/**
 * 자동 로그인 설정 가져오기 (별도 키에 저장하여 세션 삭제와 무관하게 유지)
 * 기본값: true (사용자 경험 개선을 위해 자동 로그인을 기본으로 함)
 */
export function getAutoLoginEnabled(): boolean {
  const stored = localStorage.getItem(OPENRUN_AUTO_LOGIN_KEY);
  // 저장된 값이 없으면 기본값 true 반환
  if (stored === null) {
    return true;
  }
  return stored === "true";
}

/**
 * 자동 로그인 설정 저장 (별도 키에 저장)
 */
export function setAutoLoginEnabled(enabled: boolean): void {
  localStorage.setItem(OPENRUN_AUTO_LOGIN_KEY, String(enabled));
}
