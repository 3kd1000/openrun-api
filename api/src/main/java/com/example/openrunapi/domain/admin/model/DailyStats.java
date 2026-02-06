package com.example.openrunapi.domain.admin.model;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * 일별 서비스 통계 스냅샷 엔티티
 * 매일 자정 배치로 수집하여 저장
 */
@Getter
@Entity
@Table(name = "daily_stats")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class DailyStats {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * 통계 기준 날짜
     */
    @Column(name = "record_date", nullable = false, unique = true)
    private LocalDate recordDate;

    /**
     * 해당일 기준 총 사용자 수 (게스트 제외)
     */
    @Column(name = "total_users", nullable = false)
    private Long totalUsers;

    /**
     * 해당일 기준 총 클럽 수
     */
    @Column(name = "total_clubs", nullable = false)
    private Long totalClubs;

    /**
     * Daily Active Users - 해당일 로그인한 사용자 수
     */
    @Column(nullable = false)
    private Long dau;

    /**
     * Weekly Active Users - 해당일 기준 최근 7일간 로그인한 사용자 수
     */
    @Column(nullable = false)
    private Long wau;

    /**
     * Monthly Active Users - 해당일 기준 최근 30일간 로그인한 사용자 수
     */
    @Column(nullable = false)
    private Long mau;

    /**
     * 해당일 신규 가입자 수
     */
    @Column(name = "new_users", nullable = false)
    private Long newUsers;

    /**
     * 해당일 신규 개설 클럽 수
     */
    @Column(name = "new_clubs", nullable = false)
    private Long newClubs;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }

    @Builder
    public DailyStats(LocalDate recordDate, Long totalUsers, Long totalClubs,
                      Long dau, Long wau, Long mau, Long newUsers, Long newClubs) {
        this.recordDate = recordDate;
        this.totalUsers = totalUsers;
        this.totalClubs = totalClubs;
        this.dau = dau;
        this.wau = wau;
        this.mau = mau;
        this.newUsers = newUsers;
        this.newClubs = newClubs;
    }
}
