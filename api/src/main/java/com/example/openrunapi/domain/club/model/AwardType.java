package com.example.openrunapi.domain.club.model;

/**
 * 어워드 타입
 */
public enum AwardType {
    ATTENDANCE,  // 다참 - 가장 많이 참여한 경기 수 (기록 탭 "경기수"와 동일 기준)
    POINTS,      // 다승점 - 가장 높은 승점
    BOOKING      // 예약왕 - 가장 많이 예약
}
