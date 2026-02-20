import { format } from "date-fns";
import { ko } from "date-fns/locale";

/**
 * KST 기준 타임스탬프 문자열 반환
 */
export const getTimestamp = (): string => {
  return new Date().toLocaleString("ko-KR", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
};

/**
 * 일정 날짜/시간 포맷팅 (예: "25년 12월 24일(수) 14-16시")
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

/**
 * 일정 날짜만 포맷팅 (예: "26년 1월 24일 (금)")
 */
export const formatScheduleDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  const year = format(date, "yy");
  const monthDay = format(date, "M월 d일 (E)", { locale: ko });
  return `${year}년 ${monthDay}`;
};

/**
 * 짧은 날짜 포맷팅 (예: "26-01-24")
 */
export const formatShortDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  return format(date, "yy-MM-dd");
};
