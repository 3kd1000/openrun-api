/**
 * AuthBridge - React Context 외부에서 토큰 갱신 상태를 참조할 수 있는 브릿지
 *
 * 왜 필요한가:
 * - axiosInstance는 React 컴포넌트가 아니라 useAuth()를 사용할 수 없음
 * - 전역 변수 + getter/setter 패턴으로 상태 공유
 * - AuthContext에서 토큰 갱신 시작/완료 시 이 브릿지도 동기적으로 업데이트
 */

let _isTokenRefreshing = false;
let _refreshPromise: Promise<void> | null = null;

export const authBridge = {
  /** 현재 토큰 갱신 중인지 여부 */
  get isTokenRefreshing(): boolean {
    return _isTokenRefreshing;
  },

  /** AuthContext에서 호출 - 갱신 시작 시 */
  setRefreshing(promise: Promise<void>): void {
    _isTokenRefreshing = true;
    _refreshPromise = promise;
  },

  /** AuthContext에서 호출 - 갱신 완료 시 */
  clearRefreshing(): void {
    _isTokenRefreshing = false;
    _refreshPromise = null;
  },

  /**
   * axiosInstance에서 호출 - 갱신 완료를 대기
   * 갱신 중이면 해당 Promise를 기다리고, 아니면 즉시 resolve
   * @param timeoutMs 타임아웃 (기본 10초)
   */
  async waitForRefresh(timeoutMs: number = 10000): Promise<void> {
    if (!_refreshPromise) return;
    await Promise.race([
      _refreshPromise,
      new Promise<void>((_, reject) =>
        setTimeout(
          () => reject(new Error("Token refresh timeout")),
          timeoutMs
        )
      ),
    ]);
  },
};
