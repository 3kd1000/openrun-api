package com.example.openrunapi.domain.award.repository;

import com.example.openrunapi.domain.award.model.AwardWinner;
import com.example.openrunapi.domain.club.model.AwardType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface AwardWinnerRepository extends JpaRepository<AwardWinner, Long> {

    /**
     * 클럽의 특정 기간 수상자 조회
     */
    List<AwardWinner> findByClubIdAndPeriodStartAndPeriodEnd(
            Long clubId, LocalDate periodStart, LocalDate periodEnd
    );

    /**
     * 클럽의 특정 기간, 특정 타입 수상자 조회
     */
    Optional<AwardWinner> findByClubIdAndAwardTypeAndPeriodStartAndPeriodEnd(
            Long clubId, AwardType awardType, LocalDate periodStart, LocalDate periodEnd
    );

    /**
     * 클럽의 모든 수상 기록 조회 (최신순)
     */
    List<AwardWinner> findByClubIdOrderByPeriodStartDesc(Long clubId);

    /**
     * 특정 사용자의 수상 기록 조회
     */
    List<AwardWinner> findByUserIdOrderByPeriodStartDesc(Long userId);

    /**
     * 현재 기간에 수상자인 사용자 ID 목록 조회 (클럽별)
     */
    @Query("SELECT aw.userId FROM AwardWinner aw " +
            "WHERE aw.clubId = :clubId " +
            "AND aw.periodStart <= :currentDate " +
            "AND aw.periodEnd >= :currentDate")
    List<Long> findCurrentWinnerUserIds(
            @Param("clubId") Long clubId,
            @Param("currentDate") LocalDate currentDate
    );

    /**
     * 기존 수상 기록 삭제 (덮어쓰기용)
     */
    void deleteByClubIdAndAwardTypeAndPeriodStartAndPeriodEnd(
            Long clubId, AwardType awardType, LocalDate periodStart, LocalDate periodEnd
    );

    /**
     * 탈퇴한 사용자의 수상 기록 익명화 (user_id를 null로 설정)
     */
    @Modifying
    @Query("UPDATE AwardWinner aw SET aw.userId = null WHERE aw.userId = :userId")
    void anonymizeByUserId(@Param("userId") Long userId);
}
