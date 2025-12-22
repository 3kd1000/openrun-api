package com.example.openrunapi.domain.schedule.repository;

import com.example.openrunapi.domain.schedule.model.ScheduleParticipant;
import com.example.openrunapi.domain.schedule.model.ScheduleParticipant.ParticipantStatus;
import org.springframework.data.jpa.repository.JpaRepository;
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

    // 특정 사용자가 특정 일정에 신청했는지 확인 (취소 포함)
    boolean existsByScheduleIdAndUserId(Long scheduleId, Long userId);

    // 특정 사용자가 참여한 일정 ID 목록 조회 (CONFIRMED, WAITING만)
    @Query("SELECT sp.scheduleId FROM ScheduleParticipant sp WHERE sp.userId = :userId AND sp.status IN ('CONFIRMED', 'WAITING')")
    List<Long> findScheduleIdsByUserId(@Param("userId") Long userId);
}
