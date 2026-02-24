/**
 * 플랫폼 감지 유틸리티
 * fcmService.ts, MorePage.tsx 등에서 분산되어 있던 로직을 중앙화
 */

export const isIOS = (): boolean =>
  /iphone|ipad|ipod/i.test(navigator.userAgent);

export const isAndroid = (): boolean =>
  /android/i.test(navigator.userAgent);

export const isPWA = (): boolean =>
  window.matchMedia("(display-mode: standalone)").matches ||
  (window.navigator as unknown as { standalone?: boolean }).standalone === true;

/**
 * iOS Safari 브라우저인지 확인 (PWA가 아닌 경우)
 * Chrome iOS, Firefox iOS, Edge iOS 등은 제외
 */
export const isIOSSafari = (): boolean => {
  const ua = navigator.userAgent.toLowerCase();
  return (
    /iphone|ipad|ipod/.test(ua) &&
    /safari/.test(ua) &&
    !/crios|fxios|edgios/.test(ua) &&
    !isPWA()
  );
};

export const isMobile = (): boolean => isIOS() || isAndroid();
