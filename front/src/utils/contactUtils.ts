/**
 * 연락처(전화번호) 관련 유틸리티
 * - 정규화: 저장 시 숫자만 추출
 * - 검증: 11자리 휴대폰 번호 확인
 * - 포맷팅: 표시 시 XXX-XXXX-XXXX 형식
 */

/**
 * 전화번호 정규화 (저장용)
 * - 공백, 하이픈 제거
 * - 숫자만 추출
 *
 * @example
 * normalizePhoneNumber("010-1234-5678") → "01012345678"
 * normalizePhoneNumber("010 1234 5678") → "01012345678"
 * normalizePhoneNumber("01012345678") → "01012345678"
 */
export function normalizePhoneNumber(phone: string): string {
  if (!phone) return "";
  return phone.replace(/[^0-9]/g, "");
}

/**
 * 전화번호 검증
 * - 010/011/016/017/018/019로 시작
 * - 총 11자리 숫자
 *
 * @returns 에러 메시지 (유효하면 null)
 */
export function validatePhoneNumber(phone: string): string | null {
  if (!phone || phone.trim() === "") {
    return null; // 빈 값은 허용 (선택 입력)
  }

  const normalized = normalizePhoneNumber(phone);

  if (normalized.length !== 11) {
    return "전화번호는 11자리여야 합니다.";
  }

  if (!/^01[0-9]/.test(normalized)) {
    return "올바른 휴대폰 번호 형식이 아닙니다.";
  }

  return null; // 유효함
}

/**
 * 전화번호 포맷팅 (표시용)
 * - 11자리 숫자를 XXX-XXXX-XXXX 형식으로 변환
 *
 * @example
 * formatPhoneNumber("01012345678") → "010-1234-5678"
 * formatPhoneNumber("010-1234-5678") → "010-1234-5678" (이미 포맷된 경우도 처리)
 */
export function formatPhoneNumber(phone: string | null | undefined): string {
  if (!phone) return "";

  const normalized = normalizePhoneNumber(phone);

  if (normalized.length !== 11) {
    return phone; // 11자리가 아니면 원본 반환
  }

  return `${normalized.slice(0, 3)}-${normalized.slice(3, 7)}-${normalized.slice(7)}`;
}
