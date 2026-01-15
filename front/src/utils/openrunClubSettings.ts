/**
 * Club-scoped local settings (localStorage)
 *
 * 목적:
 * - 클럽별 UI 설정(위젯 순서/접힘, 공지/회칙 접힘 등)을 개별 key 난립 없이 단일 JSON으로 관리
 * - 기존 개별 key들은 읽어서 자동 마이그레이션(호환)만 수행
 */

export const OPENRUN_CLUB_SETTINGS_KEY = "openrun_club_settings_v1";

export type ClubSettingsV1 = {
  version: 1;
  clubs: Record<
    string,
    {
      widgets?: {
        order?: string[];
        expanded?: Record<string, boolean>;
      };
      rulesPage?: {
        noticesExpanded?: boolean;
        rulesExpanded?: boolean;
      };
    }
  >;
};

function safeParseJson<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function readAll(): ClubSettingsV1 {
  const stored = safeParseJson<ClubSettingsV1>(
    localStorage.getItem(OPENRUN_CLUB_SETTINGS_KEY)
  );
  if (stored?.version === 1 && stored.clubs) return stored;
  return { version: 1, clubs: {} };
}

function writeAll(next: ClubSettingsV1) {
  localStorage.setItem(OPENRUN_CLUB_SETTINGS_KEY, JSON.stringify(next));
}

export function getClubSettings(clubId: string): ClubSettingsV1["clubs"][string] {
  const all = readAll();
  return all.clubs[clubId] ?? {};
}

export function setClubSettings(
  clubId: string,
  patch: Partial<ClubSettingsV1["clubs"][string]>
) {
  const all = readAll();
  const current = all.clubs[clubId] ?? {};
  all.clubs[clubId] = {
    ...current,
    ...patch,
    widgets: {
      ...(current.widgets ?? {}),
      ...(patch.widgets ?? {}),
      expanded: {
        ...((current.widgets ?? {}).expanded ?? {}),
        ...((patch.widgets ?? {}).expanded ?? {}),
      },
    },
    rulesPage: {
      ...(current.rulesPage ?? {}),
      ...(patch.rulesPage ?? {}),
    },
  };
  writeAll(all);
}

/**
 * ---- Migration helpers (legacy keys -> consolidated) ----
 */
export function migrateLegacyClubSettingsIfNeeded(params: {
  clubId: string;
  knownWidgetIds: string[];
  defaultWidgetOrder: string[];
}) {
  const { clubId, knownWidgetIds, defaultWidgetOrder } = params;

  const current = getClubSettings(clubId);
  const alreadyHas =
    current.widgets?.order ||
    current.widgets?.expanded ||
    current.rulesPage?.noticesExpanded !== undefined ||
    current.rulesPage?.rulesExpanded !== undefined;

  // 이미 consolidated 값이 있으면 migration 생략
  if (alreadyHas) return;

  const legacyPrefix = `club:${clubId}`;
  const legacyOrderRaw = localStorage.getItem(`${legacyPrefix}:widgets:order`);
  const legacyOrderParsed = safeParseJson<unknown>(legacyOrderRaw);
  const legacyOrder =
    Array.isArray(legacyOrderParsed) && legacyOrderParsed.every((v) => typeof v === "string")
      ? (legacyOrderParsed as string[])
      : null;

  const expanded: Record<string, boolean> = {};
  for (const wid of knownWidgetIds) {
    const k = `${legacyPrefix}:widgets:${wid}:expanded`;
    const saved = localStorage.getItem(k);
    if (saved === "true") expanded[wid] = true;
    if (saved === "false") expanded[wid] = false;
  }

  const noticesExpandedRaw = localStorage.getItem(
    `${legacyPrefix}:rules-page:noticesExpanded`
  );
  const rulesExpandedRaw = localStorage.getItem(
    `${legacyPrefix}:rules-page:rulesExpanded`
  );

  setClubSettings(clubId, {
    widgets: {
      order: legacyOrder ?? defaultWidgetOrder,
      expanded: Object.keys(expanded).length > 0 ? expanded : undefined,
    },
    rulesPage: {
      noticesExpanded:
        noticesExpandedRaw === null ? undefined : noticesExpandedRaw === "true",
      rulesExpanded: rulesExpandedRaw === null ? undefined : rulesExpandedRaw === "true",
    },
  });
}

