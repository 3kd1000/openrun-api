package com.example.openrunapi.domain.schedule.model;

/**
 * 일정 모임 타입 (매치 타입 - 복식/단식 구분)
 */
public enum MatchType {
    NONE,             // 선택안함
    MEN_DOUBLES,      // 남복
    WOMEN_DOUBLES,    // 여복
    MIXED_DOUBLES,    // 혼복
    SINGLES           // 단식
}
