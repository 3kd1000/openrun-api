/**
 * OpenRun UI Settings Storage (localStorage 기반)
 *
 * - 통합 저장소 키: openrun_ui_settings_v1
 * - UI 관련 설정 (view mode, expanded states, etc.)
 */

export const OPENRUN_UI_SETTINGS_KEY = "openrun_ui_settings_v1";

export interface OpenRunUiSettingsV1 {
  version: 1;
  scheduleViewMode?: "calendar" | "list";
  clubExploreExpanded?: Record<string, boolean>;
  /** 시작 가이드 확인 여부 (최소 1회 열람 강제) */
  startGuideSeen?: boolean;
}

function safeJsonParse<T>(value: string | null): T | null {
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

export function getOpenRunUiSettings(): OpenRunUiSettingsV1 {
  const stored = safeJsonParse<OpenRunUiSettingsV1>(
    localStorage.getItem(OPENRUN_UI_SETTINGS_KEY)
  );

  if (stored?.version === 1) {
    return stored;
  }

  return { version: 1 };
}

/**
 * UI settings 부분 업데이트
 */
export function setOpenRunUiSettings(patch: Partial<OpenRunUiSettingsV1>) {
  const current = getOpenRunUiSettings();
  const next: OpenRunUiSettingsV1 = {
    ...current,
    ...patch,
    version: 1,
  };

  localStorage.setItem(OPENRUN_UI_SETTINGS_KEY, JSON.stringify(next));
}

export function clearOpenRunUiSettings() {
  localStorage.removeItem(OPENRUN_UI_SETTINGS_KEY);
}
