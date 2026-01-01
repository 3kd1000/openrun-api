package com.example.openrunapi.domain.club.repository;

import com.example.openrunapi.domain.club.model.ClubMember;
import com.example.openrunapi.domain.club.model.ClubMemberStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ClubMemberRepository extends JpaRepository<ClubMember, Long> {
    boolean existsByClubIdAndUserId(Long clubId, Long userId);

    Optional<ClubMember> findByClubIdAndUserId(Long clubId, Long userId);

    List<ClubMember> findAllByClubId(Long clubId);

    List<ClubMember> findAllByClubIdAndStatus(Long clubId, ClubMemberStatus status);

    List<ClubMember> findAllByUserIdAndStatus(Long userId, ClubMemberStatus status);

    void deleteByClubIdAndUserId(Long clubId, Long userId);
}
