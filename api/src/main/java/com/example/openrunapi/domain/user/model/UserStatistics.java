package com.example.openrunapi.domain.user.model;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.math.RoundingMode;

/**
 * 사용자 경기 통계
 * - 클럽별로 사용자의 승률, 승점, 득실차 등을 저장
 * - 랭킹 조회 시 성능 최적화를 위한 집계 테이블
 */
@Getter
@Entity
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Table(
    name = "user_statistics",
    uniqueConstraints = {
        @UniqueConstraint(name = "uk_user_statistics_user_club", columnNames = {"user_id", "club_id"})
    }
)
public class UserStatistics {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "club_id", nullable = false)
    private Long clubId;

    @Column(name = "total_matches", nullable = false)
    private Integer totalMatches = 0;

    @Column(nullable = false)
    private Integer wins = 0;

    @Column(nullable = false)
    private Integer draws = 0;

    @Column(nullable = false)
    private Integer losses = 0;

    @Column(nullable = false)
    private Integer points = 0;  // 승점: 승=3점, 무=1점, 패=0점

    @Column(name = "total_points_scored", nullable = false)
    private Integer totalPointsScored = 0;  // 총 득점

    @Column(name = "total_points_conceded", nullable = false)
    private Integer totalPointsConceded = 0;  // 총 실점

    @Column(name = "win_rate", nullable = false, precision = 5, scale = 2)
    private BigDecimal winRate = BigDecimal.ZERO;  // 승률: (승 + 무×0.5) / 경기수

    @Column(name = "goal_difference", nullable = false)
    private Integer goalDifference = 0;  // 득실차

    @Builder
    public UserStatistics(Long userId, Long clubId) {
        this.userId = userId;
        this.clubId = clubId;
    }

    /**
     * 경기 결과 반영 (증분 업데이트)
     * @param isWin 승리 여부
     * @param isDraw 무승부 여부
     * @param pointsScored 득점
     * @param pointsConceded 실점
     */
    public void addMatchResult(boolean isWin, boolean isDraw, int pointsScored, int pointsConceded) {
        this.totalMatches++;

        if (isWin) {
            this.wins++;
            this.points += 3;
        } else if (isDraw) {
            this.draws++;
            this.points += 1;
        } else {
            this.losses++;
        }

        this.totalPointsScored += pointsScored;
        this.totalPointsConceded += pointsConceded;
        this.goalDifference = this.totalPointsScored - this.totalPointsConceded;

        // 승률 계산: (승 + 무×0.5) / 경기수
        if (this.totalMatches > 0) {
            BigDecimal winCount = BigDecimal.valueOf(this.wins);
            BigDecimal drawCount = BigDecimal.valueOf(this.draws).multiply(BigDecimal.valueOf(0.5));
            BigDecimal totalCount = BigDecimal.valueOf(this.totalMatches);

            this.winRate = winCount.add(drawCount)
                    .divide(totalCount, 2, RoundingMode.HALF_UP)
                    .multiply(BigDecimal.valueOf(100));
        }
    }

    /**
     * 경기 결과 차감 (경기 수정/삭제 시 사용)
     * @param isWin 승리 여부
     * @param isDraw 무승부 여부
     * @param pointsScored 득점
     * @param pointsConceded 실점
     */
    public void removeMatchResult(boolean isWin, boolean isDraw, int pointsScored, int pointsConceded) {
        this.totalMatches--;

        if (isWin) {
            this.wins--;
            this.points -= 3;
        } else if (isDraw) {
            this.draws--;
            this.points -= 1;
        } else {
            this.losses--;
        }

        this.totalPointsScored -= pointsScored;
        this.totalPointsConceded -= pointsConceded;
        this.goalDifference = this.totalPointsScored - this.totalPointsConceded;

        // 승률 재계산
        if (this.totalMatches > 0) {
            BigDecimal winCount = BigDecimal.valueOf(this.wins);
            BigDecimal drawCount = BigDecimal.valueOf(this.draws).multiply(BigDecimal.valueOf(0.5));
            BigDecimal totalCount = BigDecimal.valueOf(this.totalMatches);

            this.winRate = winCount.add(drawCount)
                    .divide(totalCount, 2, RoundingMode.HALF_UP)
                    .multiply(BigDecimal.valueOf(100));
        } else {
            this.winRate = BigDecimal.ZERO;
        }
    }

    /**
     * 통계 전체 재계산 (마이그레이션 등에서 사용)
     */
    public void recalculate(int wins, int draws, int losses, int pointsScored, int pointsConceded) {
        this.totalMatches = wins + draws + losses;
        this.wins = wins;
        this.draws = draws;
        this.losses = losses;
        this.points = wins * 3 + draws * 1;
        this.totalPointsScored = pointsScored;
        this.totalPointsConceded = pointsConceded;
        this.goalDifference = pointsScored - pointsConceded;

        // 승률 계산
        if (this.totalMatches > 0) {
            BigDecimal winCount = BigDecimal.valueOf(wins);
            BigDecimal drawCount = BigDecimal.valueOf(draws).multiply(BigDecimal.valueOf(0.5));
            BigDecimal totalCount = BigDecimal.valueOf(this.totalMatches);

            this.winRate = winCount.add(drawCount)
                    .divide(totalCount, 2, RoundingMode.HALF_UP)
                    .multiply(BigDecimal.valueOf(100));
        }
    }
}
