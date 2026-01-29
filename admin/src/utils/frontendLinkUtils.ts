/**
 * Admin URL을 Frontend URL로 변환
 * - admin.openrun.app → front.openrun.app
 * - dev-admin.openrun.app → dev-front.openrun.app
 * - localhost:5174 → localhost:5173
 */
export function getFrontendBaseUrl(): string {
  const { hostname, protocol } = window.location;

  // localhost 처리 (admin: 5174, front: 5173)
  if (hostname === "localhost") {
    return `${protocol}//localhost:5173`;
  }

  // admin → front 변환
  const frontendHostname = hostname.replace("admin", "front");
  return `${protocol}//${frontendHostname}`;
}

/**
 * entityType과 ID 정보로 Frontend 라우트 생성
 */
export function buildFrontendRoute(
  entityType: string,
  entityId: number,
  clubId: number,
  changes?: string
): string | null {
  const baseUrl = getFrontendBaseUrl();

  switch (entityType) {
    case "SCHEDULE":
      // 일정 상세 모달 열기
      return `${baseUrl}/schedules/club?scheduleId=${entityId}`;

    case "SCHEDULE_PARTICIPANT": {
      // changes에서 scheduleId 추출
      const scheduleId = extractScheduleIdFromChanges(changes);
      if (scheduleId) {
        return `${baseUrl}/schedules/club?scheduleId=${scheduleId}`;
      }
      // scheduleId를 찾지 못하면 일정 목록으로
      return `${baseUrl}/schedules/club`;
    }

    case "MATCH": {
      // changes에서 scheduleId 추출
      const scheduleId = extractScheduleIdFromChanges(changes);
      if (scheduleId) {
        return `${baseUrl}/schedules/club?scheduleId=${scheduleId}`;
      }
      return `${baseUrl}/schedules/club`;
    }

    case "CLUB":
      // 클럽 홈 페이지 (entityId가 clubId)
      return `${baseUrl}/clubs/${entityId}`;

    case "CLUB_MEMBER":
      // 클럽 멤버 목록
      return `${baseUrl}/clubs/${clubId}/members`;

    default:
      return null;
  }
}

/**
 * changes JSON에서 scheduleId 추출
 */
function extractScheduleIdFromChanges(changes?: string): number | null {
  if (!changes) return null;

  try {
    const parsed = JSON.parse(changes);
    // before나 after에서 scheduleId 찾기
    const scheduleId =
      parsed.after?.scheduleId ||
      parsed.before?.scheduleId ||
      parsed.after?.schedule_id ||
      parsed.before?.schedule_id;
    return scheduleId ? Number(scheduleId) : null;
  } catch {
    return null;
  }
}

/**
 * entityType에 따른 라벨 반환
 */
export function getFrontendLinkLabel(entityType: string): string {
  switch (entityType) {
    case "SCHEDULE":
      return "일정 보기";
    case "SCHEDULE_PARTICIPANT":
      return "일정 보기";
    case "MATCH":
      return "일정 보기";
    case "CLUB":
      return "클럽 보기";
    case "CLUB_MEMBER":
      return "멤버 관리";
    default:
      return "바로가기";
  }
}
