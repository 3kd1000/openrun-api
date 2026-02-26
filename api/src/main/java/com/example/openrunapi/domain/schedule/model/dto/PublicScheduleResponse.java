package com.example.openrunapi.domain.schedule.model.dto;

import com.example.openrunapi.domain.schedule.model.Schedule;
import com.example.openrunapi.domain.user.model.User;
import com.example.openrunapi.domain.user.repository.UserRepository;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
public class PublicScheduleResponse {
    private final Long id;
    private final String courtName;
    private final String courtAddress;
    private final String region;
    private final LocalDateTime scheduledAt;
    private final Integer maxCapacity;
    private final Integer currentParticipants;
    private final BigDecimal cost;
    private final String description;
    private final String hostDisplayName;
    private final Long hostUserId;
    private final String matchType;
    private final Integer durationMinutes;
    private final Integer numberOfCourts;
    private final LocalDateTime createdAt;

    public PublicScheduleResponse(Schedule schedule, UserRepository userRepository) {
        this.id = schedule.getId();
        this.courtName = schedule.getCourtName();
        this.courtAddress = schedule.getCourtAddress();
        this.region = schedule.getRegion();
        this.scheduledAt = schedule.getScheduledAt();
        this.maxCapacity = schedule.getMaxCapacity();
        this.currentParticipants = schedule.getCurrentParticipants();
        this.cost = schedule.getCost();
        this.description = schedule.getDescription();
        this.hostUserId = schedule.getCreatedByUserId();
        this.matchType = schedule.getMatchType() != null ? schedule.getMatchType().name() : null;
        this.durationMinutes = schedule.getDurationMinutes();
        this.numberOfCourts = schedule.getNumberOfCourts();
        this.createdAt = schedule.getCreatedAt();

        if (schedule.getCreatedByUserId() != null && userRepository != null) {
            User host = userRepository.findById(schedule.getCreatedByUserId()).orElse(null);
            this.hostDisplayName = host != null ? host.getPublicDisplayName() : "알 수 없음";
        } else {
            this.hostDisplayName = "알 수 없음";
        }
    }
}
