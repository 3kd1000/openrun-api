import { useEffect } from 'react';

/**
 * ESC 키를 눌렀을 때 콜백 함수를 실행하는 훅
 * @param callback ESC 키를 눌렀을 때 실행할 함수
 * @param isEnabled 훅 활성화 여부 (기본값: true)
 */
export const useEscapeKey = (
  callback: () => void,
  isEnabled: boolean = true
) => {
  useEffect(() => {
    if (!isEnabled) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        callback();
      }
    };

    window.addEventListener('keydown', handleEscape);

    return () => {
      window.removeEventListener('keydown', handleEscape);
    };
  }, [callback, isEnabled]);
};

