package com.example.openrunapi.domain.schedule.model.dto;

import com.example.openrunapi.domain.schedule.model.Schedule;
import com.example.openrunapi.domain.user.model.User;
import com.example.openrunapi.domain.user.repository.UserRepository;
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
    private final Long reservedByUserId;
    private final String reservedByUserName;
    private final LocalDateTime participationStartAt;
    private final String drawType;
    private final Boolean isDrawValid;
    private final LocalDateTime drawCreatedAt;
    private final LocalDateTime createdAt;
    private final LocalDateTime updatedAt;

    public ScheduleResponse(Schedule schedule) {
        this(schedule, null);
    }

    public ScheduleResponse(Schedule schedule, UserRepository userRepository) {
        this.id = schedule.getId();
        this.clubId = schedule.getClubId();
        this.courtName = schedule.getCourtName();
        this.scheduledAt = schedule.getScheduledAt();
        this.maxCapacity = schedule.getMaxCapacity();
        this.currentParticipants = schedule.getCurrentParticipants();
        this.cost = schedule.getCost();
        this.description = schedule.getDescription();
        this.reservedByUserId = schedule.getReservedByUserId();

        // 예약자 이름 조회 (userRepository가 제공된 경우에만)
        if (schedule.getReservedByUserId() != null && userRepository != null) {
            this.reservedByUserName = userRepository.findById(schedule.getReservedByUserId())
                    .map(User::getName)
                    .orElse(null);
        } else {
            this.reservedByUserName = null;
        }

        this.participationStartAt = schedule.getParticipationStartAt();
        this.drawType = schedule.getDrawType() != null ? schedule.getDrawType().name() : null;
        this.isDrawValid = schedule.getIsDrawValid();
        this.drawCreatedAt = schedule.getDrawCreatedAt();
        this.createdAt = schedule.getCreatedAt();
        this.updatedAt = schedule.getUpdatedAt();
    }
}
