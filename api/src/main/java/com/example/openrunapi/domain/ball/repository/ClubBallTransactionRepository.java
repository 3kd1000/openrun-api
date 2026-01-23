package com.example.openrunapi.domain.ball.repository;

import com.example.openrunapi.domain.ball.model.BallTransactionType;
import com.example.openrunapi.domain.ball.model.ClubBallTransaction;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface ClubBallTransactionRepository extends JpaRepository<ClubBallTransaction, Long> {

    /**
     * 클럽의 거래 내역 조회 (페이징, 최신순)
     */
    @Query("""
        SELECT t FROM ClubBallTransaction t
        LEFT JOIN FETCH t.fromMember fm
        LEFT JOIN FETCH fm.user fmu
        LEFT JOIN FETCH t.toMember tm
        LEFT JOIN FETCH tm.user tmu
        LEFT JOIN FETCH t.schedule s
        LEFT JOIN FETCH t.createdBy cb
        WHERE t.club.id = :clubId
        ORDER BY t.createdAt DESC
    """)
    Page<ClubBallTransaction> findByClubIdOrderByCreatedAtDesc(
            @Param("clubId") Long clubId,
            Pageable pageable
    );

    /**
     * 특정 기간 동안의 거래 타입별 합계 조회
     */
    @Query("""
        SELECT t.transactionType, COALESCE(SUM(t.quantity), 0)
        FROM ClubBallTransaction t
        WHERE t.club.id = :clubId
          AND t.createdAt >= :startDate
          AND t.createdAt < :endDate
        GROUP BY t.transactionType
    """)
    List<Object[]> sumQuantityByTypeAndDateRange(
            @Param("clubId") Long clubId,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate
    );

    /**
     * 특정 일정의 공용구 사용 내역 조회
     */
    @Query("""
        SELECT t FROM ClubBallTransaction t
        LEFT JOIN FETCH t.fromMember fm
        LEFT JOIN FETCH fm.user fmu
        LEFT JOIN FETCH t.createdBy cb
        WHERE t.schedule.id = :scheduleId
          AND t.transactionType = 'USE'
        ORDER BY t.createdAt DESC
    """)
    List<ClubBallTransaction> findByScheduleId(@Param("scheduleId") Long scheduleId);

    /**
     * 특정 거래 타입의 월간 합계 조회
     */
    @Query("""
        SELECT COALESCE(SUM(t.quantity), 0)
        FROM ClubBallTransaction t
        WHERE t.club.id = :clubId
          AND t.transactionType = :type
          AND t.createdAt >= :startDate
          AND t.createdAt < :endDate
    """)
    Integer sumQuantityByTypeAndMonth(
            @Param("clubId") Long clubId,
            @Param("type") BallTransactionType type,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate
    );
}
