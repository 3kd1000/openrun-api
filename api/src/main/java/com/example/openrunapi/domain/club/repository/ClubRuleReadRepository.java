package com.example.openrunapi.domain.club.repository;

import com.example.openrunapi.domain.club.model.ClubRuleRead;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ClubRuleReadRepository extends JpaRepository<ClubRuleRead, Long> {

    /**
     * unread 개수: club의 회칙 중 user가 읽지 않은 회칙 수
     */
    @Query("""
            SELECT COUNT(r)
            FROM ClubRule r
            WHERE r.club.id = :clubId
              AND NOT EXISTS (
                SELECT 1
                FROM ClubRuleRead rr
                WHERE rr.rule.id = r.id
                  AND rr.user.id = :userId
              )
            """)
    long countUnread(@Param("clubId") Long clubId, @Param("userId") Long userId);

    /**
     * 특정 회칙까지(<= upToRuleId) 읽음 처리: 이미 읽음은 제외하고 insert
     * Postgres 기준 native query
     */
    @Modifying
    @Query(value = """
            INSERT INTO club_rule_read (club_id, rule_id, user_id, read_at)
            SELECT r.club_id, r.id, :userId, NOW()
            FROM club_rule r
            WHERE r.club_id = :clubId
              AND r.id <= :upToRuleId
              AND NOT EXISTS (
                SELECT 1
                FROM club_rule_read rr
                WHERE rr.rule_id = r.id
                  AND rr.user_id = :userId
              )
            """, nativeQuery = true)
    int markReadUpTo(@Param("clubId") Long clubId, @Param("userId") Long userId, @Param("upToRuleId") Long upToRuleId);
}
