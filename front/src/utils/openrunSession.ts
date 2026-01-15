import { normalizeClubRole, type ClubRoleOrUnknown } from "../utils/role";

/**
 * OpenRun Session Storage (localStorage 기반)
 *
 * - 점진 전환을 위해 기존 localStorage key들과 병행 저장(compat)합니다.
 * - 새 표준 저장소 키: openrun_session_v1
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

function toStringOrNull(v: unknown): string | null {
  if (typeof v === "string") return v;
  if (v === null || v === undefined) return null;
  return String(v);
}

function readLegacy(): Partial<OpenRunSessionV1> {
  const userIdStr = localStorage.getItem("user_id");
  const userId = userIdStr ? Number(userIdStr) : undefined;
  const autoLoginStr = localStorage.getItem("auto_login_enabled");
  const currentClubRole = normalizeClubRole(
    localStorage.getItem("current_club_role")
  );

  return {
    userId: Number.isFinite(userId) ? userId : undefined,
    userName: localStorage.getItem("user_name") ?? undefined,
    userEmail: toStringOrNull(localStorage.getItem("user_email")),
    userImageUrl: toStringOrNull(localStorage.getItem("user_image_url")),
    firebaseToken: localStorage.getItem("firebase_token") ?? undefined,
    firebaseUid: localStorage.getItem("firebase_uid") ?? undefined,
    tokenLastRefresh: localStorage.getItem("token_last_refresh") ?? undefined,
    autoLoginEnabled:
      autoLoginStr === null ? undefined : autoLoginStr === "true",
    currentClubId: localStorage.getItem("current_club_id") ?? undefined,
    currentClubRole,
  };
}

export function getOpenRunSession(): OpenRunSessionV1 {
  const stored = safeJsonParse<OpenRunSessionV1>(
    localStorage.getItem(OPENRUN_SESSION_KEY)
  );
  const base: OpenRunSessionV1 =
    stored?.version === 1 ? stored : { version: 1 };

  // legacy와 병합 (session 값 우선)
  const legacy = readLegacy();
  return {
    ...legacy,
    ...base,
    currentClubRole: normalizeClubRole(
      base.currentClubRole ?? legacy.currentClubRole ?? "UNKNOWN"
    ),
  };
}

/**
 * session 부분 업데이트 + legacy 키 동기화
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

  // ---- legacy sync (compat) ----
  if (next.firebaseToken !== undefined)
    localStorage.setItem("firebase_token", next.firebaseToken);
  if (next.firebaseUid !== undefined)
    localStorage.setItem("firebase_uid", next.firebaseUid);
  if (next.tokenLastRefresh !== undefined)
    localStorage.setItem("token_last_refresh", next.tokenLastRefresh);

  if (next.userId !== undefined)
    localStorage.setItem("user_id", String(next.userId));
  if (next.userName !== undefined)
    localStorage.setItem("user_name", next.userName);

  if (next.userEmail === null) localStorage.removeItem("user_email");
  if (typeof next.userEmail === "string")
    localStorage.setItem("user_email", next.userEmail);

  if (next.userImageUrl === null) localStorage.removeItem("user_image_url");
  if (typeof next.userImageUrl === "string")
    localStorage.setItem("user_image_url", next.userImageUrl);

  if (next.currentClubId !== undefined)
    localStorage.setItem("current_club_id", next.currentClubId);

  if (next.currentClubRole && next.currentClubRole !== "UNKNOWN") {
    localStorage.setItem("current_club_role", next.currentClubRole);
  } else {
    localStorage.removeItem("current_club_role");
  }

  if (next.autoLoginEnabled !== undefined) {
    localStorage.setItem("auto_login_enabled", String(next.autoLoginEnabled));
  }
}

export function clearOpenRunSession() {
  localStorage.removeItem(OPENRUN_SESSION_KEY);
  // legacy clear (기존 로직 유지)
  localStorage.removeItem("user_id");
  localStorage.removeItem("user_name");
  localStorage.removeItem("user_email");
  localStorage.removeItem("user_image_url");
  localStorage.removeItem("current_club_id");
  localStorage.removeItem("current_club_role");
}
