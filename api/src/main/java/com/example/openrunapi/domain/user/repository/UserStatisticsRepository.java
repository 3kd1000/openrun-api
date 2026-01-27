package com.example.openrunapi.domain.user.repository;

import com.example.openrunapi.domain.user.model.UserStatistics;
import com.example.openrunapi.domain.user.model.dto.UserTotalStatsResponse;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface UserStatisticsRepository extends JpaRepository<UserStatistics, Long> {

    /**
     * 사용자의 전체 클럽 통계 합산 조회
     */
    @Query("SELECT new com.example.openrunapi.domain.user.model.dto.UserTotalStatsResponse(" +
           "COALESCE(SUM(us.wins), 0L), COALESCE(SUM(us.draws), 0L), " +
           "COALESCE(SUM(us.losses), 0L), COALESCE(SUM(us.totalMatches), 0L)) " +
           "FROM UserStatistics us WHERE us.userId = :userId")
    UserTotalStatsResponse findTotalStatsByUserId(@Param("userId") Long userId);

    /**
     * 특정 사용자의 특정 클럽 통계 조회
     */
    Optional<UserStatistics> findByUserIdAndClubId(Long userId, Long clubId);

    /**
     * 특정 클럽의 전체 랭킹 조회 (승점 내림차순)
     */
    List<UserStatistics> findByClubIdOrderByPointsDescGoalDifferenceDesc(Long clubId);

    /**
     * 특정 클럽의 전체 통계 조회
     */
    List<UserStatistics> findByClubId(Long clubId);

    /**
     * 특정 클럽의 전체 랭킹 조회 (게스트 제외, 승점 내림차순)
     */
    @Query("SELECT us FROM UserStatistics us " +
           "JOIN User u ON us.userId = u.id " +
           "WHERE us.clubId = :clubId AND u.isGuest = false " +
           "ORDER BY us.points DESC, us.goalDifference DESC")
    List<UserStatistics> findByClubIdExcludingGuestsOrderByPointsDescGoalDifferenceDesc(@Param("clubId") Long clubId);

    /**
     * 특정 클럽의 전체 통계 조회 (게스트 제외)
     */
    @Query("SELECT us FROM UserStatistics us " +
           "JOIN User u ON us.userId = u.id " +
           "WHERE us.clubId = :clubId AND u.isGuest = false")
    List<UserStatistics> findByClubIdExcludingGuests(@Param("clubId") Long clubId);
}
