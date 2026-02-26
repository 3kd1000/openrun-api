package com.example.openrunapi.domain.schedule.repository;

import com.example.openrunapi.domain.schedule.model.Schedule;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
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

    /**
     * 특정 클럽의 최근 일정 50개 조회 (Admin용)
     */
    List<Schedule> findTop50ByClubIdOrderByScheduledAtDesc(Long clubId);

    /**
     * 특정 클럽의 일정 페이징 조회 (Admin용)
     */
    Page<Schedule> findByClubIdOrderByScheduledAtDesc(Long clubId, Pageable pageable);

    /**
     * 커서 기반 페이지네이션: 과거 방향 (pivotDate 이전, 내림차순)
     * Infinite Scroll 리스트뷰용
     */
    @Query("""
        SELECT s FROM Schedule s
        WHERE s.clubId = :clubId AND s.scheduledAt < :pivotDate
        ORDER BY s.scheduledAt DESC
    """)
    List<Schedule> findByClubIdPast(
            @Param("clubId") Long clubId,
            @Param("pivotDate") LocalDateTime pivotDate,
            Pageable pageable
    );

    /**
     * 커서 기반 페이지네이션: 미래 방향 (pivotDate 이후, 오름차순)
     * Infinite Scroll 리스트뷰용
     */
    @Query("""
        SELECT s FROM Schedule s
        WHERE s.clubId = :clubId AND s.scheduledAt >= :pivotDate
        ORDER BY s.scheduledAt ASC
    """)
    List<Schedule> findByClubIdFuture(
            @Param("clubId") Long clubId,
            @Param("pivotDate") LocalDateTime pivotDate,
            Pageable pageable
    );

    /**
     * 특정 클럽의 전체 일정 수 조회
     */
    long countByClubId(Long clubId);

    /**
     * 특정 클럽에서 pivotDate 이전의 일정 수 조회
     */
    long countByClubIdAndScheduledAtBefore(Long clubId, LocalDateTime pivotDate);

    /**
     * 특정 클럽에서 pivotDate 이후의 일정 수 조회
     */
    long countByClubIdAndScheduledAtGreaterThanEqual(Long clubId, LocalDateTime pivotDate);

    /**
     * 공개 일정 목록 조회 (미래 일정, 오름차순)
     */
    @Query("SELECT s FROM Schedule s WHERE s.scheduleType = 'PUBLIC' AND s.scheduledAt > :now ORDER BY s.scheduledAt ASC")
    List<Schedule> findPublicSchedules(@Param("now") LocalDateTime now, Pageable pageable);

    /**
     * 지역별 공개 일정 목록 조회
     */
    @Query("SELECT s FROM Schedule s WHERE s.scheduleType = 'PUBLIC' AND s.scheduledAt > :now AND s.region = :region ORDER BY s.scheduledAt ASC")
    List<Schedule> findPublicSchedulesByRegion(@Param("now") LocalDateTime now, @Param("region") String region, Pageable pageable);

    /**
     * 특정 사용자가 생성한 공개 일정 목록 조회
     */
    @Query("SELECT s FROM Schedule s WHERE s.scheduleType = 'PUBLIC' AND s.createdByUserId = :userId ORDER BY s.scheduledAt DESC")
    List<Schedule> findPublicSchedulesByCreator(@Param("userId") Long userId);

    /**
     * 내일 일정 조회 (리마인드 알림용)
     */
    @Query("SELECT s FROM Schedule s WHERE s.scheduledAt >= :start AND s.scheduledAt < :end")
    List<Schedule> findSchedulesBetween(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    /**
     * 특정 사용자가 생성한 공개 일정 수 조회
     */
    @Query("SELECT COUNT(s) FROM Schedule s WHERE s.scheduleType = 'PUBLIC' AND s.createdByUserId = :userId")
    long countPublicSchedulesByCreator(@Param("userId") Long userId);
}
