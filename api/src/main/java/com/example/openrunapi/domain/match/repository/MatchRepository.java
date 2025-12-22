package com.example.openrunapi.domain.match.repository;

import com.example.openrunapi.domain.match.model.Match;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface MatchRepository extends JpaRepository<Match, Long>, JpaSpecificationExecutor<Match> {

    // club_id로 조회 (성능 최적화)
    List<Match> findByClubIdOrderByPlayedAtDesc(Long clubId);

    // schedule_id로 조회
    List<Match> findByScheduleId(Long scheduleId);

    // draw_id로 조회
    List<Match> findByDrawId(Long drawId);

    // 마이그레이션 데이터만 조회
    List<Match> findByIsMigrated(Boolean isMigrated);

    // 특정 선수가 참여한 경기 조회 (team_a 또는 team_b)
    @Query("SELECT m FROM Match m WHERE " +
           "m.teamAPlayer1Id = :playerId OR m.teamAPlayer2Id = :playerId OR " +
           "m.teamBPlayer1Id = :playerId OR m.teamBPlayer2Id = :playerId " +
           "ORDER BY m.playedAt DESC")
    List<Match> findByPlayerId(@Param("playerId") Long playerId);

    // 특정 클럽에서 특정 선수가 참여한 경기 조회
    @Query("SELECT m FROM Match m WHERE m.clubId = :clubId AND (" +
           "m.teamAPlayer1Id = :playerId OR m.teamAPlayer2Id = :playerId OR " +
           "m.teamBPlayer1Id = :playerId OR m.teamBPlayer2Id = :playerId) " +
           "ORDER BY m.playedAt DESC")
    List<Match> findByClubIdAndPlayerId(@Param("clubId") Long clubId, @Param("playerId") Long playerId);
}
