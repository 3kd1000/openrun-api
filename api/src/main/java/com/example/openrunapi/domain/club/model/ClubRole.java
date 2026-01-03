package com.example.openrunapi.domain.club.model;

/**
 * 클럽 내 회원 권한
 */
public enum ClubRole {
    /**
     * 일반 회원
     * - 참가신청/취소
     * - 본인 정보 조회
     */
    MEMBER,

    /**
     * 운영진
     * - MEMBER 권한 포함
     * - 일정 CRUD
     * - 참가자 관리 (추가/삭제)
     * - 대진 생성/수정/삭제
     * - 회원 목록 조회
     * - 스코어보드 조회
     */
    ADMIN,

    /**
     * 클럽 소유자
     * - ADMIN 권한 포함
     * - 클럽 정보 수정
     * - 클럽 삭제
     * - 소유권 이전
     * - ADMIN 임명/해임
     */
    OWNER;

    /**
     * ADMIN 이상 권한인지 확인
     */
    public boolean canManageSchedule() {
        return this == ADMIN || this == OWNER;
    }

    /**
     * OWNER 권한인지 확인
     */
    public boolean isOwner() {
        return this == OWNER;
    }

    /**
     * 회원 관리 권한이 있는지 확인 (ADMIN 임명 등)
     */
    public boolean canManageMembers() {
        return this == OWNER;
    }
}
