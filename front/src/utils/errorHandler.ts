import axios from 'axios';

/**
 * 에러 객체에서 메시지를 추출하는 유틸리티 함수
 */
export function getErrorMessage(error: unknown): string {
  // Axios 에러인 경우
  if (axios.isAxiosError(error)) {
    return error.response?.data?.message || error.message || '서버 오류가 발생했습니다';
  }

  // 일반 Error 객체인 경우
  if (error instanceof Error) {
    return error.message;
  }

  // 문자열인 경우
  if (typeof error === 'string') {
    return error;
  }

  // 알 수 없는 에러
  return '알 수 없는 오류가 발생했습니다';
}

/**
 * 에러를 콘솔에 로깅하는 유틸리티 함수
 */
export function logError(context: string, error: unknown): void {
  console.error(`[${context}] 오류:`, error);

  if (axios.isAxiosError(error)) {
    console.error('응답 상태:', error.response?.status);
    console.error('응답 데이터:', error.response?.data);
  }
}
