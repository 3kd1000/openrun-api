package com.example.openrunapi.domain.club.repository;

import com.example.openrunapi.domain.club.model.ClubNotice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ClubNoticeRepository extends JpaRepository<ClubNotice, Long> {
    List<ClubNotice> findByClubIdOrderByDisplayOrder(Long clubId);

    /**
     * 최신 공지 id (없으면 null)
     */
    @Query("SELECT MAX(n.id) FROM ClubNotice n WHERE n.club.id = :clubId")
    Long findMaxIdByClubId(@Param("clubId") Long clubId);

    int countByClubId(Long clubId);

    boolean existsByClubIdAndTitle(Long clubId, String title);
}

