export const ClubRole = {
  OWNER: "OWNER",
  ADMIN: "ADMIN",
  REGULAR: "REGULAR",
} as const;

export type ClubRole = (typeof ClubRole)[keyof typeof ClubRole];
export type ClubRoleOrUnknown = ClubRole | "UNKNOWN";

export function normalizeClubRole(raw: unknown): ClubRoleOrUnknown {
  const v = typeof raw === "string" ? raw : "UNKNOWN";
  if (v === "OWNER" || v === "ADMIN" || v === "REGULAR") return v;
  return "UNKNOWN";
}

export function canManageClub(role: ClubRoleOrUnknown): boolean {
  return role === "OWNER" || role === "ADMIN";
}

export function getRoleLabel(role: ClubRoleOrUnknown): string {
  if (role === "OWNER") return "클럽장";
  if (role === "ADMIN") return "운영진";
  if (role === "REGULAR") return "정회원";
  return "알 수 없음";
}
