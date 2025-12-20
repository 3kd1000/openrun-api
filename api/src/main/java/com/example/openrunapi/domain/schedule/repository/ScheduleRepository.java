package com.example.openrunapi.domain.schedule.repository;

import com.example.openrunapi.domain.schedule.model.Schedule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

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
}
