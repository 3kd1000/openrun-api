import { format, parseISO } from "date-fns";
import { ko } from "date-fns/locale";

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
