package com.example.openrunapi.domain.club.repository;

import com.example.openrunapi.domain.club.model.ClubRule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ClubRuleRepository extends JpaRepository<ClubRule, Long> {

    List<ClubRule> findByClubIdOrderByDisplayOrder(Long clubId);

    boolean existsByClubIdAndTitle(Long clubId, String title);

    int countByClubId(Long clubId);

    void deleteByClubId(Long clubId);
}
