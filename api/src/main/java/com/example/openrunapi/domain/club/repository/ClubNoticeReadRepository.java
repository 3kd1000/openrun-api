package com.example.openrunapi.domain.club.repository;

import com.example.openrunapi.domain.club.model.ClubNoticeRead;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ClubNoticeReadRepository extends JpaRepository<ClubNoticeRead, Long> {

    /**
     * unread 개수: club의 공지 중 user가 읽지 않은 공지 수
     */
    @Query("""
            SELECT COUNT(n)
            FROM ClubNotice n
            WHERE n.club.id = :clubId
              AND NOT EXISTS (
                SELECT 1
                FROM ClubNoticeRead r
                WHERE r.notice.id = n.id
                  AND r.user.id = :userId
              )
            """)
    long countUnread(@Param("clubId") Long clubId, @Param("userId") Long userId);

    /**
     * 특정 공지까지(<= upToNoticeId) 읽음 처리: 이미 읽음은 제외하고 insert
     * Postgres 기준 native query
     */
    @Modifying
    @Query(value = """
            INSERT INTO club_notice_read (club_id, notice_id, user_id, read_at)
            SELECT n.club_id, n.id, :userId, NOW()
            FROM club_notice n
            WHERE n.club_id = :clubId
              AND n.id <= :upToNoticeId
              AND NOT EXISTS (
                SELECT 1
                FROM club_notice_read r
                WHERE r.notice_id = n.id
                  AND r.user_id = :userId
              )
            """, nativeQuery = true)
    int markReadUpTo(@Param("clubId") Long clubId, @Param("userId") Long userId, @Param("upToNoticeId") Long upToNoticeId);
}

