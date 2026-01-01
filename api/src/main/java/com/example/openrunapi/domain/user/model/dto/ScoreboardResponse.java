package com.example.openrunapi.domain.user.model.dto;

import com.example.openrunapi.domain.user.model.UserStatistics;
import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;
import java.util.stream.IntStream;

/**
 * 스코어보드 응답 DTO
 */
@Getter
@Builder
public class ScoreboardResponse {

    private List<RankingEntry> rankings;

    /**
     * UserStatistics 리스트를 RankingEntry 리스트로 변환
     * @param statistics 승점 순으로 정렬된 통계 리스트
     */
    public static ScoreboardResponse from(List<UserStatistics> statistics) {
        List<RankingEntry> rankings = IntStream.range(0, statistics.size())
                .mapToObj(index -> RankingEntry.from(index + 1, statistics.get(index)))
                .collect(Collectors.toList());

        return ScoreboardResponse.builder()
                .rankings(rankings)
                .build();
    }

    /**
     * 개별 랭킹 항목
     */
    @Getter
    @Builder
    @lombok.Setter
    public static class RankingEntry {
        private Integer rank;                // 순위
        private Long userId;                 // 사용자 ID
        private String userName;             // 사용자 이름
        private Integer totalMatches;        // 경기수
        private Integer points;              // 승점
        private BigDecimal winRate;          // 승률 (%)
        private Integer wins;                // 승
        private Integer draws;               // 무
        private Integer losses;              // 패
        private Integer goalDifference;      // 득실차
        private Integer totalPointsScored;   // 득점
        private Integer totalPointsConceded; // 실점

        public static RankingEntry from(int rank, UserStatistics stats) {
            return RankingEntry.builder()
                    .rank(rank)
                    .userId(stats.getUserId())
                    .userName("사용자" + stats.getUserId())  // TODO: User 엔티티 조회 필요
                    .totalMatches(stats.getTotalMatches())
                    .points(stats.getPoints())
                    .winRate(stats.getWinRate())
                    .wins(stats.getWins())
                    .draws(stats.getDraws())
                    .losses(stats.getLosses())
                    .goalDifference(stats.getGoalDifference())
                    .totalPointsScored(stats.getTotalPointsScored())
                    .totalPointsConceded(stats.getTotalPointsConceded())
                    .build();
        }
    }
}
