package com.example.openrunapi.domain.club.model;

public enum RankingPeriod {
    MONTHLY,     // 월별
    QUARTERLY,   // 분기별 (1~3, 4~6, 7~9, 10~12)
    HALF_YEAR,   // 반기 (1~6, 7~12)
    YEARLY,      // 연간
    CUSTOM       // 클럽 정의 시즌
}
