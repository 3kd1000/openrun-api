package com.example.openrunapi.domain.schedule.model;

/**
 * 일정 템플릿 타입
 * - SCHEDULE: 일정 정보 템플릿 (코트명, 정원, 비용)
 * - PARTICIPATION_START: 참가신청 시작시간 템플릿 (참가신청 시작시간 패턴만)
 */
public enum TemplateType {
    /**
     * 일정 템플릿
     * - 저장 필드: courtName, maxCapacity, cost
     * - 예시: "주말오전", "평일저녁"
     */
    SCHEDULE,

    /**
     * 참가신청 시작시간 템플릿
     * - 저장 필드: participationStartPattern
     * - 예시: "매달1일", "25일밤"
     */
    PARTICIPATION_START
}
