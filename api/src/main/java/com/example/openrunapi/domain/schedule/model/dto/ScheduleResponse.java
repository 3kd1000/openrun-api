package com.example.openrunapi.domain.schedule.model.dto;

import com.example.openrunapi.domain.schedule.model.Schedule;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
public class ScheduleResponse {

    private final Long id;
    private final Long clubId;
    private final String courtName;
    private final LocalDateTime scheduledAt;
    private final Integer maxCapacity;
    private final Integer currentParticipants;
    private final BigDecimal cost;
    private final String description;
    private final LocalDateTime createdAt;
    private final LocalDateTime updatedAt;

    public ScheduleResponse(Schedule schedule) {
        this.id = schedule.getId();
        this.clubId = schedule.getClubId();
        this.courtName = schedule.getCourtName();
        this.scheduledAt = schedule.getScheduledAt();
        this.maxCapacity = schedule.getMaxCapacity();
        this.currentParticipants = schedule.getCurrentParticipants();
        this.cost = schedule.getCost();
        this.description = schedule.getDescription();
        this.createdAt = schedule.getCreatedAt();
        this.updatedAt = schedule.getUpdatedAt();
    }
}
