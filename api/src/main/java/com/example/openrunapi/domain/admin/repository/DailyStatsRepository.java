package com.example.openrunapi.domain.admin.repository;

import com.example.openrunapi.domain.admin.model.DailyStats;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface DailyStatsRepository extends JpaRepository<DailyStats, Long> {

    /**
     * 특정 날짜의 통계 조회
     */
    Optional<DailyStats> findByRecordDate(LocalDate recordDate);

    /**
     * 특정 날짜의 통계 존재 여부 확인
     */
    boolean existsByRecordDate(LocalDate recordDate);

    /**
     * 기간별 통계 조회 (최신순)
     */
    @Query("SELECT ds FROM DailyStats ds WHERE ds.recordDate >= :startDate ORDER BY ds.recordDate ASC")
    List<DailyStats> findByRecordDateAfterOrderByRecordDateAsc(@Param("startDate") LocalDate startDate);

    /**
     * 최근 N일간 통계 조회 (최신순)
     */
    @Query("SELECT ds FROM DailyStats ds ORDER BY ds.recordDate DESC LIMIT :days")
    List<DailyStats> findRecentStats(@Param("days") int days);

    /**
     * 가장 최근 통계 조회
     */
    Optional<DailyStats> findTopByOrderByRecordDateDesc();
}
