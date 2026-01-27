import { normalizeClubRole, type ClubRoleOrUnknown } from "../utils/role";

/**
 * OpenRun Session Storage (localStorage 기반)
 *
 * - 통합 저장소 키: openrun_session_v1
 * - 사용자 정보, Firebase 인증, 현재 클럽 컨텍스트를 모두 포함
 */

export const OPENRUN_SESSION_KEY = "openrun_session_v1";

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
