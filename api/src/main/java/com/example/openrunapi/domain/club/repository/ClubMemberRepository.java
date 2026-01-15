package com.example.openrunapi.domain.club.repository;

import com.example.openrunapi.domain.club.model.ClubMember;
import com.example.openrunapi.domain.club.model.ClubMemberStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ClubMemberRepository extends JpaRepository<ClubMember, Long> {
    boolean existsByClubIdAndUserId(Long clubId, Long userId);

    Optional<ClubMember> findByClubIdAndUserId(Long clubId, Long userId);

    /**
     * 클럽 회원 목록 조회 (이름순 정렬)
     */
    @Query("SELECT cm FROM ClubMember cm JOIN FETCH cm.user u WHERE cm.club.id = :clubId ORDER BY u.name ASC")
    List<ClubMember> findAllByClubId(@Param("clubId") Long clubId);

    /**
     * 클럽 회원 목록 조회 (상태별, 이름순 정렬)
     */
    @Query("SELECT cm FROM ClubMember cm JOIN FETCH cm.user u WHERE cm.club.id = :clubId AND cm.status = :status ORDER BY u.name ASC")
    List<ClubMember> findAllByClubIdAndStatus(@Param("clubId") Long clubId, @Param("status") ClubMemberStatus status);

    List<ClubMember> findAllByUserIdAndStatus(Long userId, ClubMemberStatus status);

    void deleteByClubIdAndUserId(Long clubId, Long userId);

    @Query("""
        SELECT cm.user.id
        FROM ClubMember cm
        WHERE cm.club.id = :clubId
          AND cm.status = com.example.openrunapi.domain.club.model.ClubMemberStatus.ACTIVE
          AND cm.user.id IN :userIds
    """)
    List<Long> findActiveMemberUserIdsInClub(@Param("clubId") Long clubId, @Param("userIds") List<Long> userIds);
}
