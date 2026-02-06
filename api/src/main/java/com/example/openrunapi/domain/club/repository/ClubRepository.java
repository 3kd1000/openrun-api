package com.example.openrunapi.domain.club.repository;

import com.example.openrunapi.domain.club.model.Club;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface ClubRepository extends JpaRepository<Club, Long>, JpaSpecificationExecutor<Club> {

    /**
     * 클럽 이름으로 조회 (시스템 클럽 조회용)
     */
    Optional<Club> findByName(String name);

    /**
     * 사용자가 소유한 클럽 목록 조회
     */
    List<Club> findByOwnerUserId(Long ownerUserId);

    /**
     * 특정 시간 이후 생성된 클럽 수 조회 (일별 통계용)
     */
    @Query("SELECT COUNT(c) FROM Club c WHERE c.createdAt >= :since")
    long countNewClubsSince(@Param("since") LocalDateTime since);
}
