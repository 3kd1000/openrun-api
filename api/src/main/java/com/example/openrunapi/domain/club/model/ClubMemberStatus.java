package com.example.openrunapi.domain.club.model;

/**
 * 클럽 회원 상태
 *
 * ACTIVE: 활성 회원 (정상적으로 활동 중인 회원)
 * INACTIVE: 휴면 회원 (향후 휴면 회원 관리 기능을 위해 예약)
 *
 * 참고: 가입 승인 워크플로우는 ExternalRequest.status에서 관리됩니다.
 * - ExternalRequest.status = PENDING: 승인 대기 중
 * - ExternalRequest.status = APPROVED: 승인됨 (회원 목록에 표시)
 * - ExternalRequest.status = REJECTED: 거절됨
 */
public enum ClubMemberStatus {
    ACTIVE,    // 활성 회원
    INACTIVE   // 휴면 회원 (향후 기능)
}
