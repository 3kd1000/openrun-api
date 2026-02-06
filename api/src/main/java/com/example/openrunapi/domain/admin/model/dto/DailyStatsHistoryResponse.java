package com.example.openrunapi.domain.admin.model.dto;

import com.example.openrunapi.domain.admin.model.DailyStats;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDate;
import java.util.List;

/**
 * 일별 통계 히스토리 응답 DTO
 */
@Getter
@Builder
public class DailyStatsHistoryResponse {

    /**
     * 조회 기간 (1M, 3M, 6M, 1Y)
     */
    private String period;

    /**
     * 조회 시작일
     */
    private LocalDate startDate;

    /**
     * 조회 종료일
     */
    private LocalDate endDate;

    /**
     * 일별 통계 목록
     */
    private List<DailyStatsItem> items;

    /**
     * 요약 정보
     */
    private Summary summary;

    @Getter
    @Builder
    public static class DailyStatsItem {
        private LocalDate date;
        private Long totalUsers;
        private Long totalClubs;
        private Long dau;
        private Long wau;
        private Long mau;
        private Long newUsers;
        private Long newClubs;

        public static DailyStatsItem from(DailyStats stats) {
            return DailyStatsItem.builder()
                    .date(stats.getRecordDate())
                    .totalUsers(stats.getTotalUsers())
                    .totalClubs(stats.getTotalClubs())
                    .dau(stats.getDau())
                    .wau(stats.getWau())
                    .mau(stats.getMau())
                    .newUsers(stats.getNewUsers())
                    .newClubs(stats.getNewClubs())
                    .build();
        }
    }

    @Getter
    @Builder
    public static class Summary {
        /**
         * 기간 시작 시점 총 사용자 수
         */
        private Long startTotalUsers;

        /**
         * 기간 종료 시점 총 사용자 수
         */
        private Long endTotalUsers;

        /**
         * 사용자 증가 수
         */
        private Long userGrowth;

        /**
         * 기간 시작 시점 총 클럽 수
         */
        private Long startTotalClubs;

        /**
         * 기간 종료 시점 총 클럽 수
         */
        private Long endTotalClubs;

        /**
         * 클럽 증가 수
         */
        private Long clubGrowth;

        /**
         * 평균 DAU
         */
        private Double avgDau;

        /**
         * 평균 MAU
         */
        private Double avgMau;

        /**
         * 기간 내 총 신규 가입자
         */
        private Long totalNewUsers;

        /**
         * 기간 내 총 신규 클럽
         */
        private Long totalNewClubs;
    }

    public static DailyStatsHistoryResponse from(List<DailyStats> statsList, String period) {
        if (statsList.isEmpty()) {
            return DailyStatsHistoryResponse.builder()
                    .period(period)
                    .items(List.of())
                    .build();
        }

        List<DailyStatsItem> items = statsList.stream()
                .map(DailyStatsItem::from)
                .toList();

        DailyStats first = statsList.get(0);
        DailyStats last = statsList.get(statsList.size() - 1);

        // 평균 DAU/MAU 계산
        double avgDau = statsList.stream()
                .mapToLong(DailyStats::getDau)
                .average()
                .orElse(0);

        double avgMau = statsList.stream()
                .mapToLong(DailyStats::getMau)
                .average()
                .orElse(0);

        // 기간 내 총 신규 가입자/클럽
        long totalNewUsers = statsList.stream()
                .mapToLong(DailyStats::getNewUsers)
                .sum();

        long totalNewClubs = statsList.stream()
                .mapToLong(DailyStats::getNewClubs)
                .sum();

        Summary summary = Summary.builder()
                .startTotalUsers(first.getTotalUsers())
                .endTotalUsers(last.getTotalUsers())
                .userGrowth(last.getTotalUsers() - first.getTotalUsers())
                .startTotalClubs(first.getTotalClubs())
                .endTotalClubs(last.getTotalClubs())
                .clubGrowth(last.getTotalClubs() - first.getTotalClubs())
                .avgDau(Math.round(avgDau * 10) / 10.0)
                .avgMau(Math.round(avgMau * 10) / 10.0)
                .totalNewUsers(totalNewUsers)
                .totalNewClubs(totalNewClubs)
                .build();

        return DailyStatsHistoryResponse.builder()
                .period(period)
                .startDate(first.getRecordDate())
                .endDate(last.getRecordDate())
                .items(items)
                .summary(summary)
                .build();
    }
}
