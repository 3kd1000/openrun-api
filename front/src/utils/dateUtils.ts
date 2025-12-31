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

