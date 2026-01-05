/**
 * 값이 비어있는지 확인하는 유틸리티 함수
 * @param value - 확인할 값 (number, string, object, array 등)
 * @returns true: 비어있음, false: 값이 있음
 */
export const isEmpty = (value: unknown): boolean => {
  // null 또는 undefined
  if (value === null || value === undefined) {
    return true;
  }

  // number: 0이면 비어있는 것으로 간주
  if (typeof value === "number") {
    return value === 0;
  }

  // string: 빈 문자열이거나 공백만 있으면 비어있는 것으로 간주
  if (typeof value === "string") {
    return value.trim() === "";
  }

  // array: 길이가 0이면 비어있는 것으로 간주
  if (Array.isArray(value)) {
    return value.length === 0;
  }

  // object: 빈 객체이면 비어있는 것으로 간주
  if (typeof value === "object") {
    return Object.keys(value).length === 0;
  }

  // 그 외의 경우는 false 반환 (값이 있다고 간주)
  return false;
};

/**
 * 값이 비어있지 않은지 확인하는 유틸리티 함수
 * @param value - 확인할 값
 * @returns true: 값이 있음, false: 비어있음
 */
export const isNotEmpty = (value: unknown): boolean => {
  return !isEmpty(value);
};

/**
 * 점수가 설정되었는지 확인하는 함수 (0점도 유효한 점수로 간주)
 * @param value - 확인할 점수 값
 * @returns true: 점수가 설정됨 (null/undefined가 아님), false: 점수가 설정되지 않음
 */
export const isScoreSet = (value: unknown): boolean => {
  return value !== null && value !== undefined;
};

/**
 * 점수가 설정되지 않았는지 확인하는 함수
 * @param value - 확인할 점수 값
 * @returns true: 점수가 설정되지 않음, false: 점수가 설정됨
 */
export const isScoreNotSet = (value: unknown): boolean => {
  return !isScoreSet(value);
};
