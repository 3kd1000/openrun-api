/**
 * Club Role
 *
 * 소유자/운영진/정회원(3단계)
 * DB는 Flyway migration으로 MEMBER -> REGULAR 로 정리하므로,
 * 프론트에서 "MEMBER 매핑"은 두지 않습니다. (예상 밖 값은 UNKNOWN 처리)
 */

export const ClubRole = {
  OWNER: "OWNER",
  ADMIN: "ADMIN",
  REGULAR: "REGULAR", // 정회원
} as const;

export type ClubRole = (typeof ClubRole)[keyof typeof ClubRole];
export type ClubRoleOrUnknown = ClubRole | "UNKNOWN";

export function normalizeClubRole(raw: unknown): ClubRoleOrUnknown {
  const v = typeof raw === "string" ? raw : "UNKNOWN";

  if (v === "OWNER" || v === "ADMIN" || v === "REGULAR") {
    return v;
  }
  return "UNKNOWN";
}

export function canManageClub(role: ClubRoleOrUnknown): boolean {
  return role === "OWNER" || role === "ADMIN";
}

export function isClubOwner(role: ClubRoleOrUnknown): boolean {
  return role === "OWNER";
}

export function getRoleLabel(role: ClubRoleOrUnknown): string {
  if (role === "OWNER") return "클럽장";
  if (role === "ADMIN") return "운영진";
  if (role === "REGULAR") return "정회원";
  return "알 수 없음";
}

