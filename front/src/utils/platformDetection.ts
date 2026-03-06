/**
 * 플랫폼 감지 유틸리티
 * fcmService.ts, MorePage.tsx 등에서 분산되어 있던 로직을 중앙화
 */

export const isIOS = (): boolean =>
  /iphone|ipad|ipod/i.test(navigator.userAgent) ||
  (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

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

/**
 * 인앱 브라우저 감지 (카카오톡, 네이버, 인스타그램, 페이스북, LINE 등)
 * Google OAuth가 인앱 브라우저에서 차단됨 (403 disallowed_useragent)
 */
export const isInAppBrowser = (): boolean =>
  /kakaotalk|naver\(|instagram|fbav|fban|line\//i.test(navigator.userAgent);
