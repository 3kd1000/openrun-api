package com.example.openrunapi.domain.schedule.service;

import com.example.openrunapi.domain.notification.model.NotificationType;
import com.example.openrunapi.domain.notification.service.NotificationService;
import com.example.openrunapi.domain.schedule.model.Schedule;
import com.example.openrunapi.domain.schedule.model.ScheduleParticipant;
import com.example.openrunapi.domain.schedule.model.ScheduleParticipant.ParticipantStatus;
import com.example.openrunapi.domain.schedule.repository.ScheduleParticipantRepository;
import com.example.openrunapi.domain.schedule.repository.ScheduleRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ScheduleReminderService {

    private static final ZoneId KST = ZoneId.of("Asia/Seoul");
    private static final DateTimeFormatter TIME_FORMAT = DateTimeFormatter.ofPattern("HH:mm");

    private final ScheduleRepository scheduleRepository;
    private final ScheduleParticipantRepository participantRepository;
    private final NotificationService notificationService;

    @Transactional(readOnly = true)
    public String sendReminders() {
        LocalDate tomorrow = LocalDate.now(KST).plusDays(1);
        LocalDateTime start = tomorrow.atStartOfDay();
        LocalDateTime end = tomorrow.atTime(LocalTime.MAX);

        List<Schedule> tomorrowSchedules = scheduleRepository.findSchedulesBetween(start, end);
        log.info("[ScheduleReminder] 내일({}) 일정 수: {}", tomorrow, tomorrowSchedules.size());

        int totalSent = 0;
        for (Schedule schedule : tomorrowSchedules) {
            List<Long> confirmedUserIds = participantRepository
                    .findActiveParticipantsByScheduleId(schedule.getId(), ParticipantStatus.CANCELLED)
                    .stream()
                    .filter(p -> p.getStatus() == ParticipantStatus.CONFIRMED && p.getUserId() != null)
                    .map(ScheduleParticipant::getUserId)
                    .collect(Collectors.toList());

            if (confirmedUserIds.isEmpty()) {
                continue;
            }

            String timeStr = schedule.getScheduledAt().format(TIME_FORMAT);
            String body = "내일 " + schedule.getCourtName() + " 일정이 있습니다 (" + timeStr + ")";

            try {
                notificationService.sendNotification(
                        schedule.getClubId(), confirmedUserIds,
                        "일정 리마인드", body,
                        NotificationType.SCHEDULE, schedule.getId(), "SCHEDULE");
                totalSent += confirmedUserIds.size();
            } catch (Exception e) {
                log.warn("[ScheduleReminder] 알림 발송 실패 - scheduleId={}: {}", schedule.getId(), e.getMessage());
            }
        }

        String result = String.format("내일 일정 %d개, 알림 %d건 발송", tomorrowSchedules.size(), totalSent);
        log.info("[ScheduleReminder] {}", result);
        return result;
    }
}
