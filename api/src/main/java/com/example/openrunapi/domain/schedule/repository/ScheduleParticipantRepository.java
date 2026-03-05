package com.example.openrunapi.domain.schedule.repository;

import com.example.openrunapi.domain.schedule.model.ScheduleParticipant;
import com.example.openrunapi.domain.schedule.model.ScheduleParticipant.ParticipantStatus;
import com.example.openrunapi.domain.schedule.model.dto.ParticipantResponse;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ScheduleParticipantRepository extends JpaRepository<ScheduleParticipant, Long> {

    // 특정 일정의 모든 참가자 조회
    List<ScheduleParticipant> findByScheduleIdOrderByPositionAsc(Long scheduleId);

    // 특정 일정의 취소되지 않은 참가자만 조회
    @Query("SELECT sp FROM ScheduleParticipant sp WHERE sp.scheduleId = :scheduleId AND sp.status != :status ORDER BY sp.position ASC")
    List<ScheduleParticipant> findActiveParticipantsByScheduleId(@Param("scheduleId") Long scheduleId, @Param("status") ParticipantStatus status);

    // 특정 일정의 취소되지 않은 참가자 수
    @Query("SELECT COUNT(sp) FROM ScheduleParticipant sp WHERE sp.scheduleId = :scheduleId AND sp.status != :status")
    Long countActiveParticipants(@Param("scheduleId") Long scheduleId, @Param("status") ParticipantStatus status);

    // 특정 사용자의 특정 일정 참가 신청 내역 조회 (취소되지 않은 것만)
    @Query("SELECT sp FROM ScheduleParticipant sp WHERE sp.scheduleId = :scheduleId AND sp.userId = :userId AND sp.status != :status")
    Optional<ScheduleParticipant> findActiveParticipation(@Param("scheduleId") Long scheduleId, @Param("userId") Long userId, @Param("status") ParticipantStatus status);

    // 특정 일정의 다음 position 번호 가져오기
    @Query("SELECT COALESCE(MAX(sp.position), 0) + 1 FROM ScheduleParticipant sp WHERE sp.scheduleId = :scheduleId")
    Integer getNextPosition(@Param("scheduleId") Long scheduleId);

    // 특정 일정의 최대 position 번호 가져오기
    @Query("SELECT MAX(sp.position) FROM ScheduleParticipant sp WHERE sp.scheduleId = :scheduleId")
    Integer getMaxPosition(@Param("scheduleId") Long scheduleId);

    // 특정 사용자가 특정 일정에 신청했는지 확인 (취소 포함)
    boolean existsByScheduleIdAndUserId(Long scheduleId, Long userId);

    // 특정 사용자가 참여한 일정 ID 목록 조회 (CONFIRMED, WAITING만)
    @Query("SELECT sp.scheduleId FROM ScheduleParticipant sp WHERE sp.userId = :userId AND sp.status IN ('CONFIRMED', 'WAITING')")
    List<Long> findScheduleIdsByUserId(@Param("userId") Long userId);

    // 특정 사용자의 취소되지 않은 참가 신청 목록 조회 (배치 처리용)
    @Query("SELECT sp FROM ScheduleParticipant sp WHERE sp.userId = :userId AND sp.status != :status")
    List<ScheduleParticipant> findByUserIdAndStatusNot(@Param("userId") Long userId, @Param("status") ParticipantStatus status);

    // 특정 일정의 취소되지 않은 참가자 + userName JOIN 조회 (게스트 포함)
    @Query("""
        SELECT new com.example.openrunapi.domain.schedule.model.dto.ParticipantResponse(
            sp.id, sp.scheduleId, sp.userId, COALESCE(u.name, sp.guestName), sp.guestName, CAST(sp.status AS string), sp.position, sp.joinedAt, sp.asGuest
        )
        FROM ScheduleParticipant sp
        LEFT JOIN User u ON sp.userId = u.id
        WHERE sp.scheduleId = :scheduleId AND sp.status != :status
        ORDER BY sp.position ASC
    """)
    List<ParticipantResponse> findActiveParticipantsWithUserName(@Param("scheduleId") Long scheduleId, @Param("status") ParticipantStatus status);

    // 특정 사용자의 특정 일정 참가 신청 내역 + userName JOIN 조회
    @Query("""
        SELECT new com.example.openrunapi.domain.schedule.model.dto.ParticipantResponse(
            sp.id, sp.scheduleId, sp.userId, COALESCE(u.name, sp.guestName), sp.guestName, CAST(sp.status AS string), sp.position, sp.joinedAt, sp.asGuest
        )
        FROM ScheduleParticipant sp
        LEFT JOIN User u ON sp.userId = u.id
        WHERE sp.scheduleId = :scheduleId AND sp.userId = :userId AND sp.status != :status
    """)
    Optional<ParticipantResponse> findActiveParticipationWithUserName(@Param("scheduleId") Long scheduleId, @Param("userId") Long userId, @Param("status") ParticipantStatus status);

    // 대기 순번 계산 (특정 일정의 WAITING 상태에서 나보다 먼저 신청한 사람 수 + 1)
    @Query("SELECT COUNT(sp) + 1 FROM ScheduleParticipant sp " +
           "WHERE sp.scheduleId = :scheduleId " +
           "AND sp.status = 'WAITING' " +
           "AND sp.joinedAt < :joinedAt")
    Long calculateWaitingNumber(@Param("scheduleId") Long scheduleId, @Param("joinedAt") java.time.LocalDateTime joinedAt);

    /**
     * 특정 사용자가 CONFIRMED 상태이고, 일정이 미래인 scheduleId 목록 조회 (캘린더 초기 동기화용)
     */
    @Query("SELECT sp.scheduleId FROM ScheduleParticipant sp JOIN Schedule s ON sp.scheduleId = s.id " +
           "WHERE sp.userId = :userId AND sp.status = 'CONFIRMED' AND s.scheduledAt > :now")
    List<Long> findFutureConfirmedScheduleIds(@Param("userId") Long userId, @Param("now") java.time.LocalDateTime now);

    /**
     * 탈퇴한 사용자의 참가 기록 익명화 (user_id를 null로 설정)
     */
    @Modifying
    @Query("UPDATE ScheduleParticipant sp SET sp.userId = null WHERE sp.userId = :userId")
    void anonymizeByUserId(@Param("userId") Long userId);

    /**
     * 특정 일정의 게스트(비회원) 참가자 조회
     */
    @Query("SELECT sp FROM ScheduleParticipant sp WHERE sp.scheduleId = :scheduleId AND sp.userId IS NULL AND sp.guestName IS NOT NULL AND sp.status != 'CANCELLED' ORDER BY sp.position ASC")
    List<ScheduleParticipant> findGuestParticipantsByScheduleId(@Param("scheduleId") Long scheduleId);

    /**
     * 특정 일정에 동일한 guestName이 이미 존재하는지 확인 (취소 제외)
     */
    @Query("SELECT CASE WHEN COUNT(sp) > 0 THEN true ELSE false END FROM ScheduleParticipant sp WHERE sp.scheduleId = :scheduleId AND sp.guestName = :guestName AND sp.status != 'CANCELLED'")
    boolean existsByScheduleIdAndGuestName(@Param("scheduleId") Long scheduleId, @Param("guestName") String guestName);
}
