package com.example.openrunapi.domain.club.repository;

import com.example.openrunapi.domain.club.model.ClubMember;
import com.example.openrunapi.domain.club.model.ClubMemberStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.example.openrunapi.domain.club.model.ClubRole;

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

    /**
     * 클럽별 ACTIVE 멤버 수 집계 (Daily Batch용)
     * @return List of [clubId, memberCount]
     */
    @Query("""
        SELECT cm.club.id, COUNT(cm)
        FROM ClubMember cm
        WHERE cm.status = com.example.openrunapi.domain.club.model.ClubMemberStatus.ACTIVE
        GROUP BY cm.club.id
    """)
    List<Object[]> countActiveMembersByClub();

    /**
     * 클럽의 공용구 보유자 목록 조회 (이름순 정렬)
     */
    @Query("""
        SELECT cm FROM ClubMember cm
        JOIN FETCH cm.user u
        WHERE cm.club.id = :clubId
          AND cm.status = com.example.openrunapi.domain.club.model.ClubMemberStatus.ACTIVE
          AND cm.isBallKeeper = true
        ORDER BY u.name ASC
    """)
    List<ClubMember> findBallKeepersByClubId(@Param("clubId") Long clubId);

    /**
     * 클럽의 총 공용구 보유량 조회
     */
    @Query("""
        SELECT COALESCE(SUM(cm.ballQuantity), 0)
        FROM ClubMember cm
        WHERE cm.club.id = :clubId
          AND cm.status = com.example.openrunapi.domain.club.model.ClubMemberStatus.ACTIVE
          AND cm.isBallKeeper = true
    """)
    Integer sumBallQuantityByClubId(@Param("clubId") Long clubId);

    /**
     * 클럽의 ACTIVE 멤버 userId 목록 조회 (Admin 알림 발송용)
     */
    @Query("""
        SELECT cm.user.id
        FROM ClubMember cm
        WHERE cm.club.id = :clubId
          AND cm.status = com.example.openrunapi.domain.club.model.ClubMemberStatus.ACTIVE
    """)
    List<Long> findActiveUserIdsByClubId(@Param("clubId") Long clubId);

    /**
     * 클럽의 ACTIVE 멤버 수 조회
     */
    @Query("""
        SELECT COUNT(cm)
        FROM ClubMember cm
        WHERE cm.club.id = :clubId
          AND cm.status = com.example.openrunapi.domain.club.model.ClubMemberStatus.ACTIVE
    """)
    int countActiveByClubId(@Param("clubId") Long clubId);

    /**
     * 클럽의 ADMIN/OWNER 멤버 userId 목록 조회 (알림 발송용)
     */
    @Query("""
        SELECT cm.user.id
        FROM ClubMember cm
        WHERE cm.club.id = :clubId
          AND cm.status = com.example.openrunapi.domain.club.model.ClubMemberStatus.ACTIVE
          AND cm.role IN :roles
    """)
    List<Long> findUserIdsByClubIdAndRoleIn(@Param("clubId") Long clubId, @Param("roles") List<ClubRole> roles);

    /**
     * 사용자의 모든 클럽 멤버십 조회 (탈퇴 처리용)
     */
    List<ClubMember> findAllByUserId(Long userId);

    /**
     * 사용자의 모든 클럽 멤버십 삭제 (탈퇴 처리용)
     */
    void deleteAllByUserId(Long userId);
}
