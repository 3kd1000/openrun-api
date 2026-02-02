package com.example.openrunapi.domain.club.repository;

import com.example.openrunapi.domain.club.model.ClubPolicy;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ClubPolicyRepository extends JpaRepository<ClubPolicy, Long> {

    Optional<ClubPolicy> findByClubId(Long clubId);

    boolean existsByClubId(Long clubId);

    List<ClubPolicy> findByClubIdIn(List<Long> clubIds);
}
