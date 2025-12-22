package com.example.openrunapi.domain.user.repository;

import com.example.openrunapi.domain.user.model.UserStatistics;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UserStatisticsRepository extends JpaRepository<UserStatistics, Long> {

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
}
