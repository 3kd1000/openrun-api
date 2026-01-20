/**
 * Feature Flags 설정
 *
 * 아직 공개하지 않을 기능이나, A/B 테스트, 점진적 롤아웃 등에 사용
 * 나중에 기능을 활성화하려면 해당 플래그를 true로 변경
 */

export const FEATURE_FLAGS = {
  /**
   * 교류전 기능
   * - 클럽탐색 페이지의 교류전 탭
   * - 외부요청 페이지의 INTERCLUB 필터/요청
   * - 일정 상세 모달의 교류전 모집 ON/OFF
   *
   * 현재 클럽이 1개뿐이라 비활성화 상태
   * 클럽 수가 늘어나면 true로 변경
   */
  INTERCLUB_ENABLED: false,
} as const;

export type FeatureFlag = keyof typeof FEATURE_FLAGS;

/**
 * Feature Flag 확인 헬퍼 함수
 */
export const isFeatureEnabled = (flag: FeatureFlag): boolean => {
  return FEATURE_FLAGS[flag];
};
