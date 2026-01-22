import { format } from "date-fns";
import { ko } from "date-fns/locale";

/**
 * 타임스탬프 포맷팅 헬퍼 함수
 * KST(한국 표준시) 기준으로 포맷팅된 타임스탬프를 반환합니다.
 *
 * @returns 포맷팅된 타임스탬프 문자열 (예: "2024-01-15 14:30:25")
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
 * 일정 날짜/시간 포맷팅 함수
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

  // 년도 2자리
  const year = format(start, "yy");
  // 월/일(요일)
  const monthDay = format(start, "M월 d일(E)", { locale: ko });
  // 시작/종료 시간 (시만)
  const startHour = format(start, "H");
  const endHour = format(end, "H");

  return `${year}년 ${monthDay} ${startHour}-${endHour}시`;
};

