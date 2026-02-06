package com.example.openrunapi.domain.admin.model.dto;

import lombok.Builder;
import lombok.Getter;

/**
 * 대시보드 통계 응답 DTO
 */
@Getter
@Builder
public class UserStatsResponse {
    /**
     * 전체 사용자 수 (게스트 제외)
     */
    private long totalUsers;

    /**
     * 전체 클럽 수
     */
    private long totalClubs;

    /**
     * DAU (Daily Active Users) - 오늘 로그인한 사용자 수
     */
    private long dau;

    /**
     * WAU (Weekly Active Users) - 최근 7일 내 로그인한 사용자 수
     */
    private long wau;

    /**
     * MAU (Monthly Active Users) - 최근 30일 내 로그인한 사용자 수
     */
    private long mau;

    /**
     * 오늘 가입한 사용자 수
     */
    private long newUsersToday;

    /**
     * 최근 7일 내 가입한 사용자 수
     */
    private long newUsersThisWeek;

    /**
     * 최근 30일 내 가입한 사용자 수
     */
    private long newUsersThisMonth;
}
