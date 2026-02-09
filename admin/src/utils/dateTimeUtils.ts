/**
 * 날짜/시간 유틸리티 함수
 * 서버에서 UTC로 저장된 시간을 KST로 변환하여 표시
 */

const KST_TIMEZONE = "Asia/Seoul";

/**
 * UTC 시간 문자열을 Date 객체로 변환
 * ISO 문자열에 'Z'가 없으면 UTC로 명시
 */
function parseUtcDate(dateTimeStr: string): Date {
  const isoString = dateTimeStr.endsWith("Z") ? dateTimeStr : dateTimeStr + "Z";
  return new Date(isoString);
}

/**
 * 날짜/시간을 KST로 포맷팅 (풀 포맷)
 * 예: "2026년 2월 8일 (일) 15:05:15"
 */
export function formatDateTimeKST(dateTimeStr: string | null): string {
  if (!dateTimeStr) return "-";
  const date = parseUtcDate(dateTimeStr);
  return date.toLocaleString("ko-KR", {
    timeZone: KST_TIMEZONE,
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

/**
 * 날짜/시간을 KST로 포맷팅 (간략 포맷, 초 제외)
 * 예: "2026. 02. 08. 오후 03:05"
 */
export function formatDateTimeShortKST(dateTimeStr: string | null): string {
  if (!dateTimeStr) return "-";
  const date = parseUtcDate(dateTimeStr);
  return date.toLocaleString("ko-KR", {
    timeZone: KST_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

/**
 * 일정 시간을 시작-종료 형식으로 포맷팅
 * 예: "2026년 2월 15일 (일) 18:00 - 20:00" 또는 "26년 2월 15일(일) 6-8시"
 */
export function formatScheduleTimeRangeKST(
  scheduledAt: string | null,
  durationMinutes: number | null,
  style: "full" | "short" = "full"
): string {
  if (!scheduledAt) return "-";

  const startDate = parseUtcDate(scheduledAt);
  const duration = durationMinutes ?? 120; // 기본 2시간
  const endDate = new Date(startDate.getTime() + duration * 60 * 1000);

  if (style === "short") {
    // "26년 2월 15일(일) 6-8시" 스타일
    const dateStr = startDate.toLocaleDateString("ko-KR", {
      timeZone: KST_TIMEZONE,
      year: "2-digit",
      month: "long",
      day: "numeric",
      weekday: "short",
    });
    const startHour = startDate.toLocaleString("ko-KR", {
      timeZone: KST_TIMEZONE,
      hour: "numeric",
      hour12: false,
    });
    const endHour = endDate.toLocaleString("ko-KR", {
      timeZone: KST_TIMEZONE,
      hour: "numeric",
      hour12: false,
    });
    return `${dateStr} ${startHour}-${endHour}시`;
  }

  // "2026년 2월 15일 (일) 18:00 - 20:00" 스타일
  const dateStr = startDate.toLocaleDateString("ko-KR", {
    timeZone: KST_TIMEZONE,
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
  });
  const startTime = startDate.toLocaleTimeString("ko-KR", {
    timeZone: KST_TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const endTime = endDate.toLocaleTimeString("ko-KR", {
    timeZone: KST_TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  return `${dateStr} ${startTime} - ${endTime}`;
}

/**
 * 날짜만 KST로 포맷팅
 * 예: "2026년 2월 15일 (일)"
 */
export function formatDateKST(dateTimeStr: string | null): string {
  if (!dateTimeStr) return "-";
  const date = parseUtcDate(dateTimeStr);
  return date.toLocaleDateString("ko-KR", {
    timeZone: KST_TIMEZONE,
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
  });
}

/**
 * 시간만 KST로 포맷팅
 * 예: "18:00"
 */
export function formatTimeKST(dateTimeStr: string | null): string {
  if (!dateTimeStr) return "-";
  const date = parseUtcDate(dateTimeStr);
  return date.toLocaleTimeString("ko-KR", {
    timeZone: KST_TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}
