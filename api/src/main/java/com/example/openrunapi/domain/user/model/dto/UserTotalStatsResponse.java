package com.example.openrunapi.domain.user.model.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * 사용자 전체 클럽 통계 합산 응답 DTO
 * - 모든 클럽에서의 승/무/패/총경기수 합산
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserTotalStatsResponse {

    private Long wins;
    private Long draws;
    private Long losses;
    private Long totalMatches;

    public static UserTotalStatsResponse empty() {
        return UserTotalStatsResponse.builder()
                .wins(0L)
                .draws(0L)
                .losses(0L)
                .totalMatches(0L)
                .build();
    }
}
