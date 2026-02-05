package com.example.openrunapi.domain.notification.model.dto;

import com.example.openrunapi.domain.schedule.model.Schedule;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
public class AdminScheduleSimpleResponse {
    private final Long id;
    private final String courtName;
    private final LocalDateTime scheduledAt;
    private final Integer maxCapacity;
    private final Integer currentParticipants;
    private final Boolean isDrawValid;

    public AdminScheduleSimpleResponse(Schedule schedule) {
        this.id = schedule.getId();
        this.courtName = schedule.getCourtName();
        this.scheduledAt = schedule.getScheduledAt();
        this.maxCapacity = schedule.getMaxCapacity();
        this.currentParticipants = schedule.getCurrentParticipants();
        this.isDrawValid = Boolean.TRUE.equals(schedule.getIsDrawValid());
    }
}
