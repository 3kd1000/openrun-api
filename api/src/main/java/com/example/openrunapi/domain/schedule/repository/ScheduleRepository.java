package com.example.openrunapi.domain.schedule.repository;

import com.example.openrunapi.domain.schedule.model.Schedule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface ScheduleRepository extends JpaRepository<Schedule, Long>, JpaSpecificationExecutor<Schedule> {

    /**
     * 특정 클럽의 모든 일정 조회
     */
    List<Schedule> findByClubId(Long clubId);

    /**
     * 특정 클럽의 일정을 날짜 범위로 조회
     */
    List<Schedule> findByClubIdAndScheduledAtBetween(Long clubId, LocalDateTime start, LocalDateTime end);

    /**
     * 특정 날짜 이후의 일정 조회 (오름차순)
     */
    List<Schedule> findByClubIdAndScheduledAtAfterOrderByScheduledAtAsc(Long clubId, LocalDateTime after);

    /**
     * 공개 게스트 모집 중인 향후 일정 조회 (오름차순)
     */
    List<Schedule> findByGuestRecruitOpenTrueAndScheduledAtAfterOrderByScheduledAtAsc(LocalDateTime after);

    /**
     * 공개 교류전 모집 중인 향후 일정 조회 (오름차순)
     */
    List<Schedule> findByInterclubRecruitOpenTrueAndScheduledAtAfterOrderByScheduledAtAsc(LocalDateTime after);

    /**
     * 과거 일정 중 pinned/guestRecruitOpen/interclubRecruitOpen이 하나라도 true인 일정 조회
     * (배치 작업용)
     */
    @Query("SELECT s FROM Schedule s WHERE s.scheduledAt < :currentTime " +
           "AND (s.pinned = true OR s.guestRecruitOpen = true OR s.interclubRecruitOpen = true)")
    List<Schedule> findExpiredSchedulesWithActiveFlags(@Param("currentTime") LocalDateTime currentTime);

    /**
     * 클럽별 일정 수와 참가자 수 집계 (활동 요약용)
     * @return Object[] { clubId (Long), scheduleCount (Long), totalParticipants (Long) }
     */
    @Query("SELECT s.clubId, COUNT(s), SUM(s.currentParticipants) " +
           "FROM Schedule s GROUP BY s.clubId")
    List<Object[]> getActivityStatsByClub();
}
