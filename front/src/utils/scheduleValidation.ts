/**
 * 일정 관련 validation 유틸리티
 */

/**
 * 날짜가 과거인지 확인 (시간 포함)
 * @param dateString ISO 8601 형식의 날짜 문자열 (예: "2025-12-31T10:00:00")
 * @returns 과거 날짜면 true, 미래/현재면 false
 */
export const isPastDate = (dateString: string): boolean => {
  const date = new Date(dateString);
  const now = new Date();
  return date < now;
};

/**
 * 일정 생성 가능 여부 확인
 * @param scheduledAt 일정 시간 (ISO 8601 형식)
 * @returns { isValid: boolean, errorMessage?: string }
 */
export const validateScheduleCreation = (
  scheduledAt: string
): {
  isValid: boolean;
  errorMessage?: string;
} => {
  if (!scheduledAt) {
    return {
      isValid: false,
      errorMessage: "일정 시간을 입력해주세요.",
    };
  }

  if (isPastDate(scheduledAt)) {
    return {
      isValid: false,
      errorMessage: "과거 날짜에는 일정을 생성할 수 없습니다.",
    };
  }

  return { isValid: true };
};

/**
 * 참가신청 가능 여부 확인
 * @param scheduledAt 일정 시간 (ISO 8601 형식)
 * @param participationStartAt 참가신청 시작 시간 (ISO 8601 형식, 선택적)
 * @returns { isValid: boolean, errorMessage?: string }
 */
export const validateParticipation = (
  scheduledAt: string,
  participationStartAt?: string | null
): {
  isValid: boolean;
  errorMessage?: string;
} => {
  if (!scheduledAt) {
    return {
      isValid: false,
      errorMessage: "일정 정보를 찾을 수 없습니다.",
    };
  }

  // 과거 일정에는 참가신청 불가
  if (isPastDate(scheduledAt)) {
    return {
      isValid: false,
      errorMessage: "이미 지난 일정에는 참가신청할 수 없습니다.",
    };
  }

  // 참가신청 시작 시간 체크
  if (participationStartAt) {
    const now = new Date();
    const startTime = new Date(participationStartAt);
    if (now < startTime) {
      return {
        isValid: false,
        errorMessage: `참가신청 시작 시간이 아직 도래하지 않았습니다. (시작 시간: ${startTime.toLocaleString(
          "ko-KR"
        )})`,
      };
    }
  }

  return { isValid: true };
};

/**
 * 대진 생성 가능 여부 확인
 * @param scheduledAt 일정 시간 (ISO 8601 형식)
 * @returns { isValid: boolean, errorMessage?: string }
 */
export const validateDrawCreation = (
  scheduledAt: string
): {
  isValid: boolean;
  errorMessage?: string;
} => {
  if (!scheduledAt) {
    return {
      isValid: false,
      errorMessage: "일정 정보를 찾을 수 없습니다.",
    };
  }

  // 과거 일정에는 대진 생성 불가
  if (isPastDate(scheduledAt)) {
    return {
      isValid: false,
      errorMessage: "이미 지난 일정에는 대진을 생성할 수 없습니다.",
    };
  }

  return { isValid: true };
};
