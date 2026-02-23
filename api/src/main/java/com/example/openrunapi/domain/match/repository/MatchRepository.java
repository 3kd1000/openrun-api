package com.example.openrunapi.domain.match.repository;

import com.example.openrunapi.domain.match.model.Match;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Modifying;
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

    // 사용자가 참여한 모든 경기 조회 (클럽 무관, 페이징, 결과가 있는 경기만)
    @Query("SELECT m FROM Match m WHERE m.result IS NOT NULL AND (" +
           "m.teamAPlayer1Id = :userId OR m.teamAPlayer2Id = :userId OR " +
           "m.teamBPlayer1Id = :userId OR m.teamBPlayer2Id = :userId) " +
           "ORDER BY m.playedAt DESC")
    Page<Match> findAllByPlayerIdWithResult(@Param("userId") Long userId, Pageable pageable);

    /**
     * 탈퇴한 사용자의 경기 기록 익명화 (player_id를 null로 설정)
     */
    @Modifying
    @Query("UPDATE Match m SET m.teamAPlayer1Id = null WHERE m.teamAPlayer1Id = :userId")
    void anonymizeTeamAPlayer1(@Param("userId") Long userId);

    @Modifying
    @Query("UPDATE Match m SET m.teamAPlayer2Id = null WHERE m.teamAPlayer2Id = :userId")
    void anonymizeTeamAPlayer2(@Param("userId") Long userId);

    @Modifying
    @Query("UPDATE Match m SET m.teamBPlayer1Id = null WHERE m.teamBPlayer1Id = :userId")
    void anonymizeTeamBPlayer1(@Param("userId") Long userId);

    @Modifying
    @Query("UPDATE Match m SET m.teamBPlayer2Id = null WHERE m.teamBPlayer2Id = :userId")
    void anonymizeTeamBPlayer2(@Param("userId") Long userId);

    /**
     * 특정 일정의 대진에 포함된 모든 userId 조회
     * (대진 무효화 판단용)
     */
    @Query("SELECT DISTINCT CASE " +
           "WHEN m.teamAPlayer1Id IS NOT NULL THEN m.teamAPlayer1Id " +
           "WHEN m.teamAPlayer2Id IS NOT NULL THEN m.teamAPlayer2Id " +
           "WHEN m.teamBPlayer1Id IS NOT NULL THEN m.teamBPlayer1Id " +
           "ELSE m.teamBPlayer2Id END " +
           "FROM Match m WHERE m.scheduleId = :scheduleId")
    List<Long> findDistinctUserIdsByScheduleId(@Param("scheduleId") Long scheduleId);

    /**
     * 특정 일정의 대진에 특정 userId가 포함되어 있는지 확인
     */
    @Query("SELECT CASE WHEN COUNT(m) > 0 THEN true ELSE false END FROM Match m " +
           "WHERE m.scheduleId = :scheduleId AND (" +
           "m.teamAPlayer1Id = :userId OR m.teamAPlayer2Id = :userId OR " +
           "m.teamBPlayer1Id = :userId OR m.teamBPlayer2Id = :userId)")
    boolean existsUserInDraw(@Param("scheduleId") Long scheduleId, @Param("userId") Long userId);

    /**
     * 특정 일정의 대진에 특정 게스트 이름이 포함되어 있는지 확인
     */
    @Query("SELECT CASE WHEN COUNT(m) > 0 THEN true ELSE false END FROM Match m WHERE m.scheduleId = :scheduleId AND (m.teamAPlayer1GuestName = :guestName OR m.teamAPlayer2GuestName = :guestName OR m.teamBPlayer1GuestName = :guestName OR m.teamBPlayer2GuestName = :guestName)")
    boolean existsGuestInDraw(@Param("scheduleId") Long scheduleId, @Param("guestName") String guestName);
}
