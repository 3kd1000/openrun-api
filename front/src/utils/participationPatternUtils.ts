/**
 * "매달 X일 HH:mm" 형식의 패턴을 파싱하여 날짜 정보 추출
 */
export interface ParsedPattern {
  day: number;
  hour: number;
  minute: number;
}

export const parseParticipationPattern = (pattern: string): ParsedPattern | null => {
  const match = pattern.match(/매달 (\d+)일 (\d{2}):(\d{2})/);
  if (!match) {
    return null;
  }

  return {
    day: parseInt(match[1]),
    hour: parseInt(match[2]),
    minute: parseInt(match[3]),
  };
};

/**
 * 패턴과 scheduledAt을 기준으로 participationStartAt 계산
 */
export const calculateParticipationStartAt = (
  pattern: string,
  scheduledAt: Date
): Date | null => {
  const parsed = parseParticipationPattern(pattern);
  if (!parsed) {
    return null;
  }

  const year = scheduledAt.getFullYear();
  const month = scheduledAt.getMonth();

  // 해당 월의 마지막 날 계산
  const lastDay = new Date(year, month + 1, 0).getDate();
  const actualDay = Math.min(parsed.day, lastDay);

  return new Date(year, month, actualDay, parsed.hour, parsed.minute);
};

/**
 * 현재 폼 상태로부터 패턴 문자열 생성
 */
export const createParticipationPattern = (
  day: number,
  hour24: number,
  minute: number
): string => {
  const hourStr = String(hour24).padStart(2, '0');
  const minuteStr = String(minute).padStart(2, '0');
  return `매달 ${day}일 ${hourStr}:${minuteStr}`;
};

/**
 * 12시간제 시간을 24시간제로 변환
 */
export const convert12To24Hour = (hour12: number, amPm: "AM" | "PM"): number => {
  if (amPm === "AM") {
    return hour12 === 12 ? 0 : hour12;
  } else {
    return hour12 === 12 ? 12 : hour12 + 12;
  }
};
