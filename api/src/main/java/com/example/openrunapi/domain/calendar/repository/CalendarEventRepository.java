package com.example.openrunapi.domain.calendar.repository;

import com.example.openrunapi.domain.calendar.model.CalendarEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface CalendarEventRepository extends JpaRepository<CalendarEvent, Long> {

    Optional<CalendarEvent> findByCalendarConnectionIdAndScheduleId(Long calendarConnectionId, Long scheduleId);

    List<CalendarEvent> findByScheduleId(Long scheduleId);

    @Query("SELECT ce FROM CalendarEvent ce JOIN ce.calendarConnection cc " +
           "WHERE ce.scheduleId = :scheduleId AND cc.userId = :userId AND cc.active = true")
    List<CalendarEvent> findByScheduleIdAndUserId(@Param("scheduleId") Long scheduleId,
                                                   @Param("userId") Long userId);

    void deleteByCalendarConnectionId(Long calendarConnectionId);
}
