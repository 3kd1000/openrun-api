package com.example.openrunapi.domain.calendar.service;

import com.example.openrunapi.domain.calendar.model.CalendarConnection;
import com.example.openrunapi.domain.calendar.model.CalendarEvent;
import com.example.openrunapi.domain.calendar.model.CalendarProvider;
import com.example.openrunapi.domain.calendar.repository.CalendarConnectionRepository;
import com.example.openrunapi.domain.calendar.repository.CalendarEventRepository;
import com.example.openrunapi.domain.schedule.model.Schedule;
import com.example.openrunapi.domain.schedule.repository.ScheduleParticipantRepository;
import com.example.openrunapi.domain.schedule.repository.ScheduleRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class CalendarSyncService {

    private final CalendarConnectionRepository connectionRepository;
    private final CalendarEventRepository eventRepository;
    private final ScheduleRepository scheduleRepository;
    private final ScheduleParticipantRepository participantRepository;
    private final GoogleCalendarClient googleCalendarClient;
    private final KakaoCalendarClient kakaoCalendarClient;

    /**
     * 초기 동기화: 연동 시점에 이미 참가 확정된 미래 일정을 캘린더에 추가
     */
    @Async
    @Transactional
    public void syncExistingSchedules(Long userId, CalendarConnection connection) {
        List<Long> futureScheduleIds = participantRepository.findFutureConfirmedScheduleIds(
                userId, LocalDateTime.now());

        if (futureScheduleIds.isEmpty()) {
            log.info("초기 동기화: 미래 확정 일정 없음 (userId={})", userId);
            return;
        }

        log.info("초기 동기화 시작: userId={}, 일정 {}건", userId, futureScheduleIds.size());
        List<Schedule> schedules = scheduleRepository.findAllById(futureScheduleIds);
        int successCount = 0;

        for (Schedule schedule : schedules) {
            try {
                createExternalEvent(connection, schedule);
                successCount++;
            } catch (Exception e) {
                log.error("초기 동기화 이벤트 생성 실패: scheduleId={}", schedule.getId(), e);
            }
        }
        log.info("초기 동기화 완료: userId={}, 성공 {}/{}건", userId, successCount, schedules.size());
    }

    /**
     * 참가 확정 시 외부 캘린더에 이벤트 생성 + 기존 참가자들의 캘린더 이벤트 업데이트 (정원 정보 반영)
     */
    @Async
    @Transactional
    public void onParticipantConfirmed(Long userId, Long scheduleId) {
        Schedule schedule = scheduleRepository.findById(scheduleId).orElse(null);
        if (schedule == null) return;

        // 1. 본인 캘린더에 이벤트 생성
        List<CalendarConnection> connections = connectionRepository.findByUserIdAndActiveTrue(userId);
        for (CalendarConnection connection : connections) {
            try {
                createExternalEvent(connection, schedule);
            } catch (Exception e) {
                log.error("캘린더 이벤트 생성 실패: userId={}, provider={}, scheduleId={}",
                        userId, connection.getProvider(), scheduleId, e);
            }
        }

        // 2. 기존 참가자들의 캘린더 이벤트 업데이트 (정원 정보 갱신)
        updateAllEventsForSchedule(schedule);
    }

    /**
     * 참가 취소 시 외부 캘린더에서 이벤트 삭제 + 나머지 참가자들의 캘린더 이벤트 업데이트 (정원 정보 반영)
     */
    @Async
    @Transactional
    public void onParticipantCancelled(Long userId, Long scheduleId) {
        // 1. 본인 캘린더에서 이벤트 삭제
        List<CalendarEvent> events = eventRepository.findByScheduleIdAndUserId(scheduleId, userId);
        for (CalendarEvent event : events) {
            try {
                deleteExternalEvent(event);
                eventRepository.delete(event);
            } catch (Exception e) {
                log.error("캘린더 이벤트 삭제 실패: eventId={}", event.getId(), e);
            }
        }

        // 2. 나머지 참가자들의 캘린더 이벤트 업데이트 (정원 정보 갱신)
        Schedule schedule = scheduleRepository.findById(scheduleId).orElse(null);
        if (schedule != null) {
            updateAllEventsForSchedule(schedule);
        }
    }

    /**
     * 일정 수정 시 연동된 모든 이벤트 업데이트
     */
    @Async
    @Transactional
    public void onScheduleUpdated(Long scheduleId) {
        log.info("onScheduleUpdated 호출: scheduleId={}", scheduleId);
        Schedule schedule = scheduleRepository.findById(scheduleId).orElse(null);
        if (schedule == null) {
            log.warn("onScheduleUpdated: 일정을 찾을 수 없음 scheduleId={}", scheduleId);
            return;
        }

        List<CalendarEvent> events = eventRepository.findByScheduleId(scheduleId);
        log.info("onScheduleUpdated: scheduleId={}, 동기화 대상 이벤트 {}건", scheduleId, events.size());
        for (CalendarEvent event : events) {
            try {
                updateExternalEvent(event, schedule);
                event.markSynced();
                log.info("캘린더 이벤트 업데이트 성공: eventId={}, provider={}",
                        event.getId(), event.getCalendarConnection().getProvider());
            } catch (Exception e) {
                log.error("캘린더 이벤트 업데이트 실패: eventId={}", event.getId(), e);
            }
        }
    }

    /**
     * 일정 삭제 시 연동된 모든 이벤트 삭제
     */
    @Async
    @Transactional
    public void onScheduleDeleted(Long scheduleId) {
        List<CalendarEvent> events = eventRepository.findByScheduleId(scheduleId);
        for (CalendarEvent event : events) {
            try {
                deleteExternalEvent(event);
            } catch (Exception e) {
                log.error("캘린더 이벤트 삭제 실패: eventId={}", event.getId(), e);
            }
        }
        eventRepository.deleteAllInBatch(events);
    }

    /**
     * 해당 일정에 연동된 모든 캘린더 이벤트를 업데이트 (정원 정보 등 갱신)
     */
    private void updateAllEventsForSchedule(Schedule schedule) {
        List<CalendarEvent> allEvents = eventRepository.findByScheduleId(schedule.getId());
        if (allEvents.isEmpty()) return;

        log.info("참가자 변동 → 기존 이벤트 업데이트: scheduleId={}, 대상 {}건",
                schedule.getId(), allEvents.size());
        for (CalendarEvent event : allEvents) {
            try {
                updateExternalEvent(event, schedule);
                event.markSynced();
            } catch (Exception e) {
                log.error("참가자 변동 이벤트 업데이트 실패: eventId={}", event.getId(), e);
            }
        }
    }

    private void createExternalEvent(CalendarConnection connection, Schedule schedule) {
        // 이미 동기화된 이벤트가 있는지 확인
        if (eventRepository.findByCalendarConnectionIdAndScheduleId(
                connection.getId(), schedule.getId()).isPresent()) {
            return;
        }

        String title = buildEventTitle(schedule);
        String description = buildEventDescription(schedule);
        int duration = schedule.getDurationMinutes() != null ? schedule.getDurationMinutes() : 120;

        String externalEventId = null;
        if (connection.getProvider() == CalendarProvider.GOOGLE) {
            externalEventId = googleCalendarClient.createEvent(
                    connection, title, description,
                    schedule.getScheduledAt(), duration, schedule.getCourtAddress());
        } else if (connection.getProvider() == CalendarProvider.KAKAO) {
            externalEventId = kakaoCalendarClient.createEvent(
                    connection, title, description,
                    schedule.getScheduledAt(), duration, schedule.getCourtAddress());
        }

        if (externalEventId != null) {
            CalendarEvent calendarEvent = CalendarEvent.builder()
                    .calendarConnection(connection)
                    .scheduleId(schedule.getId())
                    .externalEventId(externalEventId)
                    .build();
            eventRepository.save(calendarEvent);
        }
    }

    private void updateExternalEvent(CalendarEvent event, Schedule schedule) {
        CalendarConnection connection = event.getCalendarConnection();
        String title = buildEventTitle(schedule);
        String description = buildEventDescription(schedule);
        int duration = schedule.getDurationMinutes() != null ? schedule.getDurationMinutes() : 120;

        if (connection.getProvider() == CalendarProvider.GOOGLE) {
            googleCalendarClient.updateEvent(
                    connection, event.getExternalEventId(),
                    title, description,
                    schedule.getScheduledAt(), duration, schedule.getCourtAddress());
        } else if (connection.getProvider() == CalendarProvider.KAKAO) {
            kakaoCalendarClient.updateEvent(
                    connection, event.getExternalEventId(),
                    title, description,
                    schedule.getScheduledAt(), duration, schedule.getCourtAddress());
        }
    }

    private void deleteExternalEvent(CalendarEvent event) {
        CalendarConnection connection = event.getCalendarConnection();
        if (connection.getProvider() == CalendarProvider.GOOGLE) {
            googleCalendarClient.deleteEvent(connection, event.getExternalEventId());
        } else if (connection.getProvider() == CalendarProvider.KAKAO) {
            kakaoCalendarClient.deleteEvent(connection, event.getExternalEventId());
        }
    }

    private String buildEventTitle(Schedule schedule) {
        return "[OpenRun] " + schedule.getCourtName();
    }

    private String buildEventDescription(Schedule schedule) {
        StringBuilder sb = new StringBuilder();
        if (schedule.getMatchType() != null) {
            sb.append("경기 유형: ").append(schedule.getMatchType().name()).append("\n");
        }
        if (schedule.getMaxCapacity() != null) {
            sb.append("정원: ").append(schedule.getCurrentParticipants())
                    .append("/").append(schedule.getMaxCapacity()).append("명\n");
        }
        if (schedule.getDescription() != null) {
            sb.append("\n").append(schedule.getDescription());
        }
        return sb.toString();
    }
}
