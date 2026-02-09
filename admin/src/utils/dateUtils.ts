import { format, parseISO } from "date-fns";
import { ko } from "date-fns/locale";

// front/src/utils/dateUtils.ts 와 동일한 함수 재사용

/**
 * UTC ISO 문자열을 클라이언트 로컬 시간대로 변환하여 포맷
 * @param dateString - ISO 8601 형식의 날짜 문자열 (예: "2024-01-15T10:30:00" 또는 "2024-01-15T10:30:00Z")
 * @param formatStr - date-fns 포맷 문자열 (기본값: "yyyy-MM-dd HH:mm:ss")
 * @returns 로컬 시간대로 변환된 포맷된 날짜 문자열
 */
export function formatLocalDateTime(
  dateString: string,
  formatStr: string = "yyyy-MM-dd HH:mm:ss"
): string {
  if (!dateString) return "-";

  try {
    // 서버에서 오는 날짜가 UTC인 경우 'Z' suffix가 없을 수 있음
    // 명시적으로 UTC로 처리
    const normalizedDateString = dateString.endsWith("Z")
      ? dateString
      : `${dateString}Z`;

    const date = parseISO(normalizedDateString);
    return format(date, formatStr, { locale: ko });
  } catch {
    return dateString;
  }
}

/**
 * 짧은 날짜 포맷 (테이블용)
 */
export function formatShortDateTime(dateString: string): string {
  return formatLocalDateTime(dateString, "yyyy-MM-dd HH:mm");
}

/**
 * 상세 날짜 포맷 (모달용)
 */
export function formatFullDateTime(dateString: string): string {
  return formatLocalDateTime(dateString, "yyyy년 M월 d일 (EEE) HH:mm:ss");
}

/**
 * 일정 날짜/시간 포맷팅 함수 (front/src/utils/dateUtils.ts 그대로)
 * 축약된 형식으로 시작시간~종료시간을 표시합니다.
 *
 * @param scheduledAt - ISO 8601 형식의 시작 시간
 * @param durationMinutes - 소요 시간(분), 기본값 120
 * @returns 포맷팅된 문자열 (예: "25년 12월 24일(수) 14-16시")
 */
export const formatScheduleDateTime = (
  scheduledAt: string,
  durationMinutes: number = 120
): string => {
  const start = new Date(scheduledAt);
  const end = new Date(start.getTime() + durationMinutes * 60 * 1000);

  const year = format(start, "yy");
  const monthDay = format(start, "M월 d일(E)", { locale: ko });
  const startHour = format(start, "H");
  const endHour = format(end, "H");

  return `${year}년 ${monthDay} ${startHour}-${endHour}시`;
};
